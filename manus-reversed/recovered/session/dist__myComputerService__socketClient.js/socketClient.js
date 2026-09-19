// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/myComputerService/socketClient.js
// kind: full-copy
// name: socketClient.js
// byteRange: [0, 3989)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient = void 0;
const envHelper_1 = require("../utils/envHelper");
const loggerHelper_1 = require("../utils/loggerHelper");
const StepTimerHelper_1 = require("../utils/StepTimerHelper");
const storageHelper_1 = require("../utils/storageHelper");
const socket_io_client_1 = require("socket.io-client");
class SocketClient {
    socket;
    stepTimer;
    destroyed = false;
    constructor(options) {
        const deviceId = (0, storageHelper_1.getOrGenerateDeviceId)();
        const deviceName = (0, storageHelper_1.getDeviceName)();
        const serverUrl = envHelper_1.envHelper.chatWebsocketUrl.trim();
        if (!serverUrl) {
            throw new Error('server url is required');
        }
        const url = `${serverUrl}/device`;
        loggerHelper_1.loggerHelper.info('[SocketClient] connection params:', {
            url,
            deviceId,
            deviceName,
            hasSessionId: !!options.token,
        });
        this.socket = (0, socket_io_client_1.io)(url, {
            transports: ['websocket'],
            auth: {
                token: options.token,
                deviceId,
                deviceName,
            },
            autoConnect: false,
            forceNew: true,
            reconnection: false,
        });
        this.stepTimer = new StepTimerHelper_1.StepTimerHelper(() => {
            const socket = this.socket;
            if (!socket || this.destroyed)
                return;
            if (socket.connected) {
                this.stepTimer.reset();
                return;
            }
            socket.connect();
        });
        this.socket.on('connect', () => {
            if (this.destroyed)
                return;
            this.stepTimer.reset();
            loggerHelper_1.loggerHelper.info('[SocketClient] EVENT: connect');
            options.onConnect();
        });
        this.socket.on('disconnect', (reason) => {
            if (this.destroyed)
                return;
            loggerHelper_1.loggerHelper.warning('[SocketClient] EVENT: disconnect, reason:', reason);
            options.onDisconnect(reason);
            this.stepTimer.start();
        });
        this.socket.on('connect_error', (error) => {
            if (this.destroyed)
                return;
            loggerHelper_1.loggerHelper.error('[SocketClient] EVENT: connect_error, message:', error.message, 'name:', error.name);
            this.stepTimer.start();
        });
        this.socket.on('error', (error) => {
            if (this.destroyed)
                return;
            loggerHelper_1.loggerHelper.error('[SocketClient] EVENT: error', error);
        });
        this.socket.on('device_config', options.onDeviceConfig);
    }
    connect() {
        if (this.destroyed)
            return;
        this.socket?.connect();
    }
    get connected() {
        return this.socket?.connected ?? false;
    }
    nudgeConnection() {
        const socket = this.socket;
        if (!socket || this.destroyed)
            return;
        this.stepTimer.reset();
        if (socket.connected)
            return;
        socket.connect();
        this.stepTimer.start();
    }
    emitDeviceStatus(payload) {
        const socket = this.socket;
        if (!socket || this.destroyed || !socket.connected) {
            return false;
        }
        loggerHelper_1.loggerHelper.info('device_status', payload);
        socket.volatile.emit('device_status', payload);
        return true;
    }
    destroy() {
        const socket = this.socket;
        if (!socket || this.destroyed)
            return;
        this.destroyed = true;
        this.stepTimer.reset();
        socket.removeAllListeners();
        socket.receiveBuffer = [];
        socket.sendBuffer = [];
        socket.disconnect();
        socket.io.removeAllListeners();
        this.socket = null;
    }
}
exports.SocketClient = SocketClient;
