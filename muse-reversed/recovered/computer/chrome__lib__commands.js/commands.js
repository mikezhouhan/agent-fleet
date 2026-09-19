// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/commands.js
// kind: full-copy
// name: commands.js
// byteRange: [0, 66566)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

let _lastOperatedTabId = null;

// Tabs the agent has opened or operated on. The blocklist gates AGENT-initiated
// navigation only, so `webNavigation` enforcement in background.js consults this
// set: without it, the same listener would also stop the USER from opening
// agent.meta.ai by hand, which is this extension's own pairing flow.
//
// Mirrored into `chrome.storage.session` because the MV3 service worker is torn
// down whenever it goes idle. In-memory alone, a restart would empty the set and
// leave webNavigation enforcement inert for tabs already under agent control —
// the command handlers re-mark on their next call, but a delayed redirect firing
// before that would go unchecked.
const AGENT_TABS_KEY = '_agentTabIds';
const _agentTabIds = new Set();
let _agentTabsHydrated = null;

function hydrateAgentTabs() {
  if (!_agentTabsHydrated) {
    _agentTabsHydrated = chrome.storage.session
      .get(AGENT_TABS_KEY)
      .then((stored) => {
        for (const id of stored?.[AGENT_TABS_KEY] ?? []) _agentTabIds.add(id);
      })
      .catch(() => {});
  }
  return _agentTabsHydrated;
}

function persistAgentTabs() {
  try {
    chrome.storage.session.set({ [AGENT_TABS_KEY]: [..._agentTabIds] })?.catch?.(() => {});
  } catch {}
}

function markAgentTab(tabId) {
  if (tabId == null) return;
  _agentTabIds.add(tabId);
  persistAgentTabs();
}

function isAgentTab(tabId) {
  return _agentTabIds.has(tabId);
}

async function isAgentTabAsync(tabId) {
  if (_agentTabIds.has(tabId)) return true;
  await hydrateAgentTabs();
  return _agentTabIds.has(tabId);
}

function forgetAgentTab(tabId) {
  if (_agentTabIds.delete(tabId)) persistAgentTabs();
}

async function getActiveTab() {
  if (_lastOperatedTabId != null) {
    try {
      return await chrome.tabs.get(_lastOperatedTabId);
    } catch {
      _lastOperatedTabId = null;
    }
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) throw new Error('No active tab found');
  return tab;
}

class BlockedSiteError extends Error {}

function ensureAllowedTab(tab) {
  if (tab?.id == null || !tab.url) {
    throw new BlockedSiteError('The browser tab URL could not be verified.');
  }
  for (const target of [tab.url, tab.pendingUrl]) {
    if (target && hatchBlockedSites.isBlockedTargetUrl(target)) {
      throw new BlockedSiteError(hatchBlockedSites.blockedUrlMessage(target));
    }
  }
  return tab;
}

const _checkedFrameStates = new WeakMap();

async function checkedFrameState(tab) {
  let frames;
  let timer;
  try {
    frames = await Promise.race([
      chrome.webNavigation.getAllFrames({ tabId: tab.id }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Frame lookup timed out')), 1000);
      }),
    ]);
  } catch {
    throw new BlockedSiteError('The browser frame privacy could not be verified.');
  } finally {
    clearTimeout(timer);
  }
  const fail = () => {
    throw new BlockedSiteError('The browser frame privacy could not be verified.');
  };
  if (!Array.isArray(frames) || frames.length === 0 || frames.length > 1024) fail();
  const byId = new Map();
  let urlBytes = 0;
  for (const frame of frames) {
    if (
      !frame || !Number.isSafeInteger(frame.frameId) || frame.frameId < 0 ||
      !Number.isSafeInteger(frame.parentFrameId) || frame.parentFrameId < -1 ||
      byId.has(frame.frameId) || frame.errorOccurred !== false ||
      typeof frame.url !== 'string' || frame.url.length === 0 || frame.url.length > 8192 ||
      (frame.documentId !== undefined && (
        typeof frame.documentId !== 'string' || !frame.documentId || frame.documentId.length > 256
      )) ||
      (frame.documentLifecycle !== undefined && frame.documentLifecycle !== 'active')
    ) fail();
    urlBytes += frame.url.length;
    if (urlBytes > 1024 * 1024) fail();
    let parsed;
    try {
      parsed = new URL(frame.url);
    } catch {
      fail();
    }
    const inherited = frame.parentFrameId >= 0 && parsed.protocol === 'about:' &&
      (parsed.pathname === 'blank' || parsed.pathname === 'srcdoc') && !parsed.search;
    if (!inherited && hatchBlockedSites.isBlockedTargetUrl(frame.url)) {
      throw new BlockedSiteError(hatchBlockedSites.blockedUrlMessage(frame.url));
    }
    byId.set(frame.frameId, frame);
  }
  const root = byId.get(0);
  if (!root || root.parentFrameId !== -1 || new URL(root.url).href !== new URL(tab.url).href) fail();
  const rooted = new Set([0]);
  for (const frame of frames) {
    const path = new Set();
    let current = frame;
    while (!rooted.has(current.frameId)) {
      if (path.has(current.frameId)) fail();
      path.add(current.frameId);
      current = byId.get(current.parentFrameId);
      if (!current) fail();
    }
    for (const id of path) rooted.add(id);
  }
  return JSON.stringify(frames.slice().sort((a, b) => a.frameId - b.frameId).map((frame) => [
    frame.frameId, frame.parentFrameId, frame.url, frame.documentId || '',
  ]));
}

async function checkedTab(tabId) {
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    throw new BlockedSiteError('The browser tab URL could not be verified.');
  }
  ensureAllowedTab(tab);
  const frameState = await checkedFrameState(tab);
  let current;
  try {
    current = await chrome.tabs.get(tabId);
  } catch {
    throw new BlockedSiteError('The browser tab URL could not be verified.');
  }
  ensureAllowedTab(current);
  if (current.url !== tab.url || (current.pendingUrl || '') !== (tab.pendingUrl || '')) {
    throw new BlockedSiteError('The browser tab changed while its privacy was checked.');
  }
  _checkedFrameStates.set(current, frameState);
  return current;
}

async function checkedUnchangedTab(tabId, previous) {
  const current = await checkedTab(tabId);
  if (
    (current.url || '') !== (previous.url || '') ||
    (current.pendingUrl || '') !== (previous.pendingUrl || '') ||
    (_checkedFrameStates.has(previous) &&
      _checkedFrameStates.get(current) !== _checkedFrameStates.get(previous))
  ) {
    throw new Error('The browser tab changed during the command. Retry after navigation finishes.');
  }
  return current;
}

// Marking happens only AFTER the block check: enlisting a blocked tab as an agent tab
// would hand it to the webNavigation guard, which then blanks the user's own Hatch tab.
async function resolveTabId(params, { mark = true } = {}) {
  let tab;
  if (params.tab_id == null) {
    tab = await getActiveTab();
  } else {
    // Fail closed: an unreadable tab is one whose URL we cannot screen.
    tab = await chrome.tabs.get(params.tab_id);
  }
  // pendingUrl, not just url: Chrome reports an empty `url` until a navigation commits, so
  // checking `url` alone lets a tab that is mid-navigation to a blocked host through.
  tab = await checkedTab(ensureAllowedTab(tab).id);
  const tabId = tab.id;
  _lastOperatedTabId = tabId;
  // Commands the USER named a tab for must not mark it: enlisting their tab as an agent tab
  // hands it to the webNavigation guard, which later blanks it out from under them.
  if (mark) markAgentTab(tabId);
  return tabId;
}

// Checks finalUrl and pendingUrl too: a download that redirected onto a blocked host keeps the
// pre-redirect `url`, and a tab mid-navigation reports an empty `url` with the target in
// `pendingUrl`.
// captureVisibleTab grabs whatever is ACTIVE in the window, not the tab we resolved, so the
// active tab has to clear the blocklist too or the agent gets a picture of a blocked site.
async function captureWindowOfTab(tabId) {
  const tab = await checkedTab(tabId);
  const [candidate] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  const active = await checkedTab(ensureAllowedTab(candidate).id);
  const image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const [current] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  ensureAllowedTab(current);
  if (current.id !== active.id) {
    throw new Error('The active browser tab changed during the screenshot. Retry after navigation finishes.');
  }
  await checkedUnchangedTab(active.id, active);
  return image;
}

function notBlockedRow(item) {
  return Boolean(item.url || item.finalUrl || item.pendingUrl) && !(
    hatchBlockedSites.isBlockedMetadataUrl(item.url || '') ||
    hatchBlockedSites.isBlockedMetadataUrl(item.finalUrl || '') ||
    hatchBlockedSites.isBlockedMetadataUrl(item.pendingUrl || '')
  );
}

/// Refusal for a blocked destination, or null when the URL is allowed.
function refuseIfBlocked(url) {
  if (!hatchBlockedSites.isBlockedTargetUrl(url)) return null;
  return makeError('blocked_url', hatchBlockedSites.blockedUrlMessage(url));
}

/// Window to attach a new tab to: the last-focused window, else any normal
/// window. Null only when Chrome has no window open to attach to.
async function currentWindowId() {
  const [focused] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (focused?.windowId != null) return focused.windowId;
  const [any] = await chrome.tabs.query({ windowType: 'normal' });
  return any?.windowId ?? null;
}

async function closeCreatedTab(tabId, previousTargetId) {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    return;
  }
  forgetAgentTab(tabId);
  if (_lastOperatedTabId === tabId) _lastOperatedTabId = previousTargetId;
}

async function navigateTab(tabId, params) {
  const refusal = refuseIfBlocked(params.url);
  if (refusal) return refusal;
  await waitForTabLoad(tabId, params.timeout_ms || 15000, params.url, () =>
    chrome.tabs.update(tabId, { url: params.url })
  );
  const tab = await checkedTab(tabId);
  const url = tab.url;
  const title = tab.title || '';
  let blockCheck = {};
  try {
    if (url !== 'about:blank') {
      blockCheck = await injectAndRun(tabId, checkIfBlocked) || {};
    }
  } catch (_) {}
  await checkedTab(tabId);
  return makeOk({ navigated: true, url, title, ...(blockCheck?.blocked ? blockCheck : {}) });
}

async function injectAndRun(tabId, func, args = []) {
  const tab = await checkedTab(tabId);
  let result;
  try {
    if (await cdp.shouldUseCdp(tabId)) {
      result = await cdp.injectAndRun(tabId, func, args);
    } else {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func,
          args,
        });
        result = results[0]?.result;
      } catch (err) {
        if (!cdp.isCSPError(err)) throw err;
        await checkedUnchangedTab(tabId, tab);
        await cdp.markCdpOnly(tabId);
        result = await cdp.injectAndRun(tabId, func, args);
      }
    }
  } finally {
    await checkedTab(tabId);
  }
  return result;
}

// `evaluateInPage` is deliberately gone (T285950890). It took an expression
// straight from the gateway and ran it, and its CDP branch ran it in an isolated
// world created with universal access — so a prompt-injected agent had arbitrary
// JS in the user's authenticated session with no approval anywhere on the path.
// Its two callers, `page.evaluate` and the `evaluate` step of `page.macro`, are
// gone with it. Typed commands (`page.click`, `page.type`, `page.select`,
// `page.get*`) reach the page through `page.call_on_ref`, which is a handler-only
// primitive whose function bodies are written here rather than supplied remotely.

const handlers = {
  'tabs.list': async (params) => {
    const queryInfo = params.window_id != null ? { windowId: params.window_id } : {};
    const tabs = (await chrome.tabs.query(queryInfo)).filter(notBlockedRow);
    return makeOk({
      tabs: tabs.map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        window_id: t.windowId,
        active: t.active,
        favicon_url: t.favIconUrl,
        status: t.status,
        index: t.index,
      })),
    });
  },

  'tabs.open': async (params) => {
    const refusal = refuseIfBlocked(params.url);
    if (refusal) return refusal;

    // Open a TAB in an existing window by default — matching this command's
    // documented contract in protocol.js ("Default: current window"). The old
    // no-`window_id` path called `chrome.windows.create`, spawning a whole new
    // browser window on every open, so an agent run that opened several pages
    // left a pile of windows behind.
    const windowId = params.window_id ?? (await currentWindowId());
    let tab;
    if (windowId != null) {
      tab = await chrome.tabs.create({
        url: 'about:blank',
        windowId,
        active: params.active === true,
      });
    } else {
      const win = await chrome.windows.create({
        url: 'about:blank',
        focused: params.active === true,
      });
      tab = win.tabs?.[0];
    }
    if (tab?.id == null) throw new Error('The new browser tab could not be identified.');
    const previousTargetId = _lastOperatedTabId;
    _lastOperatedTabId = tab.id;
    markAgentTab(tab.id);
    try {
      const navigation = await navigateTab(tab.id, { ...params, url: params.url || 'about:blank' });
      if (!navigation.ok) {
        await closeCreatedTab(tab.id, previousTargetId);
        return navigation;
      }
      const current = await checkedTab(tab.id);
      return makeOk({ tab_id: tab.id, url: current.url, window_id: current.windowId });
    } catch (error) {
      await closeCreatedTab(tab.id, previousTargetId);
      throw error;
    }
  },

  'tabs.close': async (params) => {
    if (params.tab_id == null) return makeError('invalid_params', 'tabs.close requires tab_id');
    const tabId = await resolveTabId(params, { mark: false });
    await chrome.tabs.remove(tabId);
    forgetAgentTab(tabId);
    return makeOk({ closed: true });
  },

  'tabs.focus': async (params) => {
    if (params.tab_id == null) return makeError('invalid_params', 'tabs.focus requires tab_id');
    const tabId = await resolveTabId(params, { mark: false });
    const tab = await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    await checkedTab(tabId);
    return makeOk({ focused: true });
  },

  'tabs.reload': async (params) => {
    const tabId = await resolveTabId(params);
    await chrome.tabs.reload(tabId, { bypassCache: params.hard === true });
    await checkedTab(tabId);
    return makeOk({ reloaded: true });
  },

  'tabs.navigate': async (params) => {
    const refusal = refuseIfBlocked(params.url);
    if (refusal) return refusal;
    const tabId = await resolveTabId(params);
    return await navigateTab(tabId, params);
  },

  'page.describe': async (params) => {
    const tabId = await resolveTabId(params);
    const result = await injectAndRun(tabId, describePageElements, [
      params.selector || 'body',
      params.max_elements || 200,
    ]);
    return makeOk(result || { elements: [], iframes: [] });
  },

  'page.content': async (params) => {
    const tabId = await resolveTabId(params);
    const result = await injectAndRun(tabId, extractPageContent, [
      params.selector || 'body',
      params.format || 'text',
      params.max_chars || 50000,
    ]);
    return makeOk({ content: result || '' });
  },

  'page.click': async (params) => {
    const tabId = await resolveTabId(params);
    // Resolve the action target's viewport center up front so the
    // cursor overlay can animate to it. This costs one extra CDP
    // roundtrip (~5-15ms) but is worth it so the user sees the cursor
    // arrive before the click lands. Overlay is fire-and-forget — its
    // result never blocks the click.
    const center = await _resolveActionCenter(tabId, params);

    if (params.selector && _isRef(params.selector)) {
      await _cursorAnimateClick(tabId, center);
      const result = await handlers['page.call_on_ref']({
        tab_id: params.tab_id,
        ref: params.selector,
        function_body: `function(rightClick) {
          if (!this.isConnected) return {ok:false,error:'detached'};
          this.scrollIntoView({block:'center',behavior:'instant'});
          if (rightClick) this.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2}));
          else this.click();
          return {ok:true,tag:this.tagName.toLowerCase(),text:(this.innerText||'').substring(0,80)};
        }`,
        args: [params.right_click === true],
      });
      if (result?.ok) await _callWaitForSettle(tabId);
      return result;
    }
    await _cursorAnimateClick(tabId, center);
    const result = await injectAndRun(tabId, clickElement, [
      params.selector || null,
      params.text || null,
      params.right_click === true,
      params.double_click === true,
    ]);
    if (!result?.ok) {
      return makeError('element_not_found', result?.error || 'Element not found');
    }
    return makeOk(result);
  },

  'page.type': async (params) => {
    const tabId = await resolveTabId(params);
    const center = await _resolveActionCenter(tabId, params);
    const value = params.value || '';
    const doClear = params.clear !== false;
    const submit = params.submit === true;

    if (params.selector && _isRef(params.selector)) {
      await _cursorAnimateType(tabId, center, value);
      const focusResult = await handlers['page.call_on_ref']({
        tab_id: params.tab_id,
        ref: params.selector,
        function_body: `function(doClear) {
          if (!this.isConnected) return {ok:false,error:'detached'};
          this.scrollIntoView({block:'center',behavior:'instant'});
          this.focus();
          if (doClear) {
            try {
              var proto = Object.getPrototypeOf(this);
              var desc = Object.getOwnPropertyDescriptor(proto, 'value');
              var setter = desc && desc.set;
              if (setter) { setter.call(this, ''); this.dispatchEvent(new Event('input',{bubbles:true})); }
              else if (this.isContentEditable) { this.innerText = ''; this.dispatchEvent(new Event('input',{bubbles:true})); }
            } catch (e) {}
          }
          return {ok:true,tag:this.tagName.toLowerCase()};
        }`,
        args: [doClear],
      });
      if (!focusResult?.ok) return focusResult;
      return await _typeViaCdp(tabId, value, submit);
    }

    await _cursorAnimateType(tabId, center, value);
    const focusResult = await injectAndRun(tabId, function(sel, doClear) {
      const el = sel && sel.trim() ? document.querySelector(sel.trim()) : document.activeElement;
      if (!el) return { ok: false, error: 'target_not_found' };
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.focus();
      if (doClear) {
        try {
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          const setter = desc && desc.set;
          if (setter) { setter.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })); }
          else if (el.isContentEditable) { el.innerText = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
        } catch (e) {}
      }
      return { ok: true, tag: el.tagName.toLowerCase() };
    }, [params.selector || null, doClear]);
    if (!focusResult?.ok) {
      return makeError('type_failed', focusResult?.error || 'Failed to type');
    }
    return await _typeViaCdp(tabId, value, submit);
  },

  'page.select': async (params) => {
    if (params.selector && _isRef(params.selector)) {
      const tabId = await resolveTabId(params);
      const result = await handlers['page.call_on_ref']({
        tab_id: params.tab_id,
        ref: params.selector,
        function_body: `function(value) {
          if (!this.isConnected) return {ok:false,error:'detached'};
          this.scrollIntoView({block:'center',behavior:'instant'});
          var opts = Array.from(this.options||[]);
          var opt = opts.find(function(o){return o.value===value||o.textContent.trim()===value;});
          if (!opt) return {ok:false,error:'Option not found: '+value};
          this.value = opt.value;
          this.dispatchEvent(new Event('change',{bubbles:true}));
          return {ok:true,tag:this.tagName.toLowerCase(),selected:opt.value};
        }`,
        args: [params.value],
      });
      if (result?.ok) await _callWaitForSettle(tabId);
      return result;
    }
    const tabId = await resolveTabId(params);
    const result = await injectAndRun(tabId, selectOption, [
      params.selector,
      params.value,
    ]);
    if (!result?.ok) {
      return makeError('select_failed', result?.error || 'Failed to select');
    }
    return makeOk(result);
  },

  'page.screenshot': async (params) => {
    const tabId = await resolveTabId(params);

    if (!params.full_page && !params.selector) {
      return makeOk({ image: await captureWindowOfTab(tabId) });
    }

    const keepAttached = await cdp.shouldUseCdp(tabId) || cdp.isAttached(tabId);
    await cdp.ensureAttached(tabId);
    try {
      const originalTab = await checkedTab(tabId);
      if (params.selector) {
        const boundsJson = await cdp.evaluate(
          tabId,
          `JSON.stringify(document.querySelector('${params.selector.replace(/'/g, "\\'")}')?.getBoundingClientRect())`
        );
        if (!boundsJson || boundsJson === 'null') {
          return makeError('element_not_found', `Selector not found: ${params.selector}`);
        }
        const bounds = JSON.parse(boundsJson);
        await checkedUnchangedTab(tabId, originalTab);
        const { data } = await cdp.sendCommand(tabId, 'Page.captureScreenshot', {
          format: 'png',
          clip: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, scale: 1 },
        });
        await checkedUnchangedTab(tabId, originalTab);
        return makeOk({ image: `data:image/png;base64,${data}` });
      }

      const { contentSize } = await cdp.sendCommand(tabId, 'Page.getLayoutMetrics');
      await checkedUnchangedTab(tabId, originalTab);
      const { data } = await cdp.sendCommand(tabId, 'Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: contentSize.width, height: contentSize.height, scale: 1 },
      });
      await checkedUnchangedTab(tabId, originalTab);
      return makeOk({ image: `data:image/png;base64,${data}` });
    } finally {
      if (!keepAttached) await cdp.detach(tabId);
    }
  },

  'page.wait': async (params) => {
    const tabId = await resolveTabId(params);
    const result = await injectAndRun(tabId, waitForSelector, [
      params.selector,
      params.timeout_ms || 10000,
      params.visible !== false,
    ]);
    if (!result?.ok) {
      return makeError('timeout', result?.error || 'Timeout waiting for selector');
    }
    return makeOk(result);
  },

  'page.scroll': async (params) => {
    if (params.selector && _isRef(params.selector) && !params.direction) {
      const tabId = await resolveTabId(params);
      const result = await handlers['page.call_on_ref']({
        tab_id: params.tab_id,
        ref: params.selector,
        function_body: `function() {
          if (!this.isConnected) return {ok:false,error:'detached'};
          this.scrollIntoView({block:'center',behavior:'instant'});
          var r = this.getBoundingClientRect();
          return {ok:true,tag:this.tagName.toLowerCase(),top:r.top,left:r.left};
        }`,
        args: [],
      });
      if (result?.ok) await _callWaitForSettle(tabId);
      return result;
    }
    const tabId = await resolveTabId(params);
    const result = await injectAndRun(tabId, scrollPage, [
      params.direction || 'down',
      params.pixels || 500,
      params.selector || null,
    ]);
    return makeOk(result || { scrolled: true });
  },

  'page.fill_form': async (params) => {
    const tabId = await resolveTabId(params);
    const fields = typeof params.fields === 'string' ? JSON.parse(params.fields) : params.fields;
    const result = await injectAndRun(tabId, fillForm, [
      fields,
      params.submit === true,
    ]);
    return makeOk(result || { filled: true });
  },

  'downloads.list': async (params) => {
    const query = {};
    if (params.query) query.filenameRegex = params.query;
    if (params.limit) query.limit = params.limit;
    else query.limit = 20;
    const downloads = (await chrome.downloads.search(query)).filter(notBlockedRow);
    return makeOk({
      downloads: downloads.map((d) => ({
        id: d.id,
        filename: d.filename,
        url: d.url,
        state: d.state,
        bytes_received: d.bytesReceived,
        total_bytes: d.totalBytes,
        start_time: d.startTime,
      })),
    });
  },

  'history.search': async (params) => {
    const results = (
      await chrome.history.search({
        text: params.query,
        maxResults: params.max_results || 20,
        startTime: params.start_time ? new Date(params.start_time).getTime() : 0,
      })
    ).filter(notBlockedRow);
    return makeOk({
      results: results.map((r) => ({
        url: r.url,
        title: r.title,
        visit_count: r.visitCount,
        last_visit: r.lastVisitTime ? new Date(r.lastVisitTime).toISOString() : null,
      })),
    });
  },

  'bookmarks.search': async (params) => {
    const results = (await chrome.bookmarks.search(params.query)).filter(notBlockedRow);
    return makeOk({
      bookmarks: results.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        date_added: b.dateAdded ? new Date(b.dateAdded).toISOString() : null,
      })),
    });
  },

  'notifications.show': async (params) => {
    const id = await new Promise((resolve) => {
      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl: params.icon_url || 'icons/icon128.png',
          title: params.title,
          message: params.message || '',
        },
        resolve
      );
    });
    return makeOk({ notification_id: id });
  },

  'page.macro': async (params) => {
    const steps = typeof params.steps === 'string' ? JSON.parse(params.steps) : params.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      return makeError('invalid_params', 'steps must be a non-empty array');
    }

    const tabId = await resolveTabId(params);
    const stopOnError = params.stop_on_error !== false;
    const results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const action = step.action;
      let stepResult;

      try {
        await checkedTab(tabId);
        _animateBatchStep(tabId, action, step);
        switch (action) {
          case 'navigate': {
            if (hatchBlockedSites.isBlockedTargetUrl(step.url)) {
              stepResult = {
                ok: false,
                error: hatchBlockedSites.blockedUrlMessage(step.url),
              };
              break;
            }
            await waitForTabLoad(tabId, step.timeout_ms || 15000, step.url, () =>
              chrome.tabs.update(tabId, { url: step.url })
            );
            const landed = await checkedTab(tabId);
            const blockCheck = landed.url === 'about:blank' ? {} : await injectAndRun(tabId, checkIfBlocked);
            stepResult = { ok: true, ...(blockCheck?.blocked ? blockCheck : {}) };
            break;
          }

          case 'wait':
            stepResult = await injectAndRun(tabId, waitForSelector, [
              step.selector,
              step.timeout_ms || 5000,
              step.visible !== false,
            ]);
            break;

          case 'click':
            stepResult = await injectAndRun(tabId, clickElement, [
              step.selector || null,
              step.text || null,
              step.right_click === true,
              step.double_click === true,
            ]);
            break;

          case 'type':
            stepResult = await injectAndRun(tabId, typeIntoElement, [
              step.selector || null,
              step.value,
              step.clear !== false,
              step.submit === true,
            ]);
            break;

          case 'key':
            stepResult = await injectAndRun(tabId, dispatchKey, [step.key]);
            break;

          case 'select':
            stepResult = await injectAndRun(tabId, selectOption, [
              step.selector,
              step.value,
            ]);
            break;

          case 'scroll':
            stepResult = await injectAndRun(tabId, scrollPage, [
              step.direction || 'down',
              step.pixels || 500,
              step.selector || null,
            ]);
            break;

          case 'screenshot': {
            stepResult = { ok: true, image: await captureWindowOfTab(tabId) };
            break;
          }

          case 'sleep':
            await new Promise((r) => setTimeout(r, step.ms || 500));
            stepResult = { ok: true };
            break;

          case 'describe':
            stepResult = await injectAndRun(tabId, describePageElements, [
              step.selector || 'body',
              step.max_elements || 50,
            ]);
            if (stepResult) stepResult.ok = true;
            else stepResult = { ok: false, error: 'No result' };
            break;

          default:
            stepResult = { ok: false, error: `Unknown action: ${action}` };
        }
        await checkedTab(tabId);
      } catch (err) {
        stepResult = { ok: false, error: err.message };
      }

      const entry = { step: i, action, ...stepResult };
      if (!stepResult?.ok) {
        if (stopOnError) {
          return makeOk({
            ok: false,
            steps_completed: i,
            steps_total: steps.length,
            error: { step: i, action, message: stepResult?.error || 'Step failed' },
            results,
          });
        }
        entry.ok = false;
      }
      results.push(entry);
    }

    return makeOk({
      ok: true,
      steps_completed: steps.length,
      steps_total: steps.length,
      results,
    });
  },
};

function waitForTabLoad(tabId, timeoutMs, expectedUrl, navigate) {
  const canonicalUrl = (value) => {
    if (String(value || '').trim().toLowerCase() === 'about:blank') return 'about:blank';
    try { return new URL(value).href; } catch { return String(value || ''); }
  };
  const destination = canonicalUrl(expectedUrl);
  return new Promise((resolve, reject) => {
    let settled = false;
    let issued = false;
    let sawProgress = false;
    let progressVersion = 0;
    let previousUrl = destination;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      if (error) reject(error);
      else resolve();
    };
    const inspect = async (completedEvent) => {
      const version = progressVersion;
      let tab;
      try { tab = await chrome.tabs.get(tabId); } catch { return; }
      if (settled || version !== progressVersion || !tab?.url || tab.pendingUrl) return;
      const atDestination = canonicalUrl(tab.url) === destination &&
        (destination !== previousUrl || destination === 'about:blank');
      if (
        (completedEvent || tab.status === 'complete') &&
        (atDestination || (completedEvent && sawProgress))
      ) {
        finish();
      }
    };
    const timer = setTimeout(() => finish(new Error('Navigation timeout')), timeoutMs);
    function listener(id, changeInfo) {
      if (id !== tabId || !issued || settled) return;
      if (changeInfo.status === 'loading' || changeInfo.url) {
        sawProgress = true;
        progressVersion++;
      }
      if (changeInfo.status === 'complete') {
        void inspect(true).catch(finish);
      } else if (changeInfo.url) {
        void inspect(false).catch(finish);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
    Promise.resolve()
      .then(async () => {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab.url) previousUrl = canonicalUrl(tab.url);
        } catch {}
        if (settled) return;
        issued = true;
        await navigate();
        await inspect(false);
      })
      .catch(finish);
  });
}

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'listbox',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'searchbox',
  'slider', 'spinbutton', 'switch', 'tab', 'treeitem',
]);

const CONTENT_ROLES = new Set([
  'heading', 'cell', 'gridcell', 'columnheader', 'rowheader', 'listitem',
  'article', 'region', 'main', 'navigation', 'img',
]);

// Persistent @ref -> backendNodeId map.
//
// Previously stored as an in-memory `Map` at module scope, which dies along
// with the MV3 service worker after ~30s of idle. We now keep it in
// `chrome.storage.session` keyed by tab id (shape:
// `refcache:<tabId> = { url, frame_id, world_context_id, ref_map, ts }`).
// Session storage survives SW teardown and is cleared at browser restart,
// which matches the semantic: backendNodeIds are only valid for the
// current Chromium process.
//
// Background.js wires `chrome.tabs.onUpdated(changeInfo.url)` and
// `chrome.tabs.onRemoved` to evict stale entries on navigation / tab close.
// This mirrors jarvis's `invalidate_refs_if_page_changed` URL-diff logic
// in `tools/hatch-browser/src/extension.rs`.
const REF_CACHE_PREFIX = 'refcache:';

function _refCacheKey(tabId) {
  return `${REF_CACHE_PREFIX}${tabId}`;
}

async function _refCacheLoad(tabId) {
  const key = _refCacheKey(tabId);
  try {
    const stored = await chrome.storage.session.get(key);
    return stored[key] || null;
  } catch {
    return null;
  }
}

async function _refCacheSave(tabId, entry, sourceTab) {
  const previous = await checkedUnchangedTab(tabId, sourceTab ?? { url: entry.url });
  try {
    await chrome.storage.session.set({ [_refCacheKey(tabId)]: entry });
  } catch {}
  try {
    await checkedUnchangedTab(tabId, previous);
  } catch (err) {
    await _refCacheClear(tabId);
    throw err;
  }
}

async function _refCacheClear(tabId) {
  try {
    await chrome.storage.session.remove(_refCacheKey(tabId));
  } catch {}
}

function _isRef(s) {
  if (!s || typeof s !== 'string') return false;
  const clean = s.startsWith('@') ? s.slice(1) : s;
  return /^e\d+$/.test(clean);
}

function _normalizeRef(ref) {
  if (!ref) return null;
  return ref.startsWith('@') ? ref : `@${ref}`;
}

function _refEntry(refMapValue) {
  if (refMapValue == null) return null;
  if (typeof refMapValue === 'number') return { bid: refMapValue, role: null, name: null };
  if (typeof refMapValue === 'object' && refMapValue.bid != null) return refMapValue;
  return null;
}

// Evict the per-tab refcache when the tab navigates cross-document or
// closes. Same semantics as jarvis's `invalidate_refs_if_page_changed`:
// backendNodeIds become invalid as soon as the document changes.
//
// `cdp.js` clears its own in-memory caches on these same events; here we
// only need to drop the chrome.storage.session entry so the next snapshot
// starts from a clean slate.
if (typeof chrome !== 'undefined' && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) _refCacheClear(tabId);
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    _refCacheClear(tabId);
  });
}

// ── Cursor overlay ────────────────────────────────────────────────────
//
// Figma-style "driver cursor" that visually tracks what the agent is
// doing on the page. Source lives in lib/cursor-overlay.js which
// exposes `mountHatchCursorOverlay` (the function invoked in the isolated
// world). All calls below are fire-and-forget — an overlay failure
// must never break or delay an agent action. See docs at the top of
// cursor-overlay.js for the contract.

const _cursorMountedTabs = new Set();
const _cursorLastState = new Map();

if (typeof chrome !== 'undefined' && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      const wasActive = _cursorMountedTabs.has(tabId);
      _cursorMountedTabs.delete(tabId);
      if (wasActive) {
        const tryMount = () => _cursorRestoreOnTab(tabId).catch(() => {});
        const reMount = (tid, info) => {
          if (tid !== tabId) return;
          if (info.status === 'loading') {
            setTimeout(tryMount, 80);
          } else if (info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(reMount);
            tryMount();
          }
        };
        chrome.tabs.onUpdated.addListener(reMount);
      }
    }
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    _cursorMountedTabs.delete(tabId);
    _cursorLastState.delete(tabId);
  });
}

async function _cursorRestoreOnTab(tabId) {
  const name = await _cursorOverlayName();
  await _cursorInjectViaScripting(tabId, 'setName', [name]);
  const state = _cursorLastState.get(tabId);
  if (state?.x != null && state?.y != null) {
    _cursorCall(tabId, 'moveTo', [state.x, state.y]);
  }
}

async function _cursorOverlayName() {
  try {
    const local = await chrome.storage.local.get(['hatchName']);
    const name = (local?.hatchName || '').toString().trim();
    return name || 'Muse';
  } catch {
    return 'Muse';
  }
}

// Why chrome.scripting.executeScript and not cdp.evaluateInIsolatedWorld:
// the extension's default command path (`injectAndRun`) only attaches
// chrome.debugger after a CSP error forces CDP mode. On normal pages no
// debugger ever attaches, so any CDP-routed overlay call silently
// fails. chrome.scripting runs in the content-script ISOLATED world,
// needs no attach, works on every page that matches `<all_urls>` host
// permissions. The overlay is a visual trail, not an integrity surface,
// so we don't need the stronger hatch-browser-kit isolated world here.
//
// Why we pass `mountHatchCursorOverlay` as a function reference instead
// of a source string: MV3 extensions have a strict CSP that blocks
// `eval` and `new Function()` even inside scripting execution contexts.
// An earlier version of this code eval'd the overlay source inside
// `new Function(src)()` — Chrome silently dropped it (func returned
// successfully, but the overlay never actually ran). Passing a function
// reference lets Chrome serialize via Function.toString() → no eval.
async function _cursorInjectViaScripting(tabId, method, args) {
  const isFirstMount = !_cursorMountedTabs.has(tabId);
  try {
    await checkedTab(tabId);
    // First: ensure the overlay is mounted. Idempotent — the mount
    // function's own guard short-circuits if the host already exists.
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: mountHatchCursorOverlay,
    });
    if (isFirstMount) {
      _cursorMountedTabs.add(tabId);
      const name = await _cursorOverlayName();
      await chrome.scripting.executeScript({
        target: { tabId },
        world: 'ISOLATED',
        func: (n) => {
          if (window.__hatch_cursor_overlay?.setName) {
            window.__hatch_cursor_overlay.setName(n);
          }
        },
        args: [name],
      });
    }
    // Then: invoke the method.
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: (methodName, argArray) => {
        const api = window.__hatch_cursor_overlay;
        if (!api || typeof api[methodName] !== 'function') {
          console.warn('[Muse overlay] missing method', methodName, 'hasApi=', !!api);
          return;
        }
        try {
          api[methodName].apply(api, argArray || []);
          console.log('[Muse overlay] call', methodName, argArray);
        } catch (e) {
          console.warn('[Muse overlay] call failed', methodName, e);
        }
      },
      args: [method, args || []],
    });
  } catch (err) {
    // Per-tab "scripting disabled" pages (chrome://, accounts.google.com
    // sign-in, etc.) fail here; cursor simply won't render there.
    console.log('[Muse overlay] injection skipped for tab', tabId, err?.message || err);
  }
}

async function _cursorCall(tabId, method, args) {
  // Fire-and-forget. Overlay is eye candy; never block or throw.
  _cursorInjectViaScripting(tabId, method, args).catch((e) => {
    console.log('[Muse overlay] _cursorCall swallowed', e?.message || e);
  });
}

async function _getSelectorCenter(tabId, selector) {
  if (!selector) return null;
  const before = await checkedTab(tabId);
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      },
      args: [selector],
    });
    return result?.result || null;
  } catch {
    return null;
  } finally {
    await checkedUnchangedTab(tabId, before);
  }
}

async function _getBackendNodeCenter(tabId, backendNodeId) {
  if (backendNodeId == null) return null;
  const before = await checkedTab(tabId);
  try {
    const box = await cdp.sendCommand(tabId, 'DOM.getBoxModel', { backendNodeId });
    const border = box?.model?.border;
    if (!Array.isArray(border) || border.length < 8) return null;
    // border is [x1,y1, x2,y2, x3,y3, x4,y4] — center is the mean of the corners.
    const x = (border[0] + border[2] + border[4] + border[6]) / 4;
    const y = (border[1] + border[3] + border[5] + border[7]) / 4;
    return { x, y };
  } catch {
    return null;
  } finally {
    await checkedUnchangedTab(tabId, before);
  }
}

async function _resolveActionCenter(tabId, params) {
  if (params.selector && _isRef(params.selector)) {
    const entry = await _refCacheLoad(tabId);
    const ref = _refEntry(entry?.ref_map?.[_normalizeRef(params.selector)]);
    if (ref) return await _getBackendNodeCenter(tabId, ref.bid);
    return null;
  }
  if (params.selector) return await _getSelectorCenter(tabId, params.selector);
  return null;
}

const CURSOR_MOVE_MS = 320;

async function _cursorAnimateClick(tabId, center) {
  if (!center) return;
  _cursorLastState.set(tabId, { x: center.x, y: center.y });
  _cursorCall(tabId, 'setName', [await _cursorOverlayName()]);
  _cursorCall(tabId, 'moveTo', [center.x, center.y]);
  await new Promise((r) => setTimeout(r, CURSOR_MOVE_MS));
  _cursorCall(tabId, 'clickAt', [center.x, center.y]);
}

async function _cursorAnimateType(tabId, center, value) {
  if (center) {
    _cursorLastState.set(tabId, { x: center.x, y: center.y });
    _cursorCall(tabId, 'setName', [await _cursorOverlayName()]);
    _cursorCall(tabId, 'moveTo', [center.x, center.y]);
    await new Promise((r) => setTimeout(r, CURSOR_MOVE_MS));
  }
  _cursorCall(tabId, 'showKeyboard', []);
  const chars = String(value || '').slice(0, 64);
  const KEY_PACING_MS = 45;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    setTimeout(() => _cursorCall(tabId, 'typeChar', [ch]), i * KEY_PACING_MS);
  }
  // Keyboard hides a bit after the last keystroke animates.
  const hideAfter = chars.length * KEY_PACING_MS + 300;
  setTimeout(() => _cursorCall(tabId, 'hideKeyboard', [600]), hideAfter);
}

async function _typeViaCdp(tabId, value, submit) {
  await checkedTab(tabId);
  await cdp.ensureAttached(tabId);
  try {
    await checkedTab(tabId);
    if (value) {
      await cdp.sendCommand(tabId, 'Input.insertText', { text: value });
    }
    const [key, code, vk] = submit ? ['Enter', 'Enter', 13] : ['Tab', 'Tab', 9];
    for (const type of ['keyDown', 'keyUp']) {
      if (type === 'keyDown') await checkedTab(tabId);
      const event = { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      // Implicit form submission only happens for an Enter that carries its
      // character payload. Without `text` the keyDown arrives as a raw key event:
      // listeners see it, but Chrome does not activate the form's default button,
      // so `submit: true` silently did nothing on a plain search box while still
      // reporting `{ok:true, submit:true}`. Tab must NOT carry text or the tab
      // character is inserted into the field instead of moving focus.
      if (submit && type === 'keyDown') { event.text = '\r'; event.unmodifiedText = '\r'; }
      await cdp.sendCommand(tabId, 'Input.dispatchKeyEvent', event);
    }
    await _callWaitForSettle(tabId);
    return makeOk({ ok: true, submit });
  } finally {
    if (!await cdp.shouldUseCdp(tabId)) await cdp.detach(tabId);
  }
}

async function _callWaitForSettle(tabId) {
  await checkedTab(tabId);
  try {
    await cdp.evaluateInIsolatedWorld(tabId, "typeof waitForSettle === 'function' ? waitForSettle() : null", {
      awaitPromise: true,
    });
  } catch {}
  if (!await cdp.shouldUseCdp(tabId)) {
    try { await cdp.detach(tabId); } catch {}
  }
  await checkedTab(tabId);
}

// Wire cursor animations into `page.macro` steps. Same visual behavior
// as the individual-command path (`page.click`, `page.type`, etc.):
// resolve the target's viewport center, then fire animations
// fire-and-forget so the step's action never waits on the visual.
// Non-interactive steps (navigate / wait / sleep / evaluate /
// screenshot / describe / key) are skipped — no cursor target.
function _animateBatchStep(tabId, action, step) {
  if (!step || typeof step !== 'object') return;
  const selector = step.selector;
  const runWithCenter = (handler) => {
    _resolveActionCenter(tabId, { selector }).then((center) => {
      try { handler(center); } catch {}
    }).catch(() => {});
  };
  switch (action) {
    case 'click':
      runWithCenter((center) => _cursorAnimateClick(tabId, center));
      return;
    case 'type':
      runWithCenter((center) => _cursorAnimateType(tabId, center, step.value));
      return;
    case 'scroll':
      // Only animate when scrolling to an element, not on
      // direction-based viewport scrolls — those have no target.
      if (selector) {
        runWithCenter((center) => {
          if (center) {
            _cursorLastState.set(tabId, { x: center.x, y: center.y });
            _cursorCall(tabId, 'moveTo', [center.x, center.y]);
          }
        });
      }
      return;
    case 'select':
      runWithCenter((center) => _cursorAnimateClick(tabId, center));
      return;
    default:
      return;
  }
}

// Delta renderer mirrors jarvis Rust `render_snapshot_delta` and the
// WKWebView embedded-browser JS so all three surfaces emit the same
// `# delta refs=N (+a ~c -r)` format. Agents see one diff syntax across
// the entire product.
function _renderSnapshotDelta(prevRefs, currRefs) {
  const sig = (r) =>
    (r.role || '') + '|' + (r.name || '') + '|' + ((r.flags || []).join(',')) + '|' + (r.value || '');
  const added = [], changed = [], removed = [];
  for (const ref of Object.keys(currRefs)) {
    const prev = prevRefs[ref];
    if (!prev) added.push([ref, currRefs[ref]]);
    else if (sig(prev) !== sig(currRefs[ref])) changed.push([ref, currRefs[ref]]);
  }
  for (const ref of Object.keys(prevRefs)) if (!(ref in currRefs)) removed.push(ref);
  const refNum = (s) => {
    const m = /^@e(\d+)$/.exec(s);
    return m ? parseInt(m[1], 10) : 999999999;
  };
  added.sort((a, b) => refNum(a[0]) - refNum(b[0]));
  changed.sort((a, b) => refNum(a[0]) - refNum(b[0]));
  removed.sort((a, b) => refNum(a) - refNum(b));
  const fmt = (ref, r) => {
    let line = r.role || '';
    if (r.name) line += ' "' + r.name.replace(/"/g, '\\"') + '"';
    line += ' ' + ref;
    if (r.flags && r.flags.length) line += ' [' + r.flags.join(' ') + ']';
    if (r.value) line += ': ' + r.value;
    return line;
  };
  // `null` means "no delta worth sending" and the caller emits the full tree.
  //
  // A delta only earns its token saving if the caller is left with something to
  // act on. With nothing added or changed it rendered
  // `(no changes since last snapshot)` and not one `@eN` token, while the
  // command's own contract promises the text carries refs to use as selectors —
  // so a second snapshot of an unchanged page handed the agent a reply it could
  // not act on. Removals are in the same position: `- @e3` names a ref that is
  // gone, never one to click.
  if (!added.length && !changed.length) return null;
  const parts = [
    '# delta refs=' + Object.keys(currRefs).length +
      ' (+' + added.length + ' ~' + changed.length + ' -' + removed.length + ')'
  ];
  for (const [ref, r] of added) parts.push('+ ' + fmt(ref, r));
  for (const [ref, r] of changed) parts.push('~ ' + fmt(ref, r));
  for (const ref of removed) parts.push('- ' + ref);
  return parts.join('\n');
}

handlers['page.snapshot'] = async (params) => {
  const tabId = await resolveTabId(params);
  const originalTab = await checkedTab(tabId);
  const interactive = params.interactive !== false;
  const forceFull = params.full === true;

  await cdp.ensureAttached(tabId);
  try {
    // Make sure the isolated world exists before we snapshot — subsequent
    // ref calls go through it, and we stash its executionContextId in the
    // cache entry so `page.call_on_ref` can pass it to `DOM.resolveNode`.
    const worldContextId = await cdp.ensureIsolatedWorld(tabId);

    const axResult = await cdp.sendCommand(tabId, 'Accessibility.getFullAXTree', {});
    const nodes = axResult.nodes || [];

    // Delegate tree-walk, generic-collapse, StaticText aggregation, state
    // flag extraction, and ref allocation to the canonical builder in
    // browser-kit.js. Same behavior as jarvis Rust CLI and WKWebView.
    // Running the pure function inside the service worker avoids a
    // round-trip into the page's isolated world.
    const priorCache = !forceFull ? (await _refCacheLoad(tabId)) : null;
    const tabInfo = await checkedUnchangedTab(tabId, originalTab);
    const currentUrl = tabInfo.url || '';
    const prevStable = (priorCache && priorCache.url === currentUrl && priorCache.stable_to_ref)
      ? priorCache.stable_to_ref
      : null;
    const snap = buildSnapshotFromAXNodes(nodes, interactive, prevStable);

    // The builder returns `ref_map` keyed by `@eN` with rich per-ref
    // metadata (role/name/stableKey/bid/flags/value). Split that into
    // the two shapes the extension persists:
    //   - `ref_map`: `{@eN: {bid, role, name}}` for page.call_on_ref.
    //   - `stable_to_ref`: `{stableKey: @eN}` for the next snapshot.
    //   - `refs`: `{@eN: {role, name, flags, value}}` signature for delta.
    const rawRefMap = snap.ref_map || {};
    const refMap = {};
    const stableToRef = {};
    const refs = {};
    for (const [ref, info] of Object.entries(rawRefMap)) {
      if (!info) continue;
      if (info.bid != null) refMap[ref] = { bid: info.bid, role: info.role || '', name: info.name || '' };
      if (info.stableKey) stableToRef[info.stableKey] = ref;
      refs[ref] = {
        role: info.role || '',
        name: info.name || '',
        flags: Array.isArray(info.flags) ? info.flags.slice() : [],
        value: info.value || '',
      };
    }

    // Default-on delta: if the previous snapshot lived on the same URL,
    // emit `# delta refs=N ...` when it is meaningfully smaller than the
    // full tree. Skeleton page / SPA hydration races are handled by the
    // 50% shrink guard — oversized deltas fall back to full.
    let outputText = typeof snap.text === 'string' ? snap.text : '';
    if (
      interactive && !forceFull &&
      priorCache && priorCache.url === currentUrl && priorCache.refs
    ) {
      const deltaText = _renderSnapshotDelta(priorCache.refs, refs);
      if (deltaText && outputText && deltaText.length < outputText.length / 2) {
        outputText = deltaText;
      }
    }

    // Persist to chrome.storage.session so the cache survives MV3 service
    // worker teardown. Keyed by tabId; background.js evicts on nav/remove.
    const worldCache = cdp.getCachedIsolatedWorld(tabId) || {};
    await _refCacheSave(tabId, {
      url: currentUrl,
      frame_id: worldCache.frameId || null,
      world_context_id: worldContextId,
      ref_map: refMap,
      stable_to_ref: stableToRef,
      refs,
      ts: Date.now(),
    }, originalTab);

    return makeOk({
      text: outputText,
      ref_count: snap.ref_count || 0,
    });
  } finally {
    if (!await cdp.shouldUseCdp(tabId)) await cdp.detach(tabId);
  }
};

handlers['page.call_on_ref'] = async (params) => {
  const key = _normalizeRef(params.ref);
  if (!key) {
    return makeError('unknown_ref', `Unknown ref: ${params.ref}. Run page.snapshot to get fresh refs.`);
  }
  const tabId = await resolveTabId(params);
  const entry = await _refCacheLoad(tabId);
  const ref = _refEntry(entry?.ref_map?.[key]);
  if (!ref) {
    return makeError('unknown_ref', `Unknown ref: ${params.ref}. Run page.snapshot to get fresh refs.`);
  }

  await cdp.ensureAttached(tabId);
  try {
    const worldContextId = await cdp.ensureIsolatedWorld(tabId);

    const tryResolveAndCall = async (bid) => {
      await checkedTab(tabId);
      const resolved = await cdp.sendCommand(tabId, 'DOM.resolveNode', {
        backendNodeId: bid,
        executionContextId: worldContextId,
      });
      const objectId = resolved?.object?.objectId;
      if (!objectId) return null;

      const callArgs = (params.args || []).map(a => ({ value: a }));
      await checkedTab(tabId);
      const callResult = await cdp.sendCommand(tabId, 'Runtime.callFunctionOn', {
        objectId,
        functionDeclaration: params.function_body,
        arguments: callArgs,
        returnByValue: true,
        awaitPromise: false,
      });
      await checkedTab(tabId);
      if (callResult.exceptionDetails) {
        return makeError('ref_call_failed', callResult.exceptionDetails.text || 'call failed');
      }
      const value = callResult.result?.value;
      if (value && typeof value === 'object') {
        if (value.error === 'detached') return null;
        return makeOk(value);
      }
      return makeOk({ value });
    };

    // First attempt with the cached backendNodeId.
    const first = await tryResolveAndCall(ref.bid).catch((err) => {
      if (err instanceof BlockedSiteError) throw err;
      return null;
    });
    if (first) return first;

    // Stale node — SPA probably re-rendered. Re-snapshot the AX tree
    // and find a node with the same role+name.
    if (ref.role && ref.name) {
      console.log('[Hatch] ref', key, 'stale, re-scanning AX tree for', ref.role, ref.name);
      const sourceTab = await checkedTab(tabId);
      const axResult = await cdp.sendCommand(tabId, 'Accessibility.getFullAXTree', {});
      await checkedUnchangedTab(tabId, sourceTab);
      for (const node of (axResult.nodes || [])) {
        const role = (node.role?.value || '').toString();
        const name = (node.name?.value || '').toString().trim();
        if (role === ref.role && name === ref.name && node.backendDOMNodeId != null) {
          const retry = await tryResolveAndCall(node.backendDOMNodeId).catch((err) => {
            if (err instanceof BlockedSiteError) throw err;
            return null;
          });
          if (retry) {
            // Update the cache with the fresh backendNodeId.
            if (entry?.ref_map) {
              entry.ref_map[key] = { bid: node.backendDOMNodeId, role, name };
              await _refCacheSave(tabId, entry, sourceTab);
            }
            return retry;
          }
        }
      }
    }

    return makeError('resolve_failed', `Ref ${params.ref} is stale (DOM node was destroyed by the page). Run page.snapshot for fresh refs.`);
  } finally {
    if (!await cdp.shouldUseCdp(tabId)) await cdp.detach(tabId);
  }
};

handlers['page.submit'] = async (params) => {
  const tabId = await resolveTabId(params);
  const selector = params.selector || null;

  if (selector && _isRef(selector)) {
    const result = await handlers['page.call_on_ref']({
      tab_id: params.tab_id,
      ref: selector,
      function_body: `function() {
        if (!this.isConnected) return {ok:false,error:'detached'};
        var form = this.closest('form');
        if (!form) return {ok:false,error:'No form found containing this element'};
        try { form.requestSubmit(); } catch(e) { form.submit(); }
        return {ok:true,tag:form.tagName.toLowerCase(),action:form.action||''};
      }`,
      args: [],
    });
    if (result?.ok) await _callWaitForSettle(tabId);
    return result;
  }

  const result = await injectAndRun(tabId, function(sel) {
    let el;
    if (sel) {
      el = document.querySelector(sel);
      if (!el) return { ok: false, error: 'Element not found: ' + sel };
    } else {
      el = document.activeElement;
      if (!el || el === document.body) return { ok: false, error: 'No element is focused' };
    }
    const form = el.closest('form');
    if (!form) return { ok: false, error: 'No form found containing element' };
    try { form.requestSubmit(); } catch(e) { form.submit(); }
    return { ok: true, action: form.action || '' };
  }, [selector]);
  if (!result?.ok) return makeError('submit_failed', result?.error || 'Submit failed');
  return makeOk(result);
};

handlers['page.info'] = async (params) => {
  const tabId = await resolveTabId(params);
  const tab = await checkedTab(tabId);
  return makeOk({ title: tab.title || '', url: tab.url || '' });
};

handlers['page.get'] = async (params) => {
  const tabId = await resolveTabId(params);
  const what = params.what;
  const selector = params.selector;
  const attrName = params.attr_name || 'href';

  if (_isRef(selector)) {
    let fnBody;
    if (what === 'text') fnBody = "function() { return {ok:true, text: this.innerText || this.textContent || ''}; }";
    else if (what === 'value') fnBody = "function() { return {ok:true, value: this.value ?? this.textContent ?? ''}; }";
    else if (what === 'attr') fnBody = "function(a) { return {ok:true, attr:a, value: this.getAttribute(a)}; }";
    else if (what === 'count') return makeError('invalid_params', 'count requires a CSS selector, not a @ref');
    else return makeError('invalid_params', 'Unknown property: ' + what);
    return await handlers['page.call_on_ref']({ tab_id: params.tab_id, ref: selector, function_body: fnBody, args: what === 'attr' ? [attrName] : [] });
  }

  const result = await injectAndRun(tabId, function(sel, what, attrName) {
    if (what === 'count') {
      const count = document.querySelectorAll(sel).length;
      return { ok: true, selector: sel, count };
    }
    const el = document.querySelector(sel);
    if (!el) return { ok: false, error: 'Element not found' };
    if (what === 'text') return { ok: true, text: el.innerText || el.textContent || '' };
    if (what === 'value') return { ok: true, value: el.value ?? el.textContent ?? '' };
    if (what === 'attr') return { ok: true, attr: attrName, value: el.getAttribute(attrName) };
    return { ok: false, error: 'Unknown property: ' + what };
  }, [selector, what, attrName]);
  if (!result?.ok) return makeError('get_failed', result?.error || 'Get failed');
  return makeOk(result);
};

handlers['page.elements'] = async (params) => {
  const tabId = await resolveTabId(params);
  const result = await injectAndRun(tabId, function() {
    const seen = new Set();
    const results = [];
    const sels = 'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="tab"],[onclick]';
    for (const el of document.querySelectorAll(sels)) {
      if (seen.has(el)) continue;
      seen.add(el);
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || el.textContent || '').trim().slice(0, 80);
      const entry = { tag };
      if (text) entry.text = text;
      if (el.type) entry.type = el.type;
      if (el.name) entry.name = el.name;
      if (el.placeholder) entry.placeholder = el.placeholder;
      if (el.href) entry.href = el.href;
      const role = el.getAttribute('role');
      if (role) entry.role = role;
      if (el.id) entry.selector = '#' + CSS.escape(el.id);
      else if (el.name) entry.selector = tag + '[name=' + JSON.stringify(el.name) + ']';
      results.push(entry);
    }
    return results;
  }, []);
  const list = Array.isArray(result) ? result : [];
  const indexed = list.map((el, i) => ({ index: i, ...el }));
  return makeOk({ count: indexed.length, elements: indexed });
};

handlers['page.get_text'] = async (params) => {
  const tabId = await resolveTabId(params);
  const result = await injectAndRun(tabId, function() {
    return { title: document.title, url: location.href, text: document.body?.innerText || '' };
  }, []);
  return makeOk(result || { text: '' });
};

handlers['page.get_html'] = async (params) => {
  const tabId = await resolveTabId(params);
  const result = await injectAndRun(tabId, function() {
    return { title: document.title, url: location.href, html: document.documentElement.outerHTML };
  }, []);
  return makeOk(result || { html: '' });
};

// Whitelist of command names the gateway is allowed to dispatch. Mirrors
// jarvis `tools/hatch-browser/src/extension.rs::ALLOWED_COMMANDS` and adds
// the Chrome-only surfaces (`tabs.*`, `downloads.*`, `history.*`,
// `bookmarks.*`, `notifications.*`, `page.macro`, `page.screenshot`).
// Anything outside this set is rejected before reaching a handler so an
// attacker with a gateway foothold cannot invoke ad-hoc handlers added later
// by mistake.
//
// Membership here is the whole security boundary for the extension node: there
// is no per-command approval on this path (the only other gate is the global
// Pause toggle, off by default), and the native node's HITL lives in the Mac
// app, which the extension cannot reach — the native-messaging lane was removed
// in D117214745. So a command that must not run unapproved has to be absent
// rather than gated. T285950890.
//
// Deliberately absent, and each one for its own reason:
//   - `cookies.get`      — returned raw HttpOnly/Secure cookie values for any
//                          domain. Live session cookies are bearer credentials;
//                          no agent workflow needs them. Handler deleted, and
//                          the `cookies` manifest permission with it.
//   - `page.evaluate`    — arbitrary JS by definition. Handler deleted.
//   - `page.call_on_ref` — hands a remotely-supplied `function_body` to
//                          `Runtime.callFunctionOn` in an isolated world created
//                          with `grantUniveralAccess: true`, so it bypasses the
//                          extension CSP entirely. It was never advertised in
//                          `COMMAND_SCHEMA`, only reachable. The HANDLER stays:
//                          six typed commands above call it directly with
//                          function bodies written in this file, and those calls
//                          do not pass through this allowlist.
const ALLOWED_COMMANDS = new Set([
  'page.click',
  'page.type',
  'page.select',
  'page.scroll',
  'page.submit',
  'page.wait',
  'page.fill_form',
  'page.describe',
  'page.content',
  'page.snapshot',
  'page.info',
  'page.get',
  'page.elements',
  'page.get_text',
  'page.get_html',
  'page.screenshot',
  'page.macro',
  'tabs.list',
  'tabs.open',
  'tabs.close',
  'tabs.focus',
  'tabs.reload',
  'tabs.navigate',
  'downloads.list',
  'history.search',
  'bookmarks.search',
  'notifications.show',
]);

async function executeCommand(command, params) {
  if (!ALLOWED_COMMANDS.has(command)) {
    return makeError('unsupported_command', `Command '${command}' is not in the allowed list`);
  }
  const handler = handlers[command];
  if (!handler) {
    return makeError('unsupported_command', `Command '${command}' has no handler`);
  }

  try {
    return await handler(params);
  } catch (err) {
    if (err instanceof BlockedSiteError) return makeError('blocked_url', err.message);
    return makeError('execution_error', err.message);
  }
}

// ── Injected functions ──
// These run in the PAGE context via chrome.scripting.executeScript.
// They must be self-contained (no imports, no closures over outer scope).
//
// Core page functions (describePageElements, clickElement, typeIntoElement,
// selectOption, scrollPage, dispatchKey, fillForm, checkIfBlocked,
// snapshotPage, extractPageContent) are defined in browser-kit.js
// (loaded via importScripts in background.js). They are available in the
// service worker global scope and get serialized into page context by
// injectAndRun / chrome.scripting.executeScript.
//
// Only extension-specific functions that aren't shared remain below.

// waitForSelector uses requestAnimationFrame and must stay here
// (browser-kit.js functions are synchronous for CDP compatibility).

// Legacy alias — keep describePageElements from browser-kit.js as canonical.
// Remove the duplicate definition that was here previously.

/* ---------- REMOVED: describePageElements ----------
   Now provided by browser-kit.js (loaded via importScripts).
   The function is identical and available globally.
   --------------------------------------------------- */

/* The following were duplicated from browser-kit.js and have been removed:
   - describePageElements (was lines 505-685)
   - clickElement (was lines 693-767)
   - typeIntoElement (was lines 769-867)
   - selectOption (was lines 869-888)
   - scrollPage (was lines 915-973)
   - dispatchKey (was lines 975-998)
   - fillForm (was lines 1000-1025)
   - extractPageContent (was lines 687-691)

   All now come from lib/browser-kit.js via importScripts.
*/

// waitForSelector needs requestAnimationFrame (async) — not in browser-kit.js
function waitForSelector(selector, timeoutMs, mustBeVisible) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el) {
        if (!mustBeVisible) return resolve({ ok: true, found: true });
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return resolve({ ok: true, found: true });
        }
      }
      if (Date.now() - start > timeoutMs) {
        return resolve({ ok: false, error: 'Timeout waiting for selector', found: false });
      }
      requestAnimationFrame(check);
    };
    check();
  });
}
