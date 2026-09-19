// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/options.js
// kind: full-copy
// name: options.js
// byteRange: [0, 1235)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const cloudUrlInput = document.getElementById('cloud-url');
const nodeNameInput = document.getElementById('node-name');
const nodeIdInput = document.getElementById('node-id');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 2000);
}

async function load() {
  const sync = await chrome.storage.sync.get(['nodeName']);
  const local = await chrome.storage.local.get(['nodeId', 'wsUrl']);

  cloudUrlInput.value = local.wsUrl || '';
  nodeNameInput.value = sync.nodeName || '';
  nodeIdInput.value = local.nodeId || '(not generated yet)';
}

saveBtn.addEventListener('click', async () => {
  const nodeName = nodeNameInput.value.trim();
  await chrome.storage.sync.set({ nodeName: nodeName || undefined });
  showToast('Saved');
});

resetBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove(['nodeName']);
  nodeNameInput.value = '';
  showToast('Reset to defaults');
});

load();
