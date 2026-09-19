// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/popup.js
// kind: full-copy
// name: popup.js
// byteRange: [0, 8721)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const HATCH_URL = 'https://hatch.meta.ai/';
const isWelcomeTab = new URLSearchParams(location.search).has('welcome');
if (isWelcomeTab) document.body.classList.add('welcome-tab');

const pill = document.getElementById('pill');
const avatarWrap = document.getElementById('avatar-wrap');
const avatarImg = document.getElementById('avatar-img');
const hatchNameEl = document.getElementById('hatch-name');
const statusDot = document.querySelector('#status-indicator .dot');
const statusLabel = document.getElementById('status-label');
const menuBtn = document.getElementById('menu-btn');
const details = document.getElementById('details');
const sourceValue = document.getElementById('source-value');
const nodeIdValue = document.getElementById('node-id-value');
const lastCommandRow = document.getElementById('last-command-row');
const lastCommandValue = document.getElementById('last-command-value');
const pauseBtn = document.getElementById('pause-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const pairSection = document.getElementById('pair-section');
const pairStatus = document.getElementById('pair-status');
const pairBtn = document.getElementById('pair-btn');
const errorBar = document.getElementById('error-bar');
const errorText = document.getElementById('error-text');

let detailsOpen = false;
let lastAvatarKey = null;

function showError(msg) {
  errorText.textContent = msg;
  errorBar.style.display = 'block';
  setTimeout(() => (errorBar.style.display = 'none'), 5000);
}

function render(status) {
  console.log('[Avatar] render() called, avatarUrl:', status.avatarUrl, 'connected:', status.connected, 'registered:', status.registered);
  errorBar.style.display = 'none';

  if (status.connected && status.registered) {
    pill.style.display = '';
    pairSection.style.display = 'none';

    hatchNameEl.textContent = status.hatchName || 'Muse';
    showDefaultAvatar();
    loadAvatar(status);

    if (status.paused) {
      statusDot.className = 'dot paused';
      statusLabel.className = 'paused';
      statusLabel.textContent = 'paused';
    } else {
      statusDot.className = 'dot';
      statusLabel.className = '';
      statusLabel.textContent = 'online';
    }

    const sourceLabels = { 'hatch-web': 'Muse web', manual: 'Manual' };
    sourceValue.textContent = sourceLabels[status.credentialSource] || status.credentialSource || '\u2014';
    nodeIdValue.textContent = status.nodeId ? status.nodeId.substring(0, 12) + '\u2026' : '\u2014';

    if (status.lastCommand) {
      lastCommandRow.style.display = 'flex';
      lastCommandValue.textContent = status.lastCommand.command;
    } else {
      lastCommandRow.style.display = 'none';
    }

    pauseBtn.textContent = status.paused ? 'Resume' : 'Pause';
  } else if (status.connected || status.hasCredentials || status.credentialSource) {
    pill.style.display = '';
    pairSection.style.display = 'none';
    hatchNameEl.textContent = status.hatchName || 'Muse';
    showDefaultAvatar();
    loadAvatar(status);
    statusDot.className = 'dot offline';
    statusLabel.className = 'offline';
    statusLabel.textContent = 'connecting\u2026';
  } else {
    pill.style.display = 'none';
    details.style.display = 'none';
    detailsOpen = false;
    pairSection.style.display = '';
    pairBtn.disabled = false;
  }
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        showError(chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

async function refresh() {
  const status = await sendMessage({ type: 'hatch_get_status' });
  if (status) render(status);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if ((areaName === 'session' || areaName === 'local') && changes._cachedStatus?.newValue) {
    render(changes._cachedStatus.newValue);
  }
});

(async () => {
  let rendered = false;
  try {
    const session = await chrome.storage.session.get('_cachedStatus');
    if (session?._cachedStatus) {
      render(session._cachedStatus);
      rendered = true;
    }
  } catch {}
  if (!rendered) {
    try {
      const local = await chrome.storage.local.get('_cachedStatus');
      if (local?._cachedStatus) {
        render({ ...local._cachedStatus, connected: false, registered: false });
        rendered = true;
      }
    } catch {}
  }
  window.requestAnimationFrame(() => {
    setTimeout(refresh, rendered ? 120 : 0);
  });
})();

// --- Toggle details ---

menuBtn.addEventListener('click', () => {
  detailsOpen = !detailsOpen;
  details.style.display = detailsOpen ? '' : 'none';
});

// --- Actions ---

pairBtn.addEventListener('click', () => {
  if (isWelcomeTab) {
    location.href = HATCH_URL;
  } else {
    chrome.tabs.create({ url: HATCH_URL });
  }
});

pauseBtn.addEventListener('click', async () => {
  const current = await sendMessage({ type: 'hatch_get_status' });
  const status = await sendMessage({ type: 'hatch_set_paused', paused: !current?.paused });
  if (status) render(status);
});

disconnectBtn.addEventListener('click', async () => {
  const status = await sendMessage({ type: 'hatch_disconnect' });
  if (status) render(status);
});

// --- Avatar ---

function showDefaultAvatar() {
  const name = hatchNameEl.textContent || 'H';
  const letter = name.charAt(0).toUpperCase();
  console.log('[Avatar] showDefaultAvatar → initial:', letter);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="24" fill="%236366f1"/><text x="24" y="24" text-anchor="middle" dy=".35em" font-family="-apple-system,sans-serif" font-size="22" font-weight="600" fill="white">${letter}</text></svg>`;
  avatarImg.src = 'data:image/svg+xml,' + svg;
  avatarImg.style.display = 'block';
  avatarWrap.style.display = '';
}

async function loadAvatar(status) {
  const { avatarPath, avatarUrl, avatarStem, fileserverBaseUrl } = status;
  const key = avatarStem || avatarPath || avatarUrl || null;
  console.log('[Avatar] loadAvatar called, stem:', avatarStem, 'path:', avatarPath, 'url:', avatarUrl);
  if (!key) {
    console.log('[Avatar] No avatar info, using default');
    showDefaultAvatar();
    lastAvatarKey = null;
    return;
  }
  if (key === lastAvatarKey) {
    console.log('[Avatar] Same key as last, skipping');
    return;
  }
  lastAvatarKey = key;

  try {
    const stored = await chrome.storage.local.get('authToken');
    const token = stored.authToken;
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    let blobUrl = null;

    if (avatarUrl) {
      console.log('[Avatar] GET /fs/raw:', avatarUrl);
      try {
        const res = await fetch(avatarUrl, { headers: authHeaders });
        if (res.ok) {
          const blob = await res.blob();
          console.log('[Avatar] Blob size:', blob.size, 'type:', blob.type);
          if (blob.size > 0) blobUrl = URL.createObjectURL(blob);
        }
      } catch (e) {
        console.log('[Avatar] /fs/raw error:', e.message);
      }
    }

    if (!blobUrl && fileserverBaseUrl && avatarPath) {
      console.log('[Avatar] Fallback POST /fs/read, path:', avatarPath);
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
            if (blob.size > 0) blobUrl = URL.createObjectURL(blob);
          }
        }
      } catch (e) {
        console.log('[Avatar] /fs/read error:', e.message);
      }
    }

    if (blobUrl) {
      console.log('[Avatar] Setting img src to blob URL');
      avatarImg.src = blobUrl;
      avatarImg.style.display = 'block';
      avatarWrap.style.display = '';
    } else {
      console.log('[Avatar] No avatar data, using default');
      showDefaultAvatar();
    }
  } catch (e) {
    console.log('[Avatar] Fetch error:', e.message || e);
    showDefaultAvatar();
  }
}

avatarImg.addEventListener('error', () => {
  console.log('[Avatar] img onerror fired, current src:', avatarImg.src);
  showDefaultAvatar();
});
