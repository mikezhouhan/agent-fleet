// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/AddonHelperLocator.js
// kind: full-copy
// name: AddonHelperLocator.js
// byteRange: [0, 5938)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddonHelperLocator = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const loggerHelper_1 = require("../utils/loggerHelper");
const addonHost_1 = require("./addonHost");
function readBundleIdentifier(appPath) {
    const plistPath = node_path_1.default.join(appPath, 'Contents', 'Info.plist');
    if (!(0, node_fs_1.existsSync)(plistPath)) {
        return '';
    }
    try {
        const plist = (0, node_fs_1.readFileSync)(plistPath, 'utf8');
        const match = /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/.exec(plist);
        return match?.[1]?.trim() ?? '';
    }
    catch {
        return '';
    }
}
function addonSlug(addonId) {
    return addonId.replace(/^manus-/, '');
}
function distOverrideEnvKey(addonId) {
    const slug = addonSlug(addonId).replace(/-/g, '_').toUpperCase();
    return `MANUS_ADDON_${slug}_DIST`;
}
class AddonHelperLocator {
    addonId;
    #injectedHost;
    #sharedHelperLocator;
    #host;
    #resolved;
    constructor(options) {
        this.addonId = options.addonId;
        this.#injectedHost = options.host;
        this.#sharedHelperLocator = options.sharedHelperLocator;
    }
    resolveResourcesRoot() {
        const override = process.env[distOverrideEnvKey(this.addonId)]?.trim();
        if (override) {
            return override;
        }
        if (electron_1.app.isPackaged && process.resourcesPath) {
            return node_path_1.default.join(process.resourcesPath, 'addons');
        }
        const desktopRoot = node_path_1.default.resolve(__dirname, '../..');
        return node_path_1.default.resolve(desktopRoot, `../../packages/addon-${addonSlug(this.addonId)}/dist/template`);
    }
    host() {
        if (this.#injectedHost) {
            return this.#injectedHost;
        }
        if (!this.#host) {
            this.#host = new addonHost_1.AddonHost({ resourcesRoot: this.resolveResourcesRoot() });
        }
        return this.#host;
    }
    reset() {
        this.#resolved = undefined;
    }
    ensureResolved() {
        if (this.#resolved &&
            !electron_1.app.isPackaged &&
            this.host().isResolvedStale(this.addonId, this.#resolved)) {
            this.#resolved = undefined;
        }
        if (!this.#resolved) {
            this.#resolved = this.host().ensureActive(this.addonId);
        }
        return this.#resolved;
    }
    resolveActiveAddon() {
        return this.ensureResolved();
    }
    resolveHelper() {
        const resolved = this.ensureResolved();
        if (!resolved) {
            return undefined;
        }
        const { mcp } = resolved.platformEntry;
        let helperResolved = resolved;
        const sharedHelperAddonId = resolved.platformEntry.sharedHelperAddonId;
        if (sharedHelperAddonId) {
            if (!this.#sharedHelperLocator ||
                this.#sharedHelperLocator.addonId !== sharedHelperAddonId) {
                loggerHelper_1.loggerHelper.error(`[addonHelperLocator] ${this.addonId} declares shared helper ${sharedHelperAddonId}, but no matching owner locator is configured`);
                return undefined;
            }
            const owner = this.#sharedHelperLocator.resolveActiveAddon();
            if (!owner || owner.platformKey !== resolved.platformKey) {
                loggerHelper_1.loggerHelper.error(`[addonHelperLocator] ${this.addonId} shared helper ${sharedHelperAddonId} is unavailable for ${resolved.platformKey}`);
                return undefined;
            }
            helperResolved = owner;
        }
        const helperPath = helperResolved.helperAbsPath;
        if (!helperPath) {
            loggerHelper_1.loggerHelper.error(`[addonHelperLocator] ${this.addonId} resolved no executable helper`);
            return undefined;
        }
        if (resolved.platformKey === 'darwin') {
            const socketPath = this.resolveSocketPath(helperPath, mcp.server, helperResolved.platformEntry.mcp.server);
            if (!socketPath) {
                loggerHelper_1.loggerHelper.error(`[addonHelperLocator] ${this.addonId} helper has no CFBundleIdentifier; cannot derive its socket path`);
                return undefined;
            }
            const helper = {
                platform: 'darwin',
                serverName: mcp.server,
                helperPath,
                socketPath,
                launchCommand: ['open', '-g', helperPath],
                description: mcp.description,
            };
            return helper;
        }
        if (resolved.platformKey.startsWith('win32')) {
            const stdioArgs = mcp.args;
            if (!stdioArgs) {
                loggerHelper_1.loggerHelper.error(`[addonHelperLocator] ${this.addonId} stdio entry declares no args; refusing to guess`);
                return undefined;
            }
            const helper = {
                platform: 'win32',
                serverName: mcp.server,
                helperPath,
                stdioArgs,
                description: mcp.description,
            };
            return helper;
        }
        return undefined;
    }
    resolveSocketPath(appPath, serverName, helperServerName) {
        const bundleIdentifier = readBundleIdentifier(appPath);
        if (!bundleIdentifier) {
            return undefined;
        }
        const uid = typeof process.getuid === 'function' ? process.getuid() : 'user';
        const suffix = serverName === helperServerName ? '' : `.${serverName}`;
        return node_path_1.default.join('/tmp', `${bundleIdentifier}.${uid}${suffix}.sock`);
    }
}
exports.AddonHelperLocator = AddonHelperLocator;
