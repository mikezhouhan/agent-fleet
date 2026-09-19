// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/events.js
// kind: full-copy
// name: events.js
// byteRange: [0, 2715)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

let _sendEvent = null;

function initEvents(sendFn) {
  _sendEvent = sendFn;

  chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      emit('tab_activated', {
        tab_id: tabId,
        window_id: windowId,
        url: tab.url,
        pendingUrl: tab.pendingUrl,
        title: tab.title,
      });
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      emit('page_loaded', { tab_id: tabId, url: tab.url, title: tab.title });
    }
    if (changeInfo.url) {
      emit('url_changed', { tab_id: tabId, url: changeInfo.url });
    }
  });

  chrome.tabs.onCreated.addListener((tab) => {
    emit('tab_created', { tab_id: tab.id, url: tab.pendingUrl || tab.url });
  });

  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    emit('tab_closed', {
      tab_id: tabId,
      window_id: removeInfo.windowId,
      window_closing: removeInfo.isWindowClosing,
    });
  });

  chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state?.current === 'complete') {
      chrome.downloads.search({ id: delta.id }, (items) => {
        if (chrome.runtime.lastError || !items[0]) return;
        emit('download_complete', {
          id: delta.id,
          filename: items[0].filename,
          url: items[0].url,
          finalUrl: items[0].finalUrl,
        });
      });
    }
  });

  chrome.notifications.onClicked.addListener((notificationId) => {
    emit('notification_clicked', { notification_id: notificationId });
  });
}

function emit(eventType, payload) {
  if (!_sendEvent) return;
  // Central, not per-emitter: these fire on EVERY tab, agent-driven or not, so without this the
  // gateway learns the URL and title of the user's Hatch and internalfb pages — a push channel
  // the command-result filters never see. Covers any emitter whose URL is one of these fields.
  const emitted = [payload?.url, payload?.pendingUrl, payload?.finalUrl];
  const hasURL = emitted.some((candidate) => typeof candidate === 'string' && candidate.trim());
  if (!hasURL && eventType !== 'tab_closed' && eventType !== 'notification_clicked') return;
  if (payload?.title != null && (typeof payload.url !== 'string' || !payload.url.trim())) return;
  if (emitted.some((candidate) => candidate != null && candidate !== '' && (
    typeof candidate !== 'string' || hatchBlockedSites.isBlockedMetadataUrl(candidate)
  ))) return;
  _sendEvent({
    type: 'event',
    event: `browser.${eventType}`,
    payload,
    ts_ms: Date.now(),
  });
}
