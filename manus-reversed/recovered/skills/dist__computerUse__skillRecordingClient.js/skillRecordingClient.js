// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/skillRecordingClient.js
// kind: full-copy
// name: skillRecordingClient.js
// byteRange: [0, 13492)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillRecordingClient = exports.SkillRecordingClient = void 0;
const node_child_process_1 = require("node:child_process");
const node_net_1 = __importDefault(require("node:net"));
const deviceAddonLocators_1 = require("./deviceAddonLocators");
function delay(durationMs) {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isSkillRecordingStatus(value) {
    if (!isRecord(value) || typeof value.state !== 'string') {
        return false;
    }
    return [
        'idle',
        'recording',
        'processing',
        'completed',
        'cancelled',
        'error',
    ].includes(value.state);
}
class SkillRecordingClient {
    helperLaunched = false;
    windowsSession;
    windowsSessionPromise;
    recordingWatchRpc;
    recordingWatchPromise;
    recordingStatusListeners = new Set();
    recordingHelperLocator;
    computerUseLocator;
    constructor(options) {
        this.recordingHelperLocator =
            options?.recordingHelperLocator ?? deviceAddonLocators_1.skillRecorderHelperLocator;
        this.computerUseLocator =
            options?.computerUseHelperLocator ?? deviceAddonLocators_1.computerUseHelperLocator;
    }
    async call(method, params = {}) {
        const isRecordingMethod = method.startsWith('recording/');
        const helper = (isRecordingMethod ? this.recordingHelperLocator : this.computerUseLocator).resolveHelper();
        if (!helper) {
            throw new Error(`${isRecordingMethod ? 'Skill Recorder' : 'Computer Use'} helper is unavailable`);
        }
        if (helper.platform === 'win32') {
            return this.callWindowsHelper(helper.helperPath, helper.stdioArgs, method, params);
        }
        if (!this.helperLaunched) {
            await this.launchHelper(helper.launchCommand);
            this.helperLaunched = true;
        }
        let socket;
        try {
            socket = await this.connectToHelper(helper.socketPath);
        }
        catch {
            this.helperLaunched = false;
            await this.launchHelper(helper.launchCommand);
            this.helperLaunched = true;
            socket = await this.connectToHelper(helper.socketPath);
        }
        const rpc = this.createRpcClient(socket);
        try {
            await rpc.request('initialize', {});
            rpc.notify('notifications/initialized', {});
            return await rpc.request(method, params);
        }
        finally {
            rpc.close();
        }
    }
    onRecordingStatusChanged(listener) {
        this.recordingStatusListeners.add(listener);
        return () => {
            this.recordingStatusListeners.delete(listener);
        };
    }
    async startWatching() {
        if (this.recordingWatchRpc) {
            return;
        }
        if (!this.recordingWatchPromise) {
            this.recordingWatchPromise = this.createRecordingWatcher();
        }
        const pending = this.recordingWatchPromise;
        try {
            await pending;
        }
        finally {
            if (this.recordingWatchPromise === pending) {
                this.recordingWatchPromise = undefined;
            }
        }
    }
    emitRecordingStatus(status) {
        for (const listener of this.recordingStatusListeners) {
            listener(status);
        }
    }
    async createRecordingWatcher() {
        const helper = this.recordingHelperLocator.resolveHelper();
        if (!helper) {
            throw new Error('Skill Recorder helper is unavailable');
        }
        if (helper.platform === 'win32') {
            return;
        }
        if (!this.helperLaunched) {
            await this.launchHelper(helper.launchCommand);
            this.helperLaunched = true;
        }
        let socket;
        try {
            socket = await this.connectToHelper(helper.socketPath);
        }
        catch {
            this.helperLaunched = false;
            await this.launchHelper(helper.launchCommand);
            this.helperLaunched = true;
            socket = await this.connectToHelper(helper.socketPath);
        }
        const rpc = this.createRpcClient(socket, socket, () => socket.end(), () => {
            if (this.recordingWatchRpc === rpc) {
                this.recordingWatchRpc = undefined;
            }
        }, (method, params) => {
            if (method === 'recording/statusChanged' &&
                isSkillRecordingStatus(params)) {
                this.emitRecordingStatus(params);
            }
        });
        try {
            await rpc.request('initialize', {});
            rpc.notify('notifications/initialized', {});
            const subscription = await rpc.request('recording/subscribe', {});
            this.recordingWatchRpc = rpc;
            if (isRecord(subscription) &&
                isSkillRecordingStatus(subscription.status)) {
                this.emitRecordingStatus(subscription.status);
            }
        }
        catch (error) {
            rpc.close();
            throw error;
        }
    }
    async callWindowsHelper(helperPath, stdioArgs, method, params) {
        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const session = await this.getWindowsSession(helperPath, stdioArgs);
            try {
                return await session.rpc.request(method, params);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.disposeWindowsSession(session);
            }
        }
        throw new Error(`Computer Use Windows helper RPC failed: ${lastError?.message ?? 'unknown error'}`);
    }
    async getWindowsSession(helperPath, stdioArgs) {
        const launchKey = JSON.stringify([helperPath, stdioArgs]);
        if (this.windowsSession &&
            this.windowsSession.launchKey === launchKey &&
            this.windowsSession.child.exitCode === null &&
            !this.windowsSession.child.killed) {
            return this.windowsSession;
        }
        if (this.windowsSession) {
            this.disposeWindowsSession(this.windowsSession);
        }
        if (!this.windowsSessionPromise) {
            this.windowsSessionPromise = this.createWindowsSession(helperPath, stdioArgs, launchKey);
        }
        try {
            const session = await this.windowsSessionPromise;
            this.windowsSession = session;
            return session;
        }
        finally {
            this.windowsSessionPromise = undefined;
        }
    }
    async createWindowsSession(helperPath, stdioArgs, launchKey) {
        const child = (0, node_child_process_1.spawn)(helperPath, stdioArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });
        let stderr = '';
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk) => {
            stderr = `${stderr}${chunk}`.slice(-8_192);
        });
        await new Promise((resolve, reject) => {
            child.once('spawn', resolve);
            child.once('error', reject);
        });
        const rpc = this.createRpcClient(child.stdout, child.stdin, () => {
            child.stdin.end();
            if (!child.killed) {
                child.kill();
            }
        }, () => {
            if (this.windowsSession?.child === child) {
                this.windowsSession = undefined;
            }
        });
        try {
            await rpc.request('initialize', {});
            rpc.notify('notifications/initialized', {});
        }
        catch (error) {
            rpc.close();
            const reason = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to initialize Computer Use Windows helper: ${reason}${stderr.trim() ? ` (${stderr.trim()})` : ''}`);
        }
        return { child, launchKey, rpc };
    }
    disposeWindowsSession(session) {
        if (this.windowsSession === session) {
            this.windowsSession = undefined;
        }
        session.rpc.close();
    }
    dispose() {
        this.recordingWatchRpc?.close();
        this.recordingWatchRpc = undefined;
        if (this.windowsSession) {
            this.disposeWindowsSession(this.windowsSession);
        }
    }
    async launchHelper(command) {
        const [executable, ...args] = command;
        if (!executable) {
            throw new Error('Computer Use helper launch command is missing');
        }
        await new Promise((resolve, reject) => {
            const child = (0, node_child_process_1.spawn)(executable, args, {
                stdio: ['ignore', 'ignore', 'pipe'],
            });
            let stderr = '';
            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            child.once('error', reject);
            child.once('exit', (code, signal) => {
                if (signal) {
                    reject(new Error(`Computer Use helper launch ended with ${signal}`));
                    return;
                }
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(`Computer Use helper launch failed with code ${code}: ${stderr.trim()}`));
            });
        });
    }
    async connectToHelper(socketPath) {
        let lastError;
        for (let attempt = 0; attempt < 50; attempt += 1) {
            try {
                return await this.connectOnce(socketPath);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                await delay(100);
            }
        }
        throw new Error(`Failed to connect to Computer Use helper at ${socketPath}: ${lastError?.message ?? 'timeout'}`);
    }
    connectOnce(socketPath) {
        return new Promise((resolve, reject) => {
            const socket = node_net_1.default.createConnection(socketPath);
            const handleError = (error) => {
                socket.destroy();
                reject(error);
            };
            socket.once('connect', () => {
                socket.removeListener('error', handleError);
                resolve(socket);
            });
            socket.once('error', handleError);
        });
    }
    createRpcClient(reader, writer = reader, closeTransport = () => reader.end(), onConnectionClosed, onNotification) {
        let nextId = 1;
        let buffer = '';
        const pending = new Map();
        const rejectPending = (error) => {
            for (const request of pending.values()) {
                request.reject(error);
            }
            pending.clear();
        };
        const handleLine = (line) => {
            let response;
            try {
                response = JSON.parse(line);
            }
            catch {
                return;
            }
            if (response.id == null) {
                if (response.method) {
                    onNotification?.(response.method, response.params);
                }
                return;
            }
            const request = pending.get(response.id);
            if (!request) {
                return;
            }
            pending.delete(response.id);
            if (response.error) {
                request.reject(new Error(response.error.message || 'Computer Use helper RPC failed'));
                return;
            }
            request.resolve(response.result);
        };
        reader.setEncoding('utf8');
        reader.on('data', (chunk) => {
            buffer += chunk;
            for (;;) {
                const newline = buffer.indexOf('\n');
                if (newline < 0) {
                    return;
                }
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (line) {
                    handleLine(line);
                }
            }
        });
        reader.on('error', rejectPending);
        reader.on('close', () => {
            rejectPending(new Error('Computer Use helper connection closed'));
            onConnectionClosed?.();
        });
        const write = (payload) => {
            writer.write(`${JSON.stringify(payload)}\n`);
        };
        return {
            request(method, params) {
                const id = nextId++;
                return new Promise((resolve, reject) => {
                    pending.set(id, { resolve, reject });
                    writer.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`, (error) => {
                        if (!error) {
                            return;
                        }
                        pending.delete(id);
                        reject(error);
                    });
                });
            },
            notify(method, params) {
                write({ jsonrpc: '2.0', method, params });
            },
            close() {
                closeTransport();
            },
        };
    }
}
exports.SkillRecordingClient = SkillRecordingClient;
exports.skillRecordingClient = new SkillRecordingClient();
