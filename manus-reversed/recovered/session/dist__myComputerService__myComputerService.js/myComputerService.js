// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/myComputerService/myComputerService.js
// kind: full-copy
// name: myComputerService.js
// byteRange: [0, 11262)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myComputerService = exports.MyComputerService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const autoWorkspaceManager_1 = require("../computerUse/autoWorkspaceManager");
const EventEmitter_1 = require("../utils/EventEmitter");
const loggerHelper_1 = require("../utils/loggerHelper");
const storageHelper_1 = require("../utils/storageHelper");
const SessionSupervisor_1 = require("./SessionSupervisor");
const sidecarManager_1 = require("./sidecarManager");
const socketClient_1 = require("./socketClient");
const CONTROL_CHANNEL_GRACE_MS = 10000;
const CONFIG_COALESCE_MS = 200;
class MyComputerService {
    sidecarManager = new sidecarManager_1.SidecarManager();
    sessionSupervisor = new SessionSupervisor_1.SessionSupervisor(this.sidecarManager);
    socketClient = null;
    currentToken = null;
    syncRun = null;
    controlChannelGraceTimer = null;
    lifecycle = {
        phase: 'offline',
        appliedConfigVersion: 0,
    };
    events = new EventEmitter_1.EventEmitter();
    constructor() {
        this.sessionSupervisor.onStatusChanged(() => {
            this.reportCurrentStatus();
        });
    }
    start(options) {
        loggerHelper_1.loggerHelper.info(`[MyComputerService] start reason=${options.reason}`);
        if (this.currentToken && this.currentToken !== options.token) {
            this.sessionSupervisor.clear();
        }
        this.currentToken = options.token;
        this.replaceSocket(options.reason);
    }
    stop(reason) {
        loggerHelper_1.loggerHelper.info(`[MyComputerService] stop reason=${reason}`);
        this.currentToken = null;
        this.teardownRuntime(reason);
    }
    handleConnectivity(signal) {
        if (!this.currentToken)
            return;
        if (signal === 'offline') {
            if (this.socketClient?.connected) {
                loggerHelper_1.loggerHelper.info('[MyComputerService] ignored offline signal while socket is connected');
                return;
            }
            this.teardownRuntime('network offline');
            return;
        }
        if (signal === 'resume') {
            this.replaceSocket(signal);
            return;
        }
        this.ensureConnected(signal);
    }
    shutdown() {
        this.stop('shutdown');
        this.sidecarManager.removeAll();
        this.sidecarManager.removeAllListeners();
    }
    onLifecycleChanged(callback) {
        const listener = this.events.on('lifecycleChanged', callback);
        return () => {
            listener.unregister();
        };
    }
    ensureConnected(reason) {
        if (this.socketClient) {
            loggerHelper_1.loggerHelper.info(`[MyComputerService] nudge connection reason=${reason}`);
            this.socketClient.nudgeConnection();
            return;
        }
        const token = this.currentToken;
        if (!token)
            return;
        this.createSocket(token, reason);
    }
    replaceSocket(reason) {
        const token = this.currentToken;
        if (!token)
            return;
        this.cancelControlChannelGrace();
        this.destroySocket();
        this.invalidateSyncRun();
        if (this.sessionSupervisor.hasSessions()) {
            this.sessionSupervisor.suspendRetries();
            this.startControlChannelGrace();
        }
        this.createSocket(token, reason);
    }
    createSocket(token, reason) {
        loggerHelper_1.loggerHelper.info(`[MyComputerService] create socket reason=${reason}`);
        this.setLifecycle('connecting');
        try {
            let socketClient = null;
            socketClient = new socketClient_1.SocketClient({
                token,
                onConnect: () => {
                    if (socketClient)
                        this.handleSocketConnect(socketClient);
                },
                onDisconnect: (disconnectReason) => {
                    if (socketClient) {
                        this.handleSocketDisconnect(socketClient, disconnectReason);
                    }
                },
                onDeviceConfig: (message) => {
                    if (socketClient) {
                        this.handleDeviceConfigMessage(socketClient, message);
                    }
                },
            });
            this.socketClient = socketClient;
            socketClient.connect();
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error('[MyComputerService] failed to create socket client', error);
            this.setLifecycle('offline');
        }
    }
    handleSocketConnect(socketClient) {
        if (this.socketClient !== socketClient)
            return;
        loggerHelper_1.loggerHelper.info('[MyComputerService] socket connected');
        this.cancelControlChannelGrace();
        this.beginSyncRun();
        this.setLifecycle('connecting');
    }
    handleSocketDisconnect(socketClient, reason) {
        if (this.socketClient !== socketClient)
            return;
        loggerHelper_1.loggerHelper.info(`[MyComputerService] socket disconnected reason=${reason}`);
        this.invalidateSyncRun();
        this.sessionSupervisor.suspendRetries();
        this.startControlChannelGrace();
        this.setLifecycle('connecting');
    }
    handleDeviceConfigMessage(socketClient, message) {
        if (this.socketClient !== socketClient)
            return;
        const run = this.syncRun;
        if (!run)
            return;
        if (message.configVersion < run.latestVersion) {
            loggerHelper_1.loggerHelper.warning(`ignored stale device config version ${message.configVersion}, latest=${run.latestVersion}`);
            return;
        }
        const deviceId = (0, storageHelper_1.getOrGenerateDeviceId)();
        if (message.deviceId !== deviceId) {
            loggerHelper_1.loggerHelper.warning(`device config for unexpected device: ${message.deviceId} (current ${deviceId})`);
        }
        loggerHelper_1.loggerHelper.info(`received device config v${message.configVersion} device=${message.deviceId} sessions=${JSON.stringify(message.sessions.map((session) => session.sessionId))}`);
        run.latestVersion = message.configVersion;
        run.pendingConfig = message;
        this.startConfigDrain(run);
    }
    startConfigDrain(run) {
        if (run.draining)
            return;
        run.draining = true;
        this.drainDeviceConfigs(run).then(() => this.finishConfigDrain(run), (error) => {
            loggerHelper_1.loggerHelper.error('[MyComputerService] config drain failed', error);
            this.finishConfigDrain(run);
        });
    }
    async drainDeviceConfigs(run) {
        while (this.syncRun === run &&
            !run.controller.signal.aborted &&
            run.pendingConfig) {
            await new Promise((resolve) => setTimeout(resolve, CONFIG_COALESCE_MS));
            if (this.syncRun !== run || run.controller.signal.aborted)
                return;
            const config = run.pendingConfig;
            if (!config)
                return;
            run.pendingConfig = null;
            await this.sessionSupervisor.reconcile(config.sessions, run.controller.signal);
            if (this.syncRun !== run || run.controller.signal.aborted)
                return;
            if (run.pendingConfig)
                continue;
            run.appliedConfig = config;
            run.statusDirty = false;
            if (this.reportStatus(run)) {
                this.setLifecycle('ready');
            }
        }
    }
    finishConfigDrain(run) {
        run.draining = false;
        if (this.syncRun === run &&
            !run.controller.signal.aborted &&
            run.pendingConfig) {
            this.startConfigDrain(run);
            return;
        }
        if (this.syncRun === run && run.statusDirty && run.appliedConfig) {
            run.statusDirty = false;
            this.reportStatus(run);
        }
    }
    beginSyncRun() {
        this.invalidateSyncRun();
        this.syncRun = {
            controller: new AbortController(),
            latestVersion: -1,
            pendingConfig: null,
            appliedConfig: null,
            draining: false,
            statusDirty: false,
        };
    }
    invalidateSyncRun() {
        this.syncRun?.controller.abort();
        this.syncRun = null;
    }
    destroySocket() {
        this.socketClient?.destroy();
        this.socketClient = null;
    }
    startControlChannelGrace() {
        this.cancelControlChannelGrace();
        this.controlChannelGraceTimer = setTimeout(() => {
            this.controlChannelGraceTimer = null;
            if (this.socketClient?.connected)
                return;
            this.invalidateSyncRun();
            this.sessionSupervisor.clear();
            loggerHelper_1.loggerHelper.info('[MyComputerService] control channel grace expired, runtime cleared');
        }, CONTROL_CHANNEL_GRACE_MS);
    }
    cancelControlChannelGrace() {
        if (!this.controlChannelGraceTimer)
            return;
        clearTimeout(this.controlChannelGraceTimer);
        this.controlChannelGraceTimer = null;
    }
    teardownRuntime(context) {
        this.cancelControlChannelGrace();
        this.destroySocket();
        this.invalidateSyncRun();
        this.sessionSupervisor.clear();
        loggerHelper_1.loggerHelper.info(`[MyComputerService] runtime cleared context=${context}`);
        this.setLifecycle('offline');
    }
    reportCurrentStatus() {
        const run = this.syncRun;
        if (!run?.appliedConfig)
            return false;
        if (run.draining) {
            run.statusDirty = true;
            return false;
        }
        return this.reportStatus(run);
    }
    reportStatus(run) {
        if (this.syncRun !== run || !run.appliedConfig)
            return false;
        return (this.socketClient?.emitDeviceStatus(this.buildStatusReport(run)) ?? false);
    }
    buildStatusReport(run) {
        const config = run.appliedConfig;
        return {
            deviceId: (0, storageHelper_1.getOrGenerateDeviceId)(),
            deviceName: (0, storageHelper_1.getDeviceName)(),
            appliedConfigVersion: config?.configVersion ?? 0,
            sessions: this.sessionSupervisor.getStatus(),
            folders: (0, autoWorkspaceManager_1.filterStaleAutoWorkspaceFolders)(config?.folders ?? [], (p) => (0, autoWorkspaceManager_1.isAutoWorkspaceActive)(p, node_fs_1.default.existsSync)),
            terminalAvailable: true,
        };
    }
    setLifecycle(phase) {
        const lifecycle = {
            phase,
            appliedConfigVersion: this.syncRun?.appliedConfig?.configVersion ?? 0,
        };
        if (lifecycle.phase === this.lifecycle.phase &&
            lifecycle.appliedConfigVersion === this.lifecycle.appliedConfigVersion) {
            return;
        }
        this.lifecycle = lifecycle;
        this.events.emit('lifecycleChanged', lifecycle);
    }
}
exports.MyComputerService = MyComputerService;
exports.myComputerService = new MyComputerService();
