// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/cdp.js
// kind: full-copy
// name: cdp.js
// byteRange: [0, 8392)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const cdp = (() => {
  const cdpOrigins = new Set();
  const attachedTabs = new Set();
  const tabOrigins = new Map();

  // Per-tab cache of the top-level frame id and the executionContextId of
  // the isolated world that holds browser-kit.js. Reset on detach, tab
  // removal, or cross-document navigation.
  //
  // Running browser-kit in an isolated world is the same security boundary
  // jarvis enforces (see `tools/hatch-browser/src/extension.rs`): page JS
  // cannot observe or tamper with `executeHatchCommand` /
  // `buildSnapshotFromAXNodes`, and objectIds returned by `DOM.resolveNode`
  // with the matching `executionContextId` can only be dereferenced in that
  // world.
  const isolatedWorlds = new Map();
  const ISOLATED_WORLD_NAME = 'hatch-browser-kit';

  function isCSPError(err) {
    const msg = err?.message || '';
    return msg.includes('Cannot access') ||
      msg.includes('Content Security Policy') ||
      msg.includes('could not be established') ||
      msg.includes('Cannot access a chrome') ||
      msg.includes('No frame with given id');
  }

  async function getTabOrigin(tabId) {
    if (tabOrigins.has(tabId)) return tabOrigins.get(tabId);
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url) {
        const origin = new URL(tab.url).origin;
        tabOrigins.set(tabId, origin);
        return origin;
      }
    } catch {}
    return null;
  }

  async function shouldUseCdp(tabId) {
    const origin = await getTabOrigin(tabId);
    return origin ? cdpOrigins.has(origin) : false;
  }

  async function markCdpOnly(tabId) {
    const origin = await getTabOrigin(tabId);
    if (origin) {
      cdpOrigins.add(origin);
      console.log('[Hatch CDP] Origin marked as CDP-only:', origin);
    }
  }

  async function ensureAttached(tabId) {
    if (attachedTabs.has(tabId)) return;
    try {
      await chrome.debugger.attach({ tabId }, '1.3');
      attachedTabs.add(tabId);
    } catch (err) {
      if (err.message?.includes('Already attached')) {
        attachedTabs.add(tabId);
        return;
      }
      throw new Error(`CDP attach failed: ${err.message}`);
    }
  }

  async function detach(tabId) {
    if (!attachedTabs.has(tabId)) return;
    try { await chrome.debugger.detach({ tabId }); } catch {}
    attachedTabs.delete(tabId);
    isolatedWorlds.delete(tabId);
  }

  function isAttached(tabId) {
    return attachedTabs.has(tabId);
  }

  async function _topFrameId(tabId) {
    const tree = await chrome.debugger.sendCommand({ tabId }, 'Page.getFrameTree');
    return tree?.frameTree?.frame?.id || null;
  }

  async function _probeWorldHasKit(tabId, contextId) {
    try {
      const { result } = await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: "typeof executeHatchCommand === 'function'",
        returnByValue: true,
        contextId,
      });
      return result?.value === true;
    } catch {
      return false;
    }
  }

  async function _createIsolatedWorld(tabId, frameId) {
    // `grantUniveralAccess` is the canonical CDP spelling (note the typo);
    // do not "fix" it.
    const { executionContextId } = await chrome.debugger.sendCommand(
      { tabId },
      'Page.createIsolatedWorld',
      {
        frameId,
        worldName: ISOLATED_WORLD_NAME,
        grantUniveralAccess: true,
      }
    );
    return executionContextId;
  }

  async function _injectKit(tabId, contextId) {
    // browser-kit.js is loaded via importScripts in background.js and
    // exposes its functions on the service worker global. The source text
    // isn't retained after import, so re-injection uses the function
    // sources directly. This mirrors the jarvis Rust path that
    // `include_str!`s browser-kit.js into the binary.
    const kitSource = _browserKitSource();
    const { exceptionDetails } = await chrome.debugger.sendCommand(
      { tabId },
      'Runtime.evaluate',
      {
        expression: kitSource,
        returnByValue: true,
        contextId,
      }
    );
    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ||
        exceptionDetails.text ||
        'browser-kit.js injection failed'
      );
    }
  }

  // Reconstruct browser-kit source by concatenating the exposed functions.
  // browser-kit.js is loaded via importScripts at service-worker startup,
  // so the raw text isn't available, but each exported function's
  // `.toString()` is. This keeps the extension side free of a second
  // source-of-truth copy while still enabling isolated-world injection.
  function _browserKitSource() {
    const fns = [
      'checkIfBlocked',
      'describePageElements',
      'clickElement',
      'typeIntoElement',
      'selectOption',
      'scrollPage',
      'dispatchKey',
      'fillForm',
      'snapshotPage',
      'extractPageContent',
      'buildSnapshotFromAXNodes',
      'executeHatchCommand',
      'executeHatchCommandAsync',
      'waitForSettle',
    ];
    const parts = [];
    for (const name of fns) {
      const fn = globalThis[name];
      if (typeof fn === 'function') parts.push(fn.toString());
    }
    return parts.join('\n;\n');
  }

  async function ensureIsolatedWorld(tabId) {
    await ensureAttached(tabId);
    const cached = isolatedWorlds.get(tabId);
    if (cached?.contextId) {
      if (await _probeWorldHasKit(tabId, cached.contextId)) {
        return cached.contextId;
      }
      isolatedWorlds.delete(tabId);
    }

    const frameId = await _topFrameId(tabId);
    if (!frameId) throw new Error('Page.getFrameTree returned no top frame');
    const contextId = await _createIsolatedWorld(tabId, frameId);
    await _injectKit(tabId, contextId);
    isolatedWorlds.set(tabId, { frameId, contextId });
    return contextId;
  }

  function getCachedIsolatedWorld(tabId) {
    return isolatedWorlds.get(tabId) || null;
  }

  function clearIsolatedWorld(tabId) {
    isolatedWorlds.delete(tabId);
  }

  async function evaluate(tabId, expression, options = {}) {
    await ensureAttached(tabId);
    const payload = {
      expression,
      returnByValue: true,
      awaitPromise: options.awaitPromise !== false,
    };
    if (options.contextId != null) payload.contextId = options.contextId;
    const { result, exceptionDetails } = await chrome.debugger.sendCommand(
      { tabId }, 'Runtime.evaluate', payload
    );
    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ||
        exceptionDetails.text ||
        'CDP evaluate failed'
      );
    }
    return result.value;
  }

  async function evaluateInIsolatedWorld(tabId, expression, options = {}) {
    const contextId = await ensureIsolatedWorld(tabId);
    return await evaluate(tabId, expression, { ...options, contextId });
  }

  async function sendCommand(tabId, method, params = {}) {
    await ensureAttached(tabId);
    return await chrome.debugger.sendCommand({ tabId }, method, params);
  }

  async function injectAndRun(tabId, func, args = []) {
    const argsStr = args.map((a) => JSON.stringify(a)).join(', ');
    const expression = `(${func.toString()})(${argsStr})`;
    // Run page-interaction helpers in the isolated world so page scripts
    // cannot tamper with HTMLElement.prototype, Event constructors, or
    // any of the DOM accessors the kit relies on.
    return await evaluateInIsolatedWorld(tabId, expression);
  }

  chrome.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      attachedTabs.delete(source.tabId);
      isolatedWorlds.delete(source.tabId);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    attachedTabs.delete(tabId);
    tabOrigins.delete(tabId);
    isolatedWorlds.delete(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      tabOrigins.delete(tabId);
      // Cross-document navigation destroys the isolated world; force a
      // fresh `Page.createIsolatedWorld` on the next command.
      isolatedWorlds.delete(tabId);
    }
  });

  return {
    isCSPError, shouldUseCdp, markCdpOnly,
    ensureAttached, detach, isAttached,
    evaluate, evaluateInIsolatedWorld, sendCommand, injectAndRun,
    ensureIsolatedWorld, getCachedIsolatedWorld, clearIsolatedWorld,
  };
})();
