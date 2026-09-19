// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/operatorMcpConfig.js
// kind: full-copy
// name: operatorMcpConfig.js
// byteRange: [0, 2763)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorMcpConfig = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const deviceAddonLocators_1 = require("./deviceAddonLocators");
const loggerHelper_1 = require("../utils/loggerHelper");
class OperatorMcpConfig {
    #configDir() {
        return node_path_1.default.join(node_os_1.default.homedir(), '.config', 'manus-computer-operator');
    }
    getManifestPath() {
        return node_path_1.default.join(this.#configDir(), 'mcp_servers.json');
    }
    #deviceAddonEntry(locator) {
        const helper = locator.resolveHelper();
        if (!helper) {
            return undefined;
        }
        const entry = {
            name: helper.serverName,
            description: helper.description,
            transport: helper.platform === 'darwin'
                ? {
                    type: 'socket',
                    path: helper.socketPath,
                    launchCommand: helper.launchCommand,
                }
                : {
                    type: 'stdio',
                    command: helper.helperPath,
                    args: helper.stdioArgs,
                },
        };
        return entry;
    }
    buildEntries() {
        const entries = [];
        for (const locator of deviceAddonLocators_1.deviceAddonLocators) {
            const entry = this.#deviceAddonEntry(locator);
            if (!entry) {
                loggerHelper_1.loggerHelper.error(`[DeviceAddon] ${locator.addonId} helper not found; skipping its manifest entry`);
                continue;
            }
            entries.push(entry);
        }
        return entries;
    }
    #writeFileAtomic(filePath, data) {
        const tmp = `${filePath}.${process.pid}.tmp`;
        node_fs_1.default.writeFileSync(tmp, data, { encoding: 'utf8', mode: 0o600 });
        node_fs_1.default.renameSync(tmp, filePath);
    }
    write() {
        const dir = this.#configDir();
        const entries = this.buildEntries();
        node_fs_1.default.mkdirSync(dir, { recursive: true, mode: 0o700 });
        this.#writeFileAtomic(this.getManifestPath(), `${JSON.stringify(entries, null, 2)}\n`);
        try {
            node_fs_1.default.chmodSync(dir, 0o700);
        }
        catch {
            // 权限收紧失败不阻塞写入
        }
        loggerHelper_1.loggerHelper.info(`[DeviceAddon] operator MCP config written: servers=${entries.length}`);
    }
}
exports.operatorMcpConfig = new OperatorMcpConfig();
