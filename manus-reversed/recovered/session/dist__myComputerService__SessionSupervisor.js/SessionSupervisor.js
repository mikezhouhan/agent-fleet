// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/myComputerService/SessionSupervisor.js
// kind: full-copy
// name: SessionSupervisor.js
// byteRange: [0, 10155)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSupervisor = void 0;
const commonUtils_1 = require("../utils/commonUtils");
const loggerHelper_1 = require("../utils/loggerHelper");
const MAX_RECONNECT_ATTEMPTS = 20;
const RECONNECT_DELAY_MS = 3000;
const RECONNECT_MAX_DELAY_MS = 30000;
class SessionSupervisor {
    sidecarManager;
    sessions = new Map();
    statusChangedCallbacks = new Set();
    pendingOperation = Promise.resolve();
    retriesSuspended = false;
    runtimeEpoch = 0;
    constructor(sidecarManager) {
        this.sidecarManager = sidecarManager;
        this.sidecarManager.on('exit', (_folderPath, child) => {
            this.handleUnexpectedExit(child);
        });
        this.sidecarManager.on('error', (_folderPath, child, error) => {
            this.handleChildError(child, error);
        });
    }
    reconcile(configs, signal) {
        return this.enqueueOperation(() => this.applyConfigs(configs, signal));
    }
    hasSessions() {
        return this.sessions.size > 0;
    }
    suspendRetries() {
        this.retriesSuspended = true;
        for (const session of this.sessions.values()) {
            if (!session.retryTimer)
                continue;
            clearTimeout(session.retryTimer);
            session.retryTimer = null;
        }
    }
    clear() {
        this.runtimeEpoch++;
        const sessions = Array.from(this.sessions.values());
        this.sessions.clear();
        for (const session of sessions) {
            this.cancelRetry(session);
            this.stopChild(session);
        }
    }
    getStatus() {
        return Array.from(this.sessions.entries()).map(([sessionId, session]) => ({
            sessionId,
            status: session.status,
            folderPath: session.desired.folderPath,
            wsUrl: session.desired.sandboxWsUrl,
        }));
    }
    onStatusChanged(callback) {
        this.statusChangedCallbacks.add(callback);
        return () => {
            this.statusChangedCallbacks.delete(callback);
        };
    }
    async applyConfigs(configs, signal) {
        if (signal.aborted)
            return;
        const epoch = this.runtimeEpoch;
        this.retriesSuspended = false;
        const desiredIds = new Set(configs.map((config) => config.sessionId));
        for (const [sessionId, session] of this.sessions.entries()) {
            if (desiredIds.has(sessionId))
                continue;
            this.sessions.delete(sessionId);
            this.cancelRetry(session);
            this.stopChild(session);
            loggerHelper_1.loggerHelper.info(`removed session: ${sessionId}`);
        }
        for (const config of configs) {
            if (this.runtimeEpoch !== epoch)
                return;
            await this.applyConfig(config);
        }
    }
    async applyConfig(config) {
        const session = this.getOrCreateSession(config);
        session.desired = config;
        this.cancelRetry(session);
        if (!this.needsRestart(session, config)) {
            this.setStatus(session, 'connected');
            loggerHelper_1.loggerHelper.info(`session config unchanged ${config.sessionId}`);
            return;
        }
        loggerHelper_1.loggerHelper.info(`starting/restarting session ${config.sessionId}`, config);
        try {
            await this.startSession(session);
        }
        catch (error) {
            if (this.sessions.get(config.sessionId) !== session)
                return;
            this.setStatus(session, 'error');
            loggerHelper_1.loggerHelper.error(`failed to start sidecar for ${config.sessionId}: ${error instanceof Error ? error.message : error}`);
            this.scheduleRetry(config.sessionId, session);
        }
    }
    needsRestart(session, desired) {
        if (!this.sidecarManager.checkStatus(session.child).running)
            return true;
        const active = session.active;
        if (!active)
            return true;
        return (this.getBaseWsUrl(active.sandboxWsUrl) !==
            this.getBaseWsUrl(desired.sandboxWsUrl) ||
            active.folderPath !== desired.folderPath);
    }
    normalizeConfig(config) {
        const folderPath = commonUtils_1.commonUtils.validateSharedFolder(config.folderPath);
        if (!config.sandboxWsUrl.trim()) {
            throw new Error('ws url is required');
        }
        return { ...config, folderPath };
    }
    getOrCreateSession(config) {
        const existing = this.sessions.get(config.sessionId);
        if (existing)
            return existing;
        const session = {
            desired: config,
            active: null,
            child: null,
            status: 'connecting',
            retryAttempts: 0,
            retryTimer: null,
        };
        this.sessions.set(config.sessionId, session);
        this.emitStatusChanged();
        return session;
    }
    async startSession(session) {
        const desired = session.desired;
        const { sessionId } = desired;
        if (this.sessions.get(sessionId) !== session)
            return;
        const normalized = this.normalizeConfig(desired);
        this.stopChild(session);
        this.setStatus(session, 'connecting');
        const child = await this.sidecarManager.spawn(normalized.folderPath, normalized.sandboxWsUrl);
        if (this.sessions.get(sessionId) !== session) {
            loggerHelper_1.loggerHelper.info(`stopping stale sidecar session=${sessionId}`);
            this.sidecarManager.stop(child);
            return;
        }
        session.child = child;
        session.active = desired;
        session.retryAttempts = 0;
        this.setStatus(session, 'connected');
        loggerHelper_1.loggerHelper.info(`sidecar started folder=${normalized.folderPath} session=${sessionId} pid=${child.pid ?? 'unknown'}`);
    }
    handleUnexpectedExit(child) {
        const found = this.findSessionByChild(child);
        if (!found)
            return;
        const [sessionId, session] = found;
        session.child = null;
        session.active = null;
        this.setStatus(session, 'error');
        loggerHelper_1.loggerHelper.error(`sidecar exited unexpectedly session=${sessionId}`);
        this.scheduleRetry(sessionId, session);
    }
    handleChildError(child, error) {
        const found = this.findSessionByChild(child);
        if (!found)
            return;
        const [sessionId, session] = found;
        this.setStatus(session, 'error');
        loggerHelper_1.loggerHelper.error(`sidecar error unexpectedly session=${sessionId} error=${error}`);
        this.scheduleRetry(sessionId, session);
    }
    findSessionByChild(child) {
        for (const entry of this.sessions.entries()) {
            if (entry[1].child === child)
                return entry;
        }
        return null;
    }
    scheduleRetry(sessionId, session) {
        if (this.retriesSuspended)
            return;
        if (this.sessions.get(sessionId) !== session)
            return;
        if (session.retryAttempts >= MAX_RECONNECT_ATTEMPTS) {
            loggerHelper_1.loggerHelper.error(`sidecar reconnect limit reached session=${sessionId}`);
            return;
        }
        if (session.retryTimer) {
            clearTimeout(session.retryTimer);
        }
        const delay = Math.min(RECONNECT_DELAY_MS * Math.pow(2, session.retryAttempts), RECONNECT_MAX_DELAY_MS);
        session.retryTimer = setTimeout(() => {
            session.retryTimer = null;
            this.enqueueOperation(() => this.retrySession(sessionId, session));
        }, delay);
        loggerHelper_1.loggerHelper.info(`sidecar reconnect scheduled session=${sessionId} attempt=${session.retryAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} delay=${delay}ms`);
    }
    async retrySession(sessionId, session) {
        if (this.retriesSuspended)
            return;
        if (this.sessions.get(sessionId) !== session)
            return;
        if (!this.needsRestart(session, session.desired)) {
            this.cancelRetry(session);
            this.setStatus(session, 'connected');
            return;
        }
        session.retryAttempts++;
        loggerHelper_1.loggerHelper.info(`reconnecting sidecar session=${sessionId} attempt=${session.retryAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        try {
            await this.startSession(session);
        }
        catch (error) {
            if (this.sessions.get(sessionId) !== session)
                return;
            this.setStatus(session, 'error');
            loggerHelper_1.loggerHelper.error(`sidecar reconnect failed session=${sessionId}: ${error instanceof Error ? error.message : error}`);
            this.scheduleRetry(sessionId, session);
        }
    }
    cancelRetry(session) {
        if (session.retryTimer) {
            clearTimeout(session.retryTimer);
            session.retryTimer = null;
        }
        session.retryAttempts = 0;
    }
    stopChild(session) {
        const child = session.child;
        session.child = null;
        session.active = null;
        this.sidecarManager.stop(child);
    }
    setStatus(session, status) {
        if (session.status === status)
            return;
        session.status = status;
        this.emitStatusChanged();
    }
    emitStatusChanged() {
        for (const callback of this.statusChangedCallbacks) {
            try {
                callback();
            }
            catch (error) {
                loggerHelper_1.loggerHelper.error('session status listener failed', error);
            }
        }
    }
    enqueueOperation(operation) {
        const result = this.pendingOperation.then(operation, operation);
        this.pendingOperation = result.catch((error) => {
            loggerHelper_1.loggerHelper.error('session operation failed', error);
        });
        return result;
    }
    getBaseWsUrl(wsUrl) {
        try {
            const url = new URL(wsUrl);
            return `${url.protocol}//${url.host}${url.pathname}`;
        }
        catch {
            return wsUrl;
        }
    }
}
exports.SessionSupervisor = SessionSupervisor;
