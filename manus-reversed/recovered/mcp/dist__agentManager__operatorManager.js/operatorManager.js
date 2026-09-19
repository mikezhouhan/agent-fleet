// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/agentManager/operatorManager.js
// kind: full-copy
// name: operatorManager.js
// byteRange: [0, 22825)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorManager = void 0;
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const sc_prepare_next_1 = require("sc-prepare-next");
const deviceAddonLocators_1 = require("../computerUse/deviceAddonLocators");
const computerUseHelperProcessManager_1 = require("../computerUse/computerUseHelperProcessManager");
const commonUtils_1 = require("../utils/commonUtils");
const envHelper_1 = require("../utils/envHelper");
const loggerHelper_1 = require("../utils/loggerHelper");
const storageHelper_1 = require("../utils/storageHelper");
const operatorManagerUtils_1 = require("./operatorManagerUtils");
const OPERATOR_LABEL = 'Manus operator';
const OPERATOR_BINARY_NAME = 'manus-computer-operator';
const SIDECAR_BINARY_NAME = 'sidecar';
const OPERATOR_RESTART_DELAY_MS = 3000;
const OPERATOR_RESTART_MAX_DELAY_MS = 10_000;
const OPERATOR_RESTART_RESET_MS = 30000;
const OPERATOR_LOG_MAX_BYTES = 10 * 1024 * 1024;
const ENV_WHITELIST = [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'LANG',
    'LC_ALL',
    'TMPDIR',
    'TEMP',
    'TMP',
    'XDG_CONFIG_HOME',
    'XDG_CACHE_HOME',
    'XDG_DATA_HOME',
];
const ENV_WHITELIST_WINDOWS = [
    'SYSTEMROOT',
    'SYSTEMDRIVE',
    'WINDIR',
    'USERPROFILE',
    'HOMEDRIVE',
    'HOMEPATH',
    'APPDATA',
    'LOCALAPPDATA',
    'PROGRAMDATA',
    'PATHEXT',
    'COMSPEC',
    'USERNAME',
];
function stringifyError(error) {
    return error instanceof Error ? error.message : String(error);
}
class OperatorManager {
    child = null;
    initialized = false;
    shuttingDown = false;
    restartAttempts = 0;
    restartTimer = null;
    restartResetTimer = null;
    lastError = null;
    issuedLoginToken = null;
    pendingOperation = Promise.resolve();
    logStream = null;
    logBytes = 0;
    isEnabled() {
        return operatorManagerUtils_1.operatorManagerUtils.resolveEnabled({
            environmentOverride: process.env.MANUS_DESKTOP_USE_OPERATOR,
            storedValue: storageHelper_1.storageHelper.get('desktopOperatorEnabled'),
        });
    }
    setEnabled(enabled) {
        storageHelper_1.storageHelper.set('desktopOperatorEnabled', enabled ? 'true' : 'false');
    }
    getState() {
        return {
            enabled: this.isEnabled(),
            running: this.isRunning(),
            lastError: this.lastError,
            computerUseHelperAppPath: deviceAddonLocators_1.computerUseHelperLocator.resolveHelper()?.helperPath ?? null,
        };
    }
    async init() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.shuttingDown = false;
        storageHelper_1.storageHelper.onTokenChange((token) => {
            this.handleLoginTokenChanged(token);
        });
        electron_1.app.on('before-quit', () => {
            this.shutdown();
        });
        electron_1.autoUpdater.on('before-quit-for-update', () => {
            this.shutdown('update');
        });
        computerUseHelperProcessManager_1.computerUseHelperProcessManager.cleanup('startup');
        this.removeOrphans();
        await this.enqueue(() => this.startProcess());
    }
    async restart() {
        if (!this.initialized || this.shuttingDown) {
            return;
        }
        await this.enqueue(async () => {
            this.stopProcess();
            this.restartAttempts = 0;
            await this.startProcess();
        });
    }
    shutdown(reason = 'shutdown') {
        if (this.shuttingDown) {
            return;
        }
        this.shuttingDown = true;
        this.stopProcess({ force: true });
        computerUseHelperProcessManager_1.computerUseHelperProcessManager.cleanup(reason);
    }
    handleLoginTokenChanged(token) {
        if (this.shuttingDown || token === this.issuedLoginToken) {
            return;
        }
        this.enqueue(async () => {
            await this.revokeDeviceToken();
            this.stopProcess();
            this.restartAttempts = 0;
            if (!token) {
                this.lastError = null;
                loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} stopped after logout`);
                return;
            }
            await this.startProcess();
        });
    }
    isRunning() {
        const child = this.child;
        return Boolean(child && child.exitCode === null && child.signalCode === null);
    }
    async startProcess() {
        if (this.shuttingDown || !this.isEnabled() || this.isRunning()) {
            return;
        }
        this.cancelRestartTimer();
        const binaryPath = this.resolveOperatorBinary();
        if (!binaryPath) {
            this.lastError = 'operator binary not found';
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} unavailable: binary not found (set MANUS_OPERATOR_BINARY or bundle ${OPERATOR_BINARY_NAME})`);
            return;
        }
        const loginToken = storageHelper_1.storageHelper.getToken();
        if (!loginToken) {
            this.lastError = 'not logged in';
            loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} start skipped: session_id missing`);
            return;
        }
        const deviceId = (0, storageHelper_1.getOrGenerateDeviceId)();
        let deviceToken;
        try {
            deviceToken = await this.exchangeDeviceToken(deviceId, loginToken);
        }
        catch (error) {
            this.lastError = stringifyError(error);
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} device token exchange failed: ${this.lastError}`);
            this.scheduleRestart();
            return;
        }
        this.issuedLoginToken = loginToken;
        const child = (0, node_child_process_1.spawn)(binaryPath, ['start'], {
            detached: process.platform !== 'win32',
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
            env: this.buildEnv(deviceId, deviceToken),
        });
        this.child = child;
        this.attachLogPipes(child);
        child.on('exit', (code, signal) => {
            if (this.child !== child) {
                loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} exited (intentional)`);
                return;
            }
            this.child = null;
            this.lastError = `exited unexpectedly code=${code} signal=${signal}`;
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} ${this.lastError}`);
            this.scheduleRestart();
        });
        child.on('error', (error) => {
            if (this.child !== child) {
                return;
            }
            this.lastError = stringifyError(error);
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} process error: ${this.lastError}`);
        });
        try {
            await commonUtils_1.commonUtils.ensureChildRunning(child, OPERATOR_LABEL);
        }
        catch (error) {
            this.lastError = stringifyError(error);
            return;
        }
        this.lastError = null;
        loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} started from ${binaryPath} pid=${child.pid ?? 'unknown'}`);
        this.cancelRestartResetTimer();
        this.restartResetTimer = setTimeout(() => {
            this.restartResetTimer = null;
            if (this.child === child && this.isRunning()) {
                this.restartAttempts = 0;
            }
        }, OPERATOR_RESTART_RESET_MS);
    }
    stopProcess(options) {
        this.cancelRestartTimer();
        this.cancelRestartResetTimer();
        const child = this.child;
        this.child = null;
        if (!child) {
            return;
        }
        if (child.exitCode !== null || child.signalCode !== null) {
            return;
        }
        this.terminateProcessGroup(child, options?.force === true);
        if (options?.force) {
            try {
                child.kill('SIGKILL');
            }
            catch {
                // The process may already have exited with its process group.
            }
            loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} force stop requested`);
            return;
        }
        commonUtils_1.commonUtils.waitForExit(child, 200).then((exited) => {
            if (!exited) {
                child.kill('SIGKILL');
            }
        });
        loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} stop requested`);
    }
    scheduleRestart() {
        if (!this.initialized || this.shuttingDown || this.restartTimer) {
            return;
        }
        const delay = Math.min(OPERATOR_RESTART_DELAY_MS * 2 ** Math.min(this.restartAttempts, 5), OPERATOR_RESTART_MAX_DELAY_MS);
        this.restartAttempts++;
        loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} restart scheduled attempt=${this.restartAttempts} delay=${delay}ms`);
        this.restartTimer = setTimeout(() => {
            this.restartTimer = null;
            this.enqueue(() => this.startProcess());
        }, delay);
    }
    cancelRestartTimer() {
        if (this.restartTimer) {
            clearTimeout(this.restartTimer);
            this.restartTimer = null;
        }
    }
    cancelRestartResetTimer() {
        if (this.restartResetTimer) {
            clearTimeout(this.restartResetTimer);
            this.restartResetTimer = null;
        }
    }
    enqueue(fn) {
        const run = async () => {
            try {
                await fn();
            }
            catch (error) {
                loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} operation failed: ${stringifyError(error)}`);
            }
        };
        this.pendingOperation = this.pendingOperation.then(run, run);
        return this.pendingOperation;
    }
    getNodeHttpBase() {
        const url = new URL(envHelper_1.envHelper.chatWebsocketUrl);
        if (url.protocol === 'wss:') {
            url.protocol = 'https:';
        }
        else if (url.protocol === 'ws:') {
            url.protocol = 'http:';
        }
        url.pathname = '';
        url.search = '';
        url.hash = '';
        return url.toString().replace(/\/+$/, '');
    }
    async exchangeDeviceToken(deviceId, loginToken) {
        const response = await fetch(`${this.getNodeHttpBase()}/api/desktop/device-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${loginToken}`,
            },
            body: JSON.stringify({ deviceId }),
        });
        if (!response.ok) {
            throw new Error(`device token endpoint returned HTTP ${response.status}`);
        }
        const payload = await response.json();
        const body = commonUtils_1.commonUtils.isRecord(payload) && commonUtils_1.commonUtils.isRecord(payload.data)
            ? payload.data
            : payload;
        const deviceToken = commonUtils_1.commonUtils.isRecord(body) && typeof body.deviceToken === 'string'
            ? body.deviceToken.trim()
            : '';
        if (!deviceToken) {
            throw new Error('device token endpoint returned empty deviceToken');
        }
        return deviceToken;
    }
    async revokeDeviceToken() {
        const loginToken = this.issuedLoginToken;
        this.issuedLoginToken = null;
        if (!loginToken) {
            return;
        }
        try {
            await fetch(`${this.getNodeHttpBase()}/api/desktop/device-token/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${loginToken}`,
                },
                body: JSON.stringify({ deviceId: (0, storageHelper_1.getOrGenerateDeviceId)() }),
            });
        }
        catch (error) {
            loggerHelper_1.loggerHelper.warning(`${OPERATOR_LABEL} device token revoke failed: ${stringifyError(error)}`);
        }
    }
    buildEnv(deviceId, deviceToken) {
        const env = { NODE_ENV: process.env.NODE_ENV };
        const keys = process.platform === 'win32'
            ? [...ENV_WHITELIST, ...ENV_WHITELIST_WINDOWS]
            : ENV_WHITELIST;
        for (const key of keys) {
            const value = process.env[key];
            if (value) {
                env[key] = value;
            }
        }
        env.MANUS_OPERATOR_SOCKET_URL = envHelper_1.envHelper.chatWebsocketUrl;
        env.MANUS_OPERATOR_DEVICE_TOKEN = deviceToken;
        env.MANUS_OPERATOR_DEVICE_ID = deviceId;
        env.MANUS_OPERATOR_PLATFORM = 'desktop';
        env.PARENT_PID = String(process.pid);
        if (!env.LANG) {
            env.LANG = `${electron_1.app.getLocale().split('-').join('_')}.UTF-8`;
        }
        const computerUseHelper = deviceAddonLocators_1.computerUseHelperLocator.resolveHelper();
        if (process.platform === 'win32' && computerUseHelper) {
            env.MANUS_OPERATOR_COMPUTER_USE_HELPER = computerUseHelper.helperPath;
        }
        const sidecarBinary = this.resolveSidecarBinary();
        if (sidecarBinary) {
            env.MANUS_OPERATOR_SIDECAR_BINARY = sidecarBinary;
        }
        else {
            loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} sidecar not resolved, operator will fall back to same-directory lookup`);
        }
        return env;
    }
    resolveOperatorBinary() {
        const override = commonUtils_1.commonUtils.normalizeOptionalValue(process.env.MANUS_OPERATOR_BINARY);
        if (override) {
            if (node_fs_1.default.existsSync(override)) {
                return override;
            }
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} MANUS_OPERATOR_BINARY not found: ${override}`);
            return null;
        }
        const binDirName = this.getBinDirName();
        const baseDir = electron_1.app.isPackaged
            ? node_path_1.default.join(process.resourcesPath, binDirName)
            : node_path_1.default.join(__dirname, '..', '..', binDirName);
        for (const fileName of this.getBinaryCandidates()) {
            const binaryPath = node_path_1.default.join(baseDir, fileName);
            if (node_fs_1.default.existsSync(binaryPath)) {
                return binaryPath;
            }
        }
        return null;
    }
    resolveSidecarBinary() {
        const override = commonUtils_1.commonUtils.normalizeOptionalValue(process.env.MANUS_OPERATOR_SIDECAR_BINARY);
        if (override) {
            if (node_fs_1.default.existsSync(override)) {
                return override;
            }
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} MANUS_OPERATOR_SIDECAR_BINARY not found: ${override}`);
            return null;
        }
        const binDirName = this.getBinDirName();
        const baseDir = electron_1.app.isPackaged
            ? node_path_1.default.join(process.resourcesPath, binDirName)
            : node_path_1.default.join(__dirname, '..', '..', binDirName);
        for (const fileName of this.getSidecarCandidates()) {
            const binaryPath = node_path_1.default.join(baseDir, fileName);
            if (node_fs_1.default.existsSync(binaryPath)) {
                return binaryPath;
            }
        }
        return null;
    }
    getBinDirName() {
        return operatorManagerUtils_1.operatorManagerUtils.resolveBinDirName({
            isPackaged: electron_1.app.isPackaged,
            isMac: process.platform === 'darwin',
            isElectronDev: sc_prepare_next_1.isDev,
            runtimeEnv: envHelper_1.envHelper.runtimeEnv,
        });
    }
    getBinaryCandidates() {
        if (process.platform === 'win32') {
            return [
                `${OPERATOR_BINARY_NAME}.exe`,
                `${OPERATOR_BINARY_NAME}-windows-x86_64.exe`,
                `${OPERATOR_BINARY_NAME}-windows-x64.exe`,
                `${OPERATOR_BINARY_NAME}-windows-aarch64.exe`,
                `${OPERATOR_BINARY_NAME}-windows-arm64.exe`,
                OPERATOR_BINARY_NAME,
            ];
        }
        return [OPERATOR_BINARY_NAME];
    }
    getSidecarCandidates() {
        if (process.platform === 'win32') {
            return [
                `${SIDECAR_BINARY_NAME}.exe`,
                `${SIDECAR_BINARY_NAME}-windows-x86_64.exe`,
                `${SIDECAR_BINARY_NAME}-windows-x64.exe`,
                `${SIDECAR_BINARY_NAME}-windows-aarch64.exe`,
                `${SIDECAR_BINARY_NAME}-windows-arm64.exe`,
                SIDECAR_BINARY_NAME,
            ];
        }
        return [SIDECAR_BINARY_NAME];
    }
    getLogPath() {
        return node_path_1.default.join(electron_1.app.getPath('userData'), 'logs', 'operator.log');
    }
    attachLogPipes(child) {
        const write = (chunk) => this.writeLog(chunk);
        child.stdout?.on('data', write);
        child.stderr?.on('data', write);
    }
    writeLog(chunk) {
        try {
            if (this.logStream &&
                this.logBytes + chunk.length > OPERATOR_LOG_MAX_BYTES) {
                this.logStream.end();
                this.logStream = null;
                this.openLogStream(true);
            }
            else if (!this.logStream) {
                this.openLogStream(false);
            }
            this.logStream?.write(chunk);
            this.logBytes += chunk.length;
        }
        catch (error) {
            console.error('failed to write operator log:', error);
        }
    }
    openLogStream(truncate) {
        const logPath = this.getLogPath();
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(logPath), { recursive: true });
        let shouldTruncate = truncate;
        if (!shouldTruncate) {
            try {
                this.logBytes = node_fs_1.default.statSync(logPath).size;
            }
            catch {
                this.logBytes = 0;
            }
            shouldTruncate = this.logBytes > OPERATOR_LOG_MAX_BYTES;
        }
        if (shouldTruncate) {
            this.logBytes = 0;
        }
        this.logStream = node_fs_1.default.createWriteStream(logPath, {
            flags: shouldTruncate ? 'w' : 'a',
        });
    }
    removeOrphans() {
        loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} removeOrphans start platform=${process.platform} parentPid=${process.pid}`);
        try {
            if (process.platform === 'win32') {
                this.removeOrphansWindows();
            }
            else {
                this.removeOrphansUnixLike();
            }
            loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} removeOrphans completed`);
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} removeOrphans unexpected error: ${String(error)}`);
        }
    }
    removeOrphansWindows() {
        const script = `
$parentPid = ${process.pid}
Get-CimInstance Win32_Process -Filter "ParentProcessId = $parentPid" |
  Where-Object { $_.Name -like '${OPERATOR_BINARY_NAME}*' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }
`.trim();
        const result = (0, node_child_process_1.spawnSync)('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
            windowsHide: true,
            stdio: 'ignore',
        });
        if (result.error) {
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} removeOrphans failed to launch powershell: ${String(result.error)}`);
        }
        else if (typeof result.status === 'number' && result.status !== 0) {
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} removeOrphans powershell exited with code ${result.status}`);
        }
    }
    removeOrphansUnixLike() {
        const result = (0, node_child_process_1.spawnSync)('ps', ['-axo', 'pid=,ppid=,comm='], {
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
        });
        if (result.error ||
            (typeof result.status === 'number' && result.status !== 0)) {
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} removeOrphans ps failed: ${String(result.error ?? result.status)}`);
            return;
        }
        const stdout = typeof result.stdout === 'string' ? result.stdout : '';
        const targetPids = [];
        for (const line of stdout.split('\n')) {
            const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
            if (!match) {
                continue;
            }
            const pid = Number(match[1]);
            const parentPid = Number(match[2]);
            const command = (match[3] ?? '').trim();
            if (!Number.isInteger(pid) || parentPid !== process.pid) {
                continue;
            }
            if (node_path_1.default.basename(command).toLowerCase().includes(OPERATOR_BINARY_NAME)) {
                targetPids.push(pid);
            }
        }
        for (const pid of targetPids) {
            try {
                process.kill(-pid, 'SIGKILL');
            }
            catch {
                // 进程组可能已不存在
            }
            try {
                process.kill(pid, 'SIGKILL');
            }
            catch {
                // 进程可能已退出
            }
        }
        loggerHelper_1.loggerHelper.info(`${OPERATOR_LABEL} removeOrphans requested (unix-like), found=${targetPids.length}`);
    }
    terminateProcessGroup(child, force) {
        const pid = child.pid;
        if (!pid) {
            return;
        }
        if (process.platform !== 'win32') {
            try {
                process.kill(-pid, force ? 'SIGKILL' : 'SIGTERM');
            }
            catch (error) {
                loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} failed to terminate process group: ${String(error)}`);
            }
            if (!force) {
                setTimeout(() => {
                    try {
                        process.kill(-pid, 'SIGKILL');
                    }
                    catch {
                        // 进程组已退出
                    }
                }, 120);
            }
            return;
        }
        try {
            (0, node_child_process_1.spawnSync)('taskkill', ['/PID', String(pid), '/T', '/F'], {
                windowsHide: true,
                stdio: 'ignore',
            });
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`${OPERATOR_LABEL} failed to taskkill process: ${String(error)}`);
            child.kill();
        }
    }
}
exports.operatorManager = new OperatorManager();
