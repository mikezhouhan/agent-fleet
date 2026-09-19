// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/computerUseHelperProcessManager.js
// kind: full-copy
// name: computerUseHelperProcessManager.js
// byteRange: [0, 4378)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computerUseHelperProcessManager = exports.ComputerUseHelperProcessManager = void 0;
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const deviceAddonLocators_1 = require("./deviceAddonLocators");
const loggerHelper_1 = require("../utils/loggerHelper");
class ComputerUseHelperProcessManager {
    resolvedHelper = null;
    cleanup(reason) {
        if (process.platform !== 'darwin') {
            return;
        }
        const resolved = deviceAddonLocators_1.computerUseHelperLocator.resolveHelper();
        if (resolved?.platform === 'darwin') {
            this.resolvedHelper = {
                helperPath: resolved.helperPath,
                socketPath: resolved.socketPath,
            };
        }
        const helper = this.resolvedHelper;
        if (!helper) {
            return;
        }
        const result = (0, node_child_process_1.spawnSync)('/bin/ps', ['-axo', 'pid=,command='], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        if (result.error ||
            (typeof result.status === 'number' && result.status !== 0)) {
            loggerHelper_1.loggerHelper.error(`[ComputerUseHelper] cleanup ps failed reason=${reason}: ${String(result.error ?? result.status)}`);
            return;
        }
        const stdout = typeof result.stdout === 'string' ? result.stdout : '';
        const processIds = this.findMatchingProcessIds(stdout, helper.helperPath, electron_1.app.isPackaged ? process.resourcesPath : undefined);
        for (const processId of processIds) {
            try {
                process.kill(processId, 'SIGKILL');
            }
            catch {
                // The helper may have exited between ps and kill.
            }
        }
        try {
            node_fs_1.default.rmSync(helper.socketPath, { force: true });
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`[ComputerUseHelper] failed to remove socket reason=${reason}: ${String(error)}`);
        }
        loggerHelper_1.loggerHelper.info(`[ComputerUseHelper] cleanup completed reason=${reason} helper=${helper.helperPath} killed=${processIds.length}`);
    }
    findMatchingProcessIds(output, helperPath, packagedResourceRoot) {
        const helperPrefix = `${node_path_1.default.resolve(helperPath)}${node_path_1.default.sep}`;
        const packagedHelperPrefixes = packagedResourceRoot
            ? [
                node_path_1.default.join(node_path_1.default.resolve(packagedResourceRoot), 'Manus Computer Use'),
                node_path_1.default.join(node_path_1.default.resolve(packagedResourceRoot), 'Manus Preview Computer Use'),
                node_path_1.default.join(node_path_1.default.resolve(packagedResourceRoot), 'Morph Computer Use'),
            ]
            : [];
        const processIds = [];
        for (const line of output.split('\n')) {
            const match = /^\s*(\d+)\s+(.+)$/.exec(line);
            if (!match) {
                continue;
            }
            const processIdValue = match[1];
            const commandValue = match[2];
            if (!processIdValue || !commandValue) {
                continue;
            }
            const processId = Number(processIdValue);
            const command = commandValue.trim();
            const belongsToManagedHelper = command.startsWith(helperPrefix) ||
                packagedHelperPrefixes.some((prefix) => command.startsWith(prefix));
            if (!Number.isInteger(processId) ||
                !belongsToManagedHelper ||
                (!command.includes('/Contents/MacOS/ManusComputerUseService') &&
                    !command.includes('/Contents/MacOS/ManusComputerUseClient'))) {
                continue;
            }
            processIds.push(processId);
        }
        return processIds;
    }
}
exports.ComputerUseHelperProcessManager = ComputerUseHelperProcessManager;
exports.computerUseHelperProcessManager = new ComputerUseHelperProcessManager();
