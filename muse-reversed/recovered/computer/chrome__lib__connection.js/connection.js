// Recovered Muse 2.0 client unit. Not original Meta source.
// shippedPath: chrome/lib/connection.js
// kind: full-copy
// name: connection.js
// byteRange: [0, 17832)
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const PING_INTERVAL_MS = 30_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const HEARTBEAT_ALARM = 'hatch_heartbeat';
// Cap on remembered invoke results (see `_handleInvoke`). Large enough to cover
// a gateway retry window, small enough to stay trivial in service-worker memory.
const INVOKE_DEDUPE_MAX = 256;
const CRED_KEYS = [
  'authToken',
  'wsUrl',
  'credentialSource',
  'gatewayIdentity',
  'expiresAt',
  'hatchName',
  'avatarPath',
];
const AVATAR_ASSET_DIR = 'workspace/avatars';
function ensureCommandSupportLoaded() {}

function resolveAvatarImagePath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/') || trimmed.includes('.')) return trimmed;
  return `${AVATAR_ASSET_DIR}/${trimmed}.webp`;
}

class HatchConnection {
  constructor() {
    this.ws = null;
    this.nodeId = null;
    this.registered = false;
    this.paused = false;
    this.credentialSource = null; // 'hatch-web' | 'manual' | null
    this.hatchName = null;
    this.avatarPath = null;
    this.gatewayIdentity = null;
    this.expiresAt = null;
    this._wsUrl = null;
    this.reconnectDelay = RECONNECT_BASE_MS;
    this.pingTimer = null;
    this.lastCommand = null;
    this._pendingRequests = new Map();
    this._listeners = new Set();
    this._reconnecting = false;
    this._connecting = false;
    // request_id -> result (or null while in flight). Insertion-ordered and
    // bounded; see `_handleInvoke`.
    this._recentInvokes = new Map();
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    const s = this.status();
    for (const fn of this._listeners) fn(s);
    try { chrome.storage.session.set({ _cachedStatus: s }); } catch {}
    try { chrome.storage.local.set({ _cachedStatus: s }); } catch {}
  }

  status() {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      registered: this.registered,
      paused: this.paused,
      nodeId: this.nodeId,
      credentialSource: this.credentialSource,
      gatewayIdentity: this.gatewayIdentity,
      expiresAt: this.expiresAt,
      hatchName: this.hatchName,
      avatarUrl: this._buildAvatarUrl(),
      avatarPath: resolveAvatarImagePath(this.avatarPath),
      avatarStem: this.avatarPath || null,
      fileserverBaseUrl: this._buildFsBaseUrl(),
      lastCommand: this.lastCommand,
      hasCredentials: !!this.credentialSource,
    };
  }

  _buildFsBaseUrl() {
    if (!this._wsUrl) return null;
    try {
      const wsUrlObj = new URL(this._wsUrl);
      const scheme = wsUrlObj.protocol === 'ws:' ? 'http' : 'https';
      return `${scheme}://${wsUrlObj.host}`;
    } catch { return null; }
  }

  _buildAvatarUrl() {
    if (!this.avatarPath || !this._wsUrl) return null;
    try {
      const base = this._buildFsBaseUrl();
      const resolved = resolveAvatarImagePath(this.avatarPath);
      if (!resolved) return null;
      const path = resolved.replace(/^\//, '');
      return `${base}/fs/raw/${path}`;
    } catch { return null; }
  }

  async connect() {
    if (this._connecting || this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this._connecting = true;

    try {
      await this._ensureNodeId();

      const creds = await this._loadStoredCredentials();

      if (creds) {
        await this._connectWebSocket(creds.wsUrl, creds.authToken);
      } else {
        this._notify();
      }
    } finally {
      this._connecting = false;
    }
  }

  async disconnect() {
    this._stopTimers();
    this.registered = false;

    if (this.ws) {
      this._detachSocket(this.ws);
      try { this.ws.close(1000, 'user disconnect'); } catch {}
      this.ws = null;
    }
    this._notify();
  }

  async unpair() {
    await this.disconnect();
    await chrome.storage.local.remove(CRED_KEYS);
    this.credentialSource = null;
    this.hatchName = null;
    this.avatarPath = null;
    this.gatewayIdentity = null;
    this.expiresAt = null;
    this._wsUrl = null;
    this._notify();
  }

  async _handleRemoteUnpair(reason, nodeId = null) {
    if (nodeId && this.nodeId && nodeId !== this.nodeId) {
      console.log(`[Hatch] Ignoring ${reason} for node ${nodeId}; local node is ${this.nodeId}`);
      return;
    }

    console.log(`[Hatch] Server unpaired this node (${reason})`);
    await this.unpair();
  }

  setPaused(paused) {
    this.paused = paused;
    this._notify();
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  async handleAlarm(name) {
    if (name !== HEARTBEAT_ALARM) return;

    if (!this.status().connected) {
      console.log('[Hatch] Alarm fired but disconnected — reconnecting');
      await this.connect();
      return;
    }

    if (this.registered && this.nodeId) {
      this.send(makeHeartbeatMessage(this.nodeId));
    }
  }

  // --- Credential Acquisition ---

  async _clearStoredCredentials() {
    await chrome.storage.local.remove(CRED_KEYS);
    this.credentialSource = null;
    this.gatewayIdentity = null;
    this.expiresAt = null;
    this.hatchName = null;
    this.avatarPath = null;
    this._wsUrl = null;
  }

  async _loadStoredCredentials() {
    const stored = await chrome.storage.local.get(CRED_KEYS);

    // The 'endo' source came from the native-messaging lane, which is gone. It
    // is also the one source `normalizeWsUrlForCredentialSource` never
    // host-checked, so a credential planted by whatever last answered that
    // socket would still be honoured here. Drop it and make the user re-pair.
    // Checked ahead of the completeness test below so a half-written legacy
    // record is cleared too, rather than left to linger under a dead source.
    if (stored.credentialSource === 'endo') {
      console.warn('[Hatch] Discarding credentials from the retired Endo native lane; re-pair via Hatch web');
      await this._clearStoredCredentials();
      return null;
    }

    if (stored.authToken && stored.wsUrl) {
      const credentialSource = stored.credentialSource || 'manual';
      const wsUrl = hatchPairingSecurity.normalizeWsUrlForCredentialSource(
        stored.wsUrl,
        credentialSource
      );
      if (!wsUrl) {
        console.warn('[Hatch] Stored WebSocket URL failed validation; clearing credentials');
        await this._clearStoredCredentials();
        return null;
      }
      this.credentialSource = credentialSource;
      this.gatewayIdentity = stored.gatewayIdentity || null;
      this.expiresAt = typeof stored.expiresAt === 'number' ? stored.expiresAt : null;
      this.hatchName = stored.hatchName || null;
      this.avatarPath = stored.avatarPath || null;
      this._wsUrl = wsUrl;
      return { authToken: stored.authToken, wsUrl };
    }
    return null;
  }

  async pair(token, url, source = 'manual', hatchName = null, avatarPath = null, metadata = {}) {
    const credentialSource = source || 'manual';
    const fallbackUrl = credentialSource === 'manual' ? 'wss://node.hatch.one/ws' : null;
    const wsUrl = hatchPairingSecurity.normalizeWsUrlForCredentialSource(
      url || fallbackUrl,
      credentialSource
    );
    if (!wsUrl) {
      throw new Error('Invalid Muse WebSocket URL');
    }
    if (!hatchPairingSecurity.normalizeNonEmptyString(token)) {
      throw new Error('Missing Muse auth token');
    }

    const toStore = { authToken: token, wsUrl, credentialSource };
    if (metadata.gatewayIdentity) toStore.gatewayIdentity = metadata.gatewayIdentity;
    if (typeof metadata.expiresAt === 'number') toStore.expiresAt = metadata.expiresAt;
    if (hatchName) toStore.hatchName = hatchName;
    if (avatarPath) toStore.avatarPath = avatarPath;
    await chrome.storage.local.set(toStore);
    this.credentialSource = credentialSource;
    this.gatewayIdentity = metadata.gatewayIdentity || null;
    this.expiresAt = typeof metadata.expiresAt === 'number' ? metadata.expiresAt : null;
    this.hatchName = hatchName;
    this.avatarPath = avatarPath;
    this._wsUrl = wsUrl;
    await this._connectWebSocket(wsUrl, token);
  }

  // --- WebSocket ---

  /// Drop every handler on a socket we're abandoning. `close()` is async, so a
  /// retained `onclose` fires AFTER its replacement has been assigned and would
  /// run `this.ws = null` against the new socket — orphaning a live, still
  /// message-receiving socket while the connection reports disconnected. The
  /// heartbeat then dials a second socket, and every invoke gets executed once
  /// per orphan (duplicate `tabs.open` → duplicate tabs).
  _detachSocket(socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
  }

  async _connectWebSocket(wsUrl, authToken) {
    if (this._reconnecting) return;

    if (this.ws) {
      this._detachSocket(this.ws);
      try { this.ws.close(1000, 'replacing'); } catch {}
      this.ws = null;
    }

    const fullUrl = hatchPairingSecurity.buildAuthenticatedWsUrl(wsUrl, authToken);
    if (!fullUrl) {
      console.error('[Hatch] WebSocket URL or auth token failed validation');
      this._scheduleReconnect();
      return;
    }

    let socket;
    try {
      socket = new WebSocket(fullUrl);
    } catch (e) {
      console.error('[Hatch] WebSocket creation failed:', e);
      this._scheduleReconnect();
      return;
    }
    this.ws = socket;

    // Every handler below is bound to `socket`, not `this.ws`, and no-ops once
    // it has been superseded — so a socket that outlives its replacement can
    // neither execute commands nor clear the live connection's state.
    socket.onopen = () => {
      if (this.ws !== socket) return;
      console.log('[Hatch] WebSocket connected');
      this.reconnectDelay = RECONNECT_BASE_MS;
      this._reconnecting = false;
      this._register();
      this._notify();
    };

    socket.onmessage = (event) => {
      if (this.ws !== socket) return;
      try {
        this._handleMessage(JSON.parse(event.data));
      } catch (e) {
        console.error('[Hatch] Bad WS message:', e);
      }
    };

    socket.onclose = (event) => {
      if (this.ws !== socket) return;
      console.log(`[Hatch] WebSocket closed: ${event.code} ${event.reason}`);
      this.ws = null;
      this.registered = false;
      this._stopTimers();
      this._notify();

      if (event.code === 4001 || event.reason === 'node_unpaired') {
        this._handleRemoteUnpair('close frame', null)
          .catch((e) => console.error('[Hatch] Remote unpair cleanup failed:', e));
      } else if (event.code >= 4000) {
        console.log('[Hatch] Server rejected connection — treating as unpaired');
        this.unpair();
      } else if (event.code !== 1000) {
        this._scheduleReconnect();
      }
    };

    socket.onerror = (event) => {
      if (this.ws !== socket) return;
      console.error('[Hatch] WebSocket error:', event);
    };
  }

  _scheduleReconnect() {
    if (this._reconnecting) return;
    this._reconnecting = true;

    console.log(`[Hatch] Reconnecting in ${this.reconnectDelay}ms...`);
    setTimeout(() => {
      this._reconnecting = false;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
      this.connect();
    }, this.reconnectDelay);
  }

  // --- Protocol ---

  async _ensureNodeId() {
    if (this.nodeId) return;

    // Prefer sync storage — survives extension uninstall/reinstall
    try {
      const synced = await chrome.storage.sync.get('nodeId');
      if (synced.nodeId) {
        this.nodeId = synced.nodeId;
        await chrome.storage.local.set({ nodeId: this.nodeId });
        return;
      }
    } catch {}

    const stored = await chrome.storage.local.get('nodeId');
    if (stored.nodeId) {
      this.nodeId = stored.nodeId;
    } else {
      this.nodeId = crypto.randomUUID();
    }

    await chrome.storage.local.set({ nodeId: this.nodeId });
    try { await chrome.storage.sync.set({ nodeId: this.nodeId }); } catch {}
  }

  async _register() {
    const config = await chrome.storage.sync.get(['nodeName']);
    let displayName = config.nodeName;
    if (!displayName) {
      const ua = navigator.userAgent;
      const os = ua.includes('Mac') ? 'macOS' : ua.includes('Windows') ? 'Windows' : 'Linux';
      displayName = `Chrome \u00b7 ${os}`;
    }

    const msg = makeRegisterMessage(this.nodeId, displayName);
    this._pendingRequests.set(msg.id, (res) => {
      if (res.status === 'ok') {
        this.registered = true;
        this._startTimers();
        console.log('[Hatch] Registered as node', this.nodeId);
        this.fetchIdentity().catch(() => {});
      } else {
        console.error('[Hatch] Registration failed:', res);
        if (res.error?.code === 'unknown_node' || res.error?.code === 'not_found') {
          console.log('[Hatch] Node not recognized — treating as unpaired');
          this.unpair();
        }
      }
      this._notify();
    });
    this.send(msg);
  }

  async fetchIdentity() {
    const base = this._buildFsBaseUrl();
    if (!base) return;
    try {
      const stored = await chrome.storage.local.get('authToken');
      const headers = {};
      if (stored.authToken) headers['Authorization'] = `Bearer ${stored.authToken}`;
      const res = await fetch(`${base}/identity`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      console.log('[Hatch] Identity fetched:', data.name, 'avatar:', JSON.stringify(data.avatar));

      const name = data.name && data.name !== 'Assistant' ? data.name : 'Muse';
      if (name) this.hatchName = name;

      const avatar = data.avatar;
      if (avatar && typeof avatar === 'object') {
        const stem = avatar.canonical_path?.trim() || '';
        if (stem) {
          this.avatarPath = stem;
          await chrome.storage.local.set({ hatchName: this.hatchName, avatarPath: stem });
        }
      } else if (typeof data.avatar === 'string' && data.avatar.trim()) {
        this.avatarPath = data.avatar.trim();
        await chrome.storage.local.set({ hatchName: this.hatchName, avatarPath: this.avatarPath });
      }
      this._notify();
    } catch (e) {
      console.log('[Hatch] fetchIdentity error:', e.message || e);
    }
  }

  _startTimers() {
    this._stopTimers();

    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, PING_INTERVAL_MS);

    chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  }

  _stopTimers() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    chrome.alarms.clear(HEARTBEAT_ALARM).catch(() => {});
  }

  async _handleMessage(msg) {
    if (msg.type === 'res' && msg.id) {
      const handler = this._pendingRequests.get(msg.id);
      if (handler) {
        this._pendingRequests.delete(msg.id);
        handler(msg);
      }
      return;
    }

    if (msg.type === 'req' && msg.method === 'node.invoke.request') {
      await this._handleInvoke(msg.params || {});
      return;
    }

    if (msg.type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }

    if (msg.type === 'event' && msg.event === 'node.unpaired') {
      this._handleRemoteUnpair('node.unpaired event', msg.payload?.node_id || null)
        .catch((e) => console.error('[Hatch] Remote unpair cleanup failed:', e));
      return;
    }
  }

  /// Record an invoke's outcome for replay, evicting oldest-first. `null` marks
  /// one still in flight.
  _rememberInvoke(requestId, result) {
    this._recentInvokes.delete(requestId);
    this._recentInvokes.set(requestId, result);
    while (this._recentInvokes.size > INVOKE_DEDUPE_MAX) {
      const oldest = this._recentInvokes.keys().next().value;
      this._recentInvokes.delete(oldest);
    }
  }

  async _handleInvoke(params) {
    const requestId = params.request_id;
    const command = params.command;
    const cmdParams = params.params || {};

    if (!requestId || !command) {
      console.error('[Hatch] Invalid invoke — missing request_id or command', params);
      return;
    }

    // Delivery is at-least-once: the gateway re-sends an invoke whose result it
    // never saw — and `send` silently drops results whenever the socket isn't
    // OPEN, so that happens in practice. Commands like `tabs.open` are not
    // idempotent, so replay the recorded result rather than running it twice.
    if (this._recentInvokes.has(requestId)) {
      const previous = this._recentInvokes.get(requestId);
      if (previous === null) {
        console.log(`[Hatch] Ignoring retry of in-flight invoke ${requestId} (${command})`);
      } else {
        console.log(`[Hatch] Replaying cached result for duplicate invoke ${requestId} (${command})`);
        this.send(makeInvokeResultMessage(requestId, this.nodeId, previous));
      }
      return;
    }
    this._rememberInvoke(requestId, null);

    this.lastCommand = { command, params: cmdParams, timestamp: Date.now() };
    this._notify();

    if (this.paused) {
      const result = { ok: false, error: { code: 'paused', message: 'Extension is paused' } };
      this._rememberInvoke(requestId, result);
      this.send(makeInvokeResultMessage(requestId, this.nodeId, result));
      return;
    }

    let result;
    try {
      ensureCommandSupportLoaded();
      result = await executeCommand(command, cmdParams);
    } catch (err) {
      result = { ok: false, error: { code: 'execution_error', message: err.message } };
    }
    this._rememberInvoke(requestId, result);
    this.send(makeInvokeResultMessage(requestId, this.nodeId, result));
  }
}
