// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/background.js
// kind: full-copy
// name: background.js
// byteRange: [0, 23057)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

importScripts(
  'lib/protocol.js',
  'lib/pairing-security.js',
  'lib/blocked-sites.js',
  'lib/cdp.js',
  'lib/browser-kit.js',
  'lib/cursor-overlay.js',
  'lib/commands.js',
  'lib/connection.js',
  'lib/events.js'
);

const connection = new HatchConnection();
initEvents((event) => connection.send(event));
let pendingHatchWebPairGatewayIdentity = null;

async function fetchHatchWebPairing(sender, gatewayUrl) {
  if (!hatchPairingSecurity.isAllowedHatchWebSender(sender)) {
    throw new Error('Unauthorized Muse pairing sender');
  }

  const normalizedGatewayUrl = hatchPairingSecurity.normalizeNonEmptyString(gatewayUrl);
  if (!normalizedGatewayUrl) {
    throw new Error('Missing gateway URL');
  }

  const endpoint = new URL('/api/hatch/extension-pairing', sender.url).toString();
  let body = null;
  let response = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayUrl: normalizedGatewayUrl }),
    });

    body = null;
    try {
      body = await response.json();
    } catch {}

    if (response.status === 401 && attempt === 0) {
      continue;
    }

    break;
  }

  if (!response?.ok) {
    const message = body?.error || 'Muse pairing failed. Log into Muse or refresh the Muse page, then try again.';
    throw new Error(message);
  }

  const parsed = hatchPairingSecurity.parseExtensionPairingResponse(body);
  if (!parsed.ok) {
    throw new Error('Invalid Muse pairing response');
  }

  return parsed.pairing;
}

function isAlreadyConnectingToSameHatchWebGateway(status, gatewayUrl) {
  const requestedIdentity = hatchPairingSecurity.gatewayIdentityFromUrl(gatewayUrl);
  if (!requestedIdentity) {
    return false;
  }

  if (pendingHatchWebPairGatewayIdentity === requestedIdentity) {
    return true;
  }

  if (!connection._connecting || status.credentialSource !== 'hatch-web') {
    return false;
  }

  const currentIdentity =
    hatchPairingSecurity.gatewayIdentityFromUrl(status.gatewayIdentity) ||
    hatchPairingSecurity.gatewayIdentityFromUrl(connection._wsUrl);
  return currentIdentity === requestedIdentity;
}

// ── Cursor overlay debug surface ────────────────────────────────────
//
// Exposed on the service worker global so you can drive the overlay
// by hand from `chrome://extensions` → "Inspect views: service worker"
// → console. Useful for debugging without going through Hatch.
//
//   await hatchDebugCursor.tabs()           // list open tabs
//   await hatchDebugCursor.mount(<tabId>)   // mount overlay on a tab
//   await hatchDebugCursor.call(<tabId>, 'moveTo', 200, 200)
//   await hatchDebugCursor.call(<tabId>, 'clickAt', 200, 200)
//   await hatchDebugCursor.call(<tabId>, 'setName', 'Bob')
//   await hatchDebugCursor.call(<tabId>, 'showKeyboard')
//   await hatchDebugCursor.call(<tabId>, 'typeChar', 'h')
//   await hatchDebugCursor.call(<tabId>, 'hideKeyboard', 200)
//   await hatchDebugCursor.demo(<tabId>)    // scripted run-through
//   await hatchDebugCursor.detach(<tabId>)  // remove the overlay
//   await hatchDebugCursor.source()         // print the IIFE source size
self.hatchDebugCursor = {
  async tabs() {
    const tabs = await chrome.tabs.query({});
    return tabs.map((t) => ({ id: t.id, active: t.active, url: t.url, title: t.title }));
  },

  // Resolve a tab id when the caller didn't pass one. Skips DevTools
  // windows — when you're typing in the SW console, the "last focused
  // window" IS the DevTools window, which has no regular tabs, so
  // `lastFocusedWindow:true` returns nothing. Instead, we query active
  // tabs across normal browser windows and pick the most recent one
  // (highest `windowId` is a reasonable heuristic).
  async _resolveTabId() {
    // Active tabs across `normal` windows only (skips devtools/popups).
    const active = await chrome.tabs.query({ active: true, windowType: 'normal' });
    if (active.length === 0) {
      const all = await chrome.tabs.query({});
      const normal = all.filter((t) => t.url && /^https?:\/\//.test(t.url));
      if (normal.length === 0) {
        throw new Error(
          'no active tab in a normal browser window. Open or focus a regular http(s) tab, then retry — or pass an explicit tabId from hatchDebugCursor.tabs()',
        );
      }
      return normal[normal.length - 1].id;
    }
    // Prefer a focused window, else highest windowId (most recently created).
    active.sort((a, b) => (b.windowId || 0) - (a.windowId || 0));
    return active[0].id;
  },

  async mount(tabId) {
    if (!tabId) tabId = await this._resolveTabId();
    // Pass the mount function by REFERENCE, not as a string. Chrome
    // serializes it via Function.toString() and re-parses in the
    // target tab — no eval/new Function involved, so MV3 CSP can't
    // block it.
    const [mountResult] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: mountHatchCursorOverlay,
    });
    const [apiCheck] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: () => {
        if (window.__hatch_cursor_overlay?.__debugMountBanner) {
          window.__hatch_cursor_overlay.__debugMountBanner();
        }
        return {
          hasApi: !!window.__hatch_cursor_overlay,
          version: window.__hatch_cursor_overlay?.__version,
          hasHost: !!document.getElementById('__hatch_cursor_host'),
        };
      },
    });
    console.log('[hatchDebugCursor] mounted on tab', tabId, apiCheck?.result);
    return tabId;
  },

  async call(tabId, method, ...args) {
    if (typeof tabId !== 'number') {
      args = [method, ...args];
      method = tabId;
      tabId = await this._resolveTabId();
    }
    // Ensure overlay is present first — separate executeScript for the
    // mount (by function reference). Isolated-world state persists
    // across executeScript calls within the same tab so this only
    // actually installs on the first call per tab.
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: mountHatchCursorOverlay,
    });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: (methodName, methodArgs) => {
        const api = window.__hatch_cursor_overlay;
        if (!api || typeof api[methodName] !== 'function') {
          return { ok: false, error: 'missing method: ' + methodName, hasApi: !!api };
        }
        try {
          const out = api[methodName].apply(api, methodArgs || []);
          return { ok: true, result: out === undefined ? null : out };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },
      args: [method, args],
    });
    return result?.result;
  },

  async demo(tabId) {
    if (!tabId) tabId = await this._resolveTabId();
    console.log('[hatchDebugCursor] demo on tab', tabId);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await this.mount(tabId);
    await wait(400);
    const name = await _cursorOverlayName();
    await this.call(tabId, 'setName', name);
    await this.call(tabId, 'moveTo', 200, 200);
    await wait(700);
    await this.call(tabId, 'clickAt', 200, 200);
    await wait(500);
    await this.call(tabId, 'moveTo', 600, 300);
    await wait(700);
    await this.call(tabId, 'clickAt', 600, 300);
    await wait(500);
    await this.call(tabId, 'showKeyboard');
    await wait(300);
    for (const ch of 'hello world') {
      await this.call(tabId, 'typeChar', ch);
      await wait(90);
    }
    await wait(500);
    await this.call(tabId, 'hideKeyboard', 500);
    console.log('[hatchDebugCursor] demo complete on tab', tabId);
  },

  async detach(tabId) {
    if (!tabId) tabId = await this._resolveTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: () => { window.__hatch_cursor_overlay?.detach(); },
    });
    _cursorMountedTabs?.delete?.(tabId);
  },

  source() {
    const fn = typeof mountHatchCursorOverlay === 'function' ? mountHatchCursorOverlay.toString() : '';
    const bytes = fn.length;
    console.log('[hatchDebugCursor] mount function is', bytes, 'bytes, starts with:', fn.slice(0, 80));
    return bytes;
  },

  // Full diagnostic snapshot of the target tab. Prints EVERYTHING we
  // might need to see at once, including whether the host element made
  // it into the page's DOM and whether the API is on the isolated
  // world's window. Use this when a mount "succeeded" but you see
  // nothing on screen.
  async probe(tabId) {
    if (!tabId) tabId = await this._resolveTabId();
    const tab = await chrome.tabs.get(tabId);
    const [probe] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: () => {
        const host = document.getElementById('__hatch_cursor_host');
        return {
          url: location.href,
          readyState: document.readyState,
          hasHost: !!host,
          hostRect: host ? host.getBoundingClientRect().toJSON() : null,
          hostStyle: host ? {
            display: getComputedStyle(host).display,
            visibility: getComputedStyle(host).visibility,
            opacity: getComputedStyle(host).opacity,
            zIndex: getComputedStyle(host).zIndex,
            position: getComputedStyle(host).position,
          } : null,
          hasApi: !!window.__hatch_cursor_overlay,
          apiVersion: window.__hatch_cursor_overlay?.__version,
          apiMethods: window.__hatch_cursor_overlay
            ? Object.keys(window.__hatch_cursor_overlay)
            : null,
          documentElement: !!document.documentElement,
          bodyExists: !!document.body,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        };
      },
    });
    const result = {
      tabId,
      tabUrl: tab.url,
      tabTitle: tab.title,
      tabActive: tab.active,
      tabStatus: tab.status,
      ...(probe?.result || {}),
    };
    console.log('[hatchDebugCursor] probe', result);
    return result;
  },
};

// Detect bundled mode: when loaded via --load-extension inside a managed
// Chromium instance, the host stamps a .bundled marker file in the
// extension directory. In bundled mode the extension operates locally
// (commands invoked via CDP) and the node WebSocket system is disabled.
let _isBundled = false;
const _bundledReady = fetch(chrome.runtime.getURL('.bundled'))
  .then((r) => { _isBundled = r.ok; })
  .catch(() => { _isBundled = false; });

let _lastAvatarStem = null;
connection.onChange((status) => {
  if (status.avatarStem && status.avatarStem !== _lastAvatarStem) {
    _lastAvatarStem = status.avatarStem;
    setAvatarIcon(status).catch(() => {});
  }
});

let _iconBeforeBadge = null;
let _baseIcon = null;

async function showPairedBadge() {
  const sizes = [16, 32, 48, 128];
  const badgeIcons = {};

  for (const size of sizes) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    if (_baseIcon && _baseIcon[size]) {
      ctx.putImageData(_baseIcon[size], 0, 0);
    } else if (_baseIcon) {
      const fallback = _baseIcon[48] || _baseIcon[128] || _baseIcon[16];
      if (fallback) {
        const bmp = await createImageBitmap(fallback);
        ctx.drawImage(bmp, 0, 0, size, size);
        bmp.close();
      }
    } else {
      try {
        const fallbackSize = [48, 128, 16].find(s => true);
        const iconUrl = chrome.runtime.getURL(`icons/icon${fallbackSize}.png`);
        const resp = await fetch(iconUrl);
        const blob = await resp.blob();
        const bmp = await createImageBitmap(blob);
        ctx.drawImage(bmp, 0, 0, size, size);
        bmp.close();
      } catch {}
    }

    if (!_iconBeforeBadge) _iconBeforeBadge = {};
    if (!_iconBeforeBadge[size]) {
      _iconBeforeBadge[size] = ctx.getImageData(0, 0, size, size);
    }

    // Draw green circle badge (bottom-right)
    const badgeR = size * 0.22;
    const cx = size - badgeR - size * 0.04;
    const cy = size - badgeR - size * 0.04;

    // White outline
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + size * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Green fill
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // White checkmark
    const s = badgeR * 0.55;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.2, size * 0.04);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.6, cy + s * 0.05);
    ctx.lineTo(cx - s * 0.1, cy + s * 0.55);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.45);
    ctx.stroke();

    badgeIcons[size] = ctx.getImageData(0, 0, size, size);
  }

  await chrome.action.setIcon({ imageData: badgeIcons });

  setTimeout(async () => {
    if (_iconBeforeBadge) {
      try { await chrome.action.setIcon({ imageData: _iconBeforeBadge }); } catch {}
    }
  }, 8000);
}

async function resetToDefaultIcon() {
  try {
    const icons = {};
    for (const size of [16, 48, 128]) {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      const iconUrl = chrome.runtime.getURL(`icons/icon${size}.png`);
      const resp = await fetch(iconUrl);
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      ctx.drawImage(bmp, 0, 0, size, size);
      bmp.close();
      icons[size] = ctx.getImageData(0, 0, size, size);
    }
    _baseIcon = icons;
    _iconBeforeBadge = { ...icons };
    await chrome.action.setIcon({ imageData: icons });
  } catch {
    _baseIcon = null;
    _iconBeforeBadge = null;
    chrome.action.setIcon({ path: { 16: 'icons/icon16.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' } })
      .catch(() => {});
  }
}

async function fetchAvatarBlob(status) {
  const { avatarPath, avatarUrl, fileserverBaseUrl } = status;
  const token = (await chrome.storage.local.get('authToken')).authToken;
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  if (avatarUrl) {
    console.log('[Avatar/BG] GET /fs/raw:', avatarUrl);
    try {
      const res = await fetch(avatarUrl, { headers: authHeaders });
      console.log('[Avatar/BG] /fs/raw response:', res.status);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) return blob;
      }
    } catch (e) {
      console.log('[Avatar/BG] /fs/raw fetch error:', e.message);
    }
  }

  if (fileserverBaseUrl && avatarPath) {
    console.log('[Avatar/BG] Fallback POST /fs/read, path:', avatarPath);
    try {
      const res = await fetch(`${fileserverBaseUrl}/fs/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ path: avatarPath, offset: 0, len: 5242880 }),
      });
      if (res.ok) {
        const json = await res.json();
        const b64 = json.result?.data_base64 ?? json.data_base64;
        if (b64) {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes]);
          if (blob.size > 0) return blob;
        }
      }
    } catch (e) {
      console.log('[Avatar/BG] /fs/read fetch error:', e.message);
    }
  }

  return null;
}

async function setAvatarIcon(status) {
  if (typeof status === 'string') {
    status = { avatarUrl: status, avatarPath: null, fileserverBaseUrl: null };
  }
  const avatarPath = status?.avatarPath;
  const avatarUrl = status?.avatarUrl;
  console.log('[Avatar/BG] setAvatarIcon called, path:', avatarPath, 'url:', avatarUrl);
  if (!avatarPath && !avatarUrl) { console.log('[Avatar/BG] No avatar info, resetting to default'); resetToDefaultIcon(); return; }
  try {
    const blob = await fetchAvatarBlob(status);
    if (!blob) { console.log('[Avatar/BG] No blob returned, resetting to default'); resetToDefaultIcon(); return; }
    const bitmap = await createImageBitmap(blob);
    console.log('[Avatar/BG] Bitmap created:', bitmap.width, 'x', bitmap.height);

    const icons = {};
    for (const size of [16, 32, 48, 128]) {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      const r = size / 2;
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(bitmap, 0, 0, size, size);
      icons[size] = ctx.getImageData(0, 0, size, size);
    }
    bitmap.close();

    _baseIcon = icons;
    _iconBeforeBadge = { ...icons };
    await chrome.action.setIcon({ imageData: icons });
    console.log('[Avatar/BG] Toolbar icon set successfully');
  } catch (e) {
    console.log('[Avatar/BG] Failed:', e.message);
    resetToDefaultIcon();
  }
}

function persistStatus(status) {
  try { chrome.storage.session.set({ _cachedStatus: status }); } catch {}
  try { chrome.storage.local.set({ _cachedStatus: status }); } catch {}
}

async function getStatusSnapshot() {
  const live = connection.status();
  if (live.connected || live.registered || live.credentialSource || live.lastCommand || live.nodeId) {
    return live;
  }

  try {
    const stored = await chrome.storage.local.get('_cachedStatus');
    if (stored._cachedStatus) {
      return {
        ...stored._cachedStatus,
        connected: false,
        registered: false,
      };
    }
  } catch {}

  return live;
}

function maybeReconnect() {
  if (_isBundled) return;
  if (connection._connecting || connection._reconnecting) return;

  const status = connection.status();
  if (status.connected) return;

  connection.connect().catch(() => {});
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Hatch] onInstalled fired, reason:', details.reason);
  await _bundledReady;

  if (_isBundled) {
    console.log('[Hatch] Bundled mode — skipping node connection');
    return;
  }

  if (details.reason === 'install') {
    console.log('[Hatch] First install — opening welcome tab');
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?welcome=1'), active: true })
      .catch((e) => console.error('[Hatch] Failed to open welcome tab:', e));
  }

  try {
    await connection.connect();
    await setAvatarIcon(connection.status());
  } catch (e) {
    console.error('[Hatch] Install connect failed:', e);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[Hatch] Browser started');
  await _bundledReady;

  if (_isBundled) {
    console.log('[Hatch] Bundled mode — skipping node connection');
    return;
  }

  connection.connect()
    .then(() => setAvatarIcon(connection.status()))
    .catch((e) => console.error('[Hatch] Startup connect failed:', e));
});

chrome.alarms.onAlarm.addListener((alarm) => {
  connection.handleAlarm(alarm.name);
});

// Second line of defense for the website blocklist. The command handlers refuse a
// blocked destination up front, but a link click or JS/meta redirect inside a page
// the agent is driving never passes through one — this catches those.
//
// Scoped to agent-controlled tabs on purpose: the listener sees the USER's
// navigations too, and blanket enforcement would lock the user out of
// agent.meta.ai, which is where this extension's own pairing flow lives.
//
// `onBeforeNavigate` is not cancelable, so this is a redirect-away, not a hard
// block: the blocked document may begin loading before the tab is moved off it.
// Sub-frames are left alone — killing the whole tab because an iframe navigated
// is too blunt, and the agent reads and acts on the main frame.
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Cheap synchronous rejections first: `isAgentTabAsync` can hit
  // chrome.storage.session, and this listener runs on every navigation.
  if (details.frameId !== 0) return;
  if (!hatchBlockedSites.isBlockedUrl(details.url)) return;
  if (!(await isAgentTabAsync(details.tabId))) return;

  console.warn('[Hatch]', hatchBlockedSites.blockedUrlMessage(details.url));
  chrome.tabs.update(details.tabId, { url: 'about:blank' }).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  forgetAgentTab(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'hatch_get_status') {
    getStatusSnapshot()
      .then((status) => {
        persistStatus(status);
        sendResponse(status);
        maybeReconnect();
      })
      .catch(() => sendResponse(connection.status()));
    return true;
  }

  if (message.type === 'hatch_connect') {
    connection
      .connect()
      .then(() => sendResponse(connection.status()))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.type === 'hatch_disconnect') {
    connection
      .unpair()
      .then(() => sendResponse(connection.status()))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.type === 'hatch_set_paused') {
    connection.setPaused(message.paused);
    sendResponse(connection.status());
    return false;
  }

  if (message.type === 'hatch_pair') {
    connection
      .pair(message.token, message.url)
      .then(() => sendResponse(connection.status()))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.type !== hatchPairingSecurity.HATCH_WEB_PAIR_INTERNAL_MESSAGE_TYPE) {
    return false;
  }

  if (!hatchPairingSecurity.isAllowedHatchWebSender(sender)) {
    sendResponse({ error: 'Unauthorized Muse pairing sender' });
    return false;
  }

  const s = connection.status();
  if (
    s.connected ||
    s.registered ||
    isAlreadyConnectingToSameHatchWebGateway(s, message.gatewayUrl)
  ) {
    sendResponse(s);
    return false;
  }

  pendingHatchWebPairGatewayIdentity = hatchPairingSecurity.gatewayIdentityFromUrl(message.gatewayUrl);
  fetchHatchWebPairing(sender, message.gatewayUrl)
    .then((pairing) =>
      connection.pair(pairing.token, pairing.wsUrl, 'hatch-web', pairing.hatchName, pairing.avatarPath, {
        gatewayIdentity: pairing.gatewayIdentity,
        expiresAt: pairing.expiresAt,
      })
    )
    .then(async () => {
      let pairStatus = connection.status();
      if (!pairStatus.avatarPath) {
        await connection.fetchIdentity().catch(() => {});
        pairStatus = connection.status();
      }
      sendResponse(pairStatus);
      await setAvatarIcon(pairStatus);
      await showPairedBadge();
      try { await chrome.action.openPopup(); } catch {}
    })
    .catch((e) => sendResponse({ error: e.message }))
    .finally(() => {
      pendingHatchWebPairGatewayIdentity = null;
    });
  return true;
});
