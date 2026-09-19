// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/hatch-web-pairing.js
// kind: full-copy
// name: hatch-web-pairing.js
// byteRange: [0, 2250)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

// hatch-web-pairing.js — Prod-only Hatch web pairing bridge.
//
// This content script is intentionally narrow. It accepts a Hatch web
// postMessage containing the current gateway URL, forwards only that routing
// input to the background service worker, and lets Hatch prod validate it and
// return trusted pairing credentials and metadata.

(function hatchWebPairingBridge() {
  const security = globalThis.hatchPairingSecurity;
  const origin = window.location.origin;
  let pairingEnabled = false;
  const isAllowedOrigin = !!security?.isAllowedHatchWebOrigin(origin);

  if (!isAllowedOrigin) {
    return;
  }

  function postReadySignal() {
    window.postMessage(
      {
        type: security.HATCH_WEB_PAIR_READY_MESSAGE_TYPE,
        version: 1,
      },
      origin
    );
  }

  function scheduleReadySignals() {
    postReadySignal();
    setTimeout(postReadySignal, 250);
    setTimeout(postReadySignal, 1000);
  }

  window.addEventListener('message', (event) => {
    const parsed = security.parseHatchWebPairEvent(event, origin);
    if (!parsed.ok) {
      return;
    }

    if (!pairingEnabled) {
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: security.HATCH_WEB_PAIR_INTERNAL_MESSAGE_TYPE,
        gatewayUrl: parsed.gatewayUrl,
      },
      () => {
        chrome.runtime.lastError;
      }
    );
  });

  window.addEventListener('focus', postReadySignal);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      postReadySignal();
    }
  });

  function enablePairingBridge() {
    if (pairingEnabled) return;
    pairingEnabled = true;
    scheduleReadySignals();
  }

  scheduleReadySignals();

  // In bundled mode the extension runs inside a managed Chromium instance
  // and the node WebSocket system is disabled. Skip web pairing entirely.
  try {
    const bundledUrl = chrome.runtime.getURL('.bundled');
    fetch(bundledUrl)
      .then((response) => {
        if (response.ok) {
          return;
        }
        enablePairingBridge();
      })
      .catch(() => enablePairingBridge());
  } catch {
    enablePairingBridge();
  }
})();
