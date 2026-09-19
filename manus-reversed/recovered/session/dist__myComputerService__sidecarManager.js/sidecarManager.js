// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/myComputerService/sidecarManager.js
// kind: full-copy
// name: sidecarManager.js
// byteRange: [0, 9854)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidecarManager = void 0;
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_events_1 = __importDefault(require("node:events"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const sc_prepare_next_1 = require("sc-prepare-next");
const envHelper_1 = require("../utils/envHelper");
const commonUtils_1 = require("../utils/commonUtils");
const loggerHelper_1 = require("../utils/loggerHelper");
const SIDECAR_LABEL = 'Manus sidecar';
class SidecarManager extends node_events_1.default {
    constructor() {
        super();
    }
    async spawn(sharedFolder, wsUrl) {
        const child = this.spawnProcess(sharedFolder, wsUrl);
        await commonUtils_1.commonUtils.ensureChildRunning(child, SIDECAR_LABEL);
        return child;
    }
    stop(child) {
        if (!child) {
            return;
        }
        if (child.exitCode !== null || child.signalCode !== null) {
            return;
        }
        this.terminateProcessGroup(child);
        commonUtils_1.commonUtils.waitForExit(child, 200).then((exited) => {
            if (!exited) {
                child.kill('SIGKILL');
            }
        });
        loggerHelper_1.loggerHelper.info(`${SIDECAR_LABEL} stop requested`);
    }
    removeAll() {
        loggerHelper_1.loggerHelper.info(`${SIDECAR_LABEL} removeAll start platform=${process.platform} parentPid=${process.pid}`);
        try {
            if (process.platform === 'win32') {
                this.removeAllWindows();
            }
            else {
                this.removeAllUnixLike();
            }
            loggerHelper_1.loggerHelper.info(`${SIDECAR_LABEL} removeAll completed`);
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll unexpected error: ${String(error)}`);
        }
    }
    removeAllWindows() {
        const script = `
$parentPid = ${process.pid}
Get-CimInstance Win32_Process -Filter "ParentProcessId = $parentPid" |
  Where-Object { $_.Name -like 'sidecar*' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }
`.trim();
        try {
            const result = (0, node_child_process_1.spawnSync)('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
                windowsHide: true,
                stdio: 'ignore',
            });
            if (result.error) {
                loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll failed to launch powershell: ${String(result.error)}`);
            }
            else if (typeof result.status === 'number' && result.status !== 0) {
                loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll powershell exited with code ${result.status}`);
            }
            else {
                loggerHelper_1.loggerHelper.info(`${SIDECAR_LABEL} removeAll requested (windows)`);
            }
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll windows failed: ${String(error)}`);
        }
    }
    removeAllUnixLike() {
        try {
            const result = (0, node_child_process_1.spawnSync)('ps', ['-axo', 'pid=,ppid=,comm='], {
                stdio: ['ignore', 'pipe', 'ignore'],
                encoding: 'utf8',
            });
            if (result.error) {
                loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll failed to run ps: ${String(result.error)}`);
                return;
            }
            if (typeof result.status === 'number' && result.status !== 0) {
                loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll ps exited with code ${result.status}`);
                return;
            }
            const stdout = typeof result.stdout === 'string' ? result.stdout : '';
            const targetPids = [];
            for (const line of stdout.split('\n')) {
                try {
                    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
                    if (!match) {
                        continue;
                    }
                    const pid = Number(match[1]);
                    const parentPid = Number(match[2]);
                    const command = (match[3] ?? '').trim();
                    if (!Number.isInteger(pid) || !Number.isInteger(parentPid)) {
                        continue;
                    }
                    if (parentPid !== process.pid) {
                        continue;
                    }
                    const commandBaseName = node_path_1.default.basename(command).toLowerCase();
                    if (commandBaseName.includes('sidecar')) {
                        targetPids.push(pid);
                    }
                }
                catch (error) {
                    loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll failed to parse process line: ${String(error)}`);
                }
            }
            for (const pid of targetPids) {
                try {
                    process.kill(-pid, 'SIGKILL');
                }
                catch (error) {
                    loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll failed to kill process group pid=${pid}: ${String(error)}`);
                }
                try {
                    process.kill(pid, 'SIGKILL');
                }
                catch (error) {
                    loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll failed to kill process pid=${pid}: ${String(error)}`);
                }
            }
            loggerHelper_1.loggerHelper.info(`${SIDECAR_LABEL} removeAll requested (unix-like), found=${targetPids.length}`);
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`${SIDECAR_LABEL} removeAll unix-like failed: ${String(error)}`);
        }
    }
    checkStatus(child) {
        if (!child) {
            return { running: false, pid: null };
        }
        if (child.exitCode !== null || child.signalCode !== null) {
            return { running: false, pid: null };
        }
        const pid = typeof child.pid === 'number' ? child.pid : null;
        return { running: true, pid };
    }
    spawnProcess(sharedFolder, wsUrl) {
        const binaryPath = this.resolveSidecarBinary();
        if (!binaryPath) {
            throw new Error('sidecar binary not found. Please place it in bin/ (for example: sidecar or sidecar-windows-x86_64.exe).');
        }
        loggerHelper_1.loggerHelper.info(`spawning sidecar from: ${binaryPath}, folder: ${sharedFolder}`);
        const child = (0, node_child_process_1.spawn)(binaryPath, ['--shared-folder', sharedFolder, '--ws', wsUrl], {
            detached: process.platform !== 'win32',
            stdio: 'ignore',
            windowsHide: true,
            env: {
                ...process.env,
                PARENT_PID: String(process.pid),
            },
        });
        child.on('exit', () => {
            this.emit('exit', sharedFolder, child);
        });
        child.on('error', (err) => {
            this.emit('error', sharedFolder, child, err);
        });
        return child;
    }
    resolveSidecarBinary() {
        const binDirName = this.getSidecarBinDirName();
        const baseDir = electron_1.app.isPackaged
            ? node_path_1.default.join(process.resourcesPath, binDirName)
            : node_path_1.default.join(__dirname, '..', '..', binDirName);
        for (const fileName of this.getSidecarCandidates()) {
            const sidecarPath = node_path_1.default.join(baseDir, fileName);
            if (node_fs_1.default.existsSync(sidecarPath)) {
                return sidecarPath;
            }
        }
        return null;
    }
    getSidecarBinDirName() {
        const useDevBinary = electron_1.app.isPackaged
            ? process.platform === 'darwin' && envHelper_1.envHelper.runtimeEnv === 'dev'
            : sc_prepare_next_1.isDev;
        return useDevBinary ? 'bin/bin-dev' : 'bin';
    }
    getSidecarCandidates() {
        if (process.platform === 'win32') {
            return [
                'sidecar.exe',
                'sidecar-windows-x86_64.exe',
                'sidecar-windows-x64.exe',
                'sidecar-windows-aarch64.exe',
                'sidecar-windows-arm64.exe',
                'sidecar',
            ];
        }
        return ['sidecar'];
    }
    terminateProcessGroup(child) {
        const pid = child.pid;
        if (!pid) {
            return;
        }
        if (process.platform !== 'win32') {
            try {
                process.kill(-pid, 'SIGTERM');
            }
            catch (error) {
                loggerHelper_1.loggerHelper.error(`failed to terminate process group: ${String(error)}`);
            }
            setTimeout(() => {
                try {
                    process.kill(-pid, 'SIGKILL');
                }
                catch (error) {
                    loggerHelper_1.loggerHelper.error(`failed to kill process group: ${String(error)}`);
                }
            }, 120);
            return;
        }
        try {
            (0, node_child_process_1.spawnSync)('taskkill', ['/PID', String(pid), '/T', '/F'], {
                windowsHide: true,
                stdio: 'ignore',
            });
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`failed to taskkill sidecar process: ${String(error)}`);
            child.kill();
        }
    }
}
exports.SidecarManager = SidecarManager;
