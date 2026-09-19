// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/addonHost.js
// kind: full-copy
// name: addonHost.js
// byteRange: [0, 14645)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addonHost = exports.AddonHost = void 0;
exports.defaultUserAddonsRoot = defaultUserAddonsRoot;
exports.currentPlatformKey = currentPlatformKey;
const node_child_process_1 = require("node:child_process");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const loggerHelper_1 = require("../utils/loggerHelper");
const addonSigningIdentity_1 = require("./addonSigningIdentity");
function readJson(file) {
    return JSON.parse(node_fs_1.default.readFileSync(file, 'utf8'));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
function isAddonPlatformEntry(value) {
    if (!isRecord(value))
        return false;
    const mcp = value.mcp;
    const hasOwnedHelper = typeof value.helper === 'string';
    const hasSharedHelper = typeof value.sharedHelperAddonId === 'string';
    if (!isRecord(mcp) || hasOwnedHelper === hasSharedHelper)
        return false;
    if (typeof mcp.server !== 'string' || typeof mcp.description !== 'string') {
        return false;
    }
    if (mcp.transport === 'stdio')
        return isStringArray(mcp.args);
    return mcp.transport === 'socket' && mcp.args === undefined;
}
function isAddonSkillList(value) {
    if (value === undefined)
        return true;
    return (Array.isArray(value) &&
        value.every((skill) => isRecord(skill) &&
            typeof skill.name === 'string' &&
            typeof skill.entry === 'string'));
}
function isAddonJson(value) {
    if (!isRecord(value))
        return false;
    return (typeof value.schemaVersion === 'number' &&
        typeof value.addonId === 'string' &&
        typeof value.version === 'string' &&
        isRecord(value.platforms) &&
        Object.values(value.platforms).every(isAddonPlatformEntry) &&
        isAddonSkillList(value.skills));
}
function isActiveState(value) {
    if (!isRecord(value))
        return false;
    return (typeof value.version === 'string' &&
        (value.previous === null || typeof value.previous === 'string'));
}
function readBundleIdentifier(appPath) {
    try {
        const plist = node_fs_1.default.readFileSync(node_path_1.default.join(appPath, 'Contents', 'Info.plist'), 'utf8');
        return (/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/
            .exec(plist)?.[1]
            ?.trim() ?? '');
    }
    catch {
        return '';
    }
}
class CodesignVerifier {
    verify(helperAbsPath, platformKey) {
        if (platformKey !== 'darwin') {
            return node_fs_1.default.existsSync(helperAbsPath);
        }
        const bundleId = readBundleIdentifier(helperAbsPath);
        if (!bundleId || !(0, addonSigningIdentity_1.isAllowedDarwinIdentity)(addonSigningIdentity_1.DARWIN_TEAM_ID, bundleId)) {
            loggerHelper_1.loggerHelper.error(`[addonHost] helper bundle id not allowed: ${bundleId || '(none)'}`);
            return false;
        }
        try {
            (0, node_child_process_1.execFileSync)('/usr/bin/codesign', ['--verify', '--deep', '--strict', helperAbsPath], { stdio: 'ignore' });
            const requirement = electron_1.app.isPackaged
                ? (0, addonSigningIdentity_1.darwinDesignatedRequirement)(bundleId)
                : `identifier "${bundleId}"`;
            (0, node_child_process_1.execFileSync)('/usr/bin/codesign', ['--verify', `-R=${requirement}`, helperAbsPath], { stdio: 'ignore' });
            return true;
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`[addonHost] codesign verify failed for ${helperAbsPath}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    fingerprint(helperAbsPath, platformKey) {
        if (platformKey !== 'darwin') {
            try {
                return (0, node_crypto_1.createHash)('sha256')
                    .update(node_fs_1.default.readFileSync(helperAbsPath))
                    .digest('hex');
            }
            catch {
                return undefined;
            }
        }
        try {
            const out = (0, node_child_process_1.execFileSync)('/usr/bin/codesign', ['--display', '--verbose=4', helperAbsPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
            return /CDHash=([0-9a-f]+)/i.exec(out)?.[1];
        }
        catch {
            return undefined;
        }
    }
}
function defaultUserAddonsRoot() {
    return node_path_1.default.join(electron_1.app.getPath('userData'), 'addons');
}
function currentPlatformKey() {
    if (process.platform === 'darwin')
        return 'darwin';
    if (process.platform === 'win32') {
        return process.arch === 'arm64' ? 'win32-arm64' : 'win32-x64';
    }
    return process.platform;
}
class AddonHost {
    #verifier;
    #userDataRoot;
    #resourcesRoot;
    constructor(opts) {
        this.#verifier = opts?.verifier ?? new CodesignVerifier();
        this.#userDataRoot = opts?.userDataRoot ?? defaultUserAddonsRoot();
        this.#resourcesRoot =
            opts?.resourcesRoot ??
                node_path_1.default.join(process.resourcesPath || process.cwd(), 'addons');
    }
    #userAddonRoot(addonId) {
        return node_path_1.default.join(this.#userDataRoot, addonId);
    }
    #activePath(addonId) {
        return node_path_1.default.join(this.#userAddonRoot(addonId), 'active.json');
    }
    readActive(addonId) {
        try {
            const parsed = readJson(this.#activePath(addonId));
            return isActiveState(parsed) ? parsed : undefined;
        }
        catch {
            return undefined;
        }
    }
    #writeActive(addonId, state) {
        const target = this.#activePath(addonId);
        const tmp = `${target}.${process.pid}.tmp`;
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(target), { recursive: true, mode: 0o700 });
        node_fs_1.default.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, {
            mode: 0o600,
        });
        node_fs_1.default.renameSync(tmp, target);
    }
    #readPackagedTemplate(addonId) {
        const root = node_path_1.default.join(this.#resourcesRoot, addonId);
        const candidates = node_fs_1.default
            .readdirSync(root, { withFileTypes: true })
            .filter((e) => e.isDirectory() &&
            node_fs_1.default.existsSync(node_path_1.default.join(root, e.name, 'addon.json')))
            .map((e) => e.name);
        const [single] = candidates;
        if (!single || candidates.length > 1) {
            throw new Error(candidates.length === 0
                ? `no packaged addon template with addon.json under ${root}`
                : `multiple packaged addon template versions under ${root}: ${candidates.join(', ')}`);
        }
        const dir = node_path_1.default.join(root, single);
        const parsed = readJson(node_path_1.default.join(dir, 'addon.json'));
        if (!isAddonJson(parsed)) {
            throw new Error(`packaged addon.json under ${dir} has invalid shape`);
        }
        return { dir, addonJson: parsed };
    }
    #installVersion(addonId, templateDir, version, helperRel, platformKey) {
        const publishedDir = node_path_1.default.join(this.#userAddonRoot(addonId), version);
        if (!helperRel &&
            this.#contentOnlyVersionMatches(templateDir, publishedDir)) {
            return publishedDir;
        }
        let templateFp;
        if (helperRel) {
            templateFp = this.#verifier.fingerprint(node_path_1.default.join(templateDir, helperRel), platformKey);
            const publishedHelper = node_path_1.default.join(publishedDir, helperRel);
            if (node_fs_1.default.existsSync(publishedHelper) && templateFp) {
                const publishedFp = this.#verifier.fingerprint(publishedHelper, platformKey);
                if (publishedFp === templateFp &&
                    this.#verifier.verify(publishedHelper, platformKey)) {
                    return publishedDir;
                }
            }
        }
        const tmpDir = `${publishedDir}.${process.pid}.${Date.now()}.tmp`;
        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        node_fs_1.default.cpSync(templateDir, tmpDir, {
            recursive: true,
            dereference: false,
            preserveTimestamps: true,
        });
        const tmpHelper = helperRel ? node_path_1.default.join(tmpDir, helperRel) : undefined;
        if (tmpHelper && !this.#verifier.verify(tmpHelper, platformKey)) {
            node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
            throw new Error(`addon ${addonId}@${version} helper failed signature verify after copy`);
        }
        if (tmpHelper && platformKey !== 'darwin') {
            const copyFp = this.#verifier.fingerprint(tmpHelper, platformKey);
            if (!templateFp || copyFp !== templateFp) {
                node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
                throw new Error(`addon ${addonId}@${version} helper failed post-copy verification`);
            }
        }
        node_fs_1.default.rmSync(publishedDir, { recursive: true, force: true });
        node_fs_1.default.renameSync(tmpDir, publishedDir);
        return publishedDir;
    }
    #contentOnlyVersionMatches(templateDir, publishedDir) {
        const relativeFiles = (root) => {
            if (!node_fs_1.default.existsSync(root))
                return [];
            return node_fs_1.default
                .readdirSync(root, { withFileTypes: true })
                .flatMap((entry) => {
                if (!entry.isDirectory())
                    return [entry.name];
                return relativeFiles(node_path_1.default.join(root, entry.name)).map((child) => node_path_1.default.join(entry.name, child));
            })
                .sort();
        };
        const templateFiles = relativeFiles(templateDir);
        const publishedFiles = relativeFiles(publishedDir);
        if (templateFiles.length !== publishedFiles.length ||
            templateFiles.some((file, index) => file !== publishedFiles[index])) {
            return false;
        }
        return templateFiles.every((file) => node_fs_1.default
            .readFileSync(node_path_1.default.join(templateDir, file))
            .equals(node_fs_1.default.readFileSync(node_path_1.default.join(publishedDir, file))));
    }
    ensureActive(addonId) {
        try {
            const { dir: templateDir, addonJson } = this.#readPackagedTemplate(addonId);
            const platformKey = currentPlatformKey();
            const platformEntry = addonJson.platforms[platformKey];
            if (!platformEntry) {
                loggerHelper_1.loggerHelper.error(`[addonHost] addon ${addonId} has no platform entry for ${platformKey}`);
                return undefined;
            }
            const helperRel = platformEntry.helper;
            if (helperRel) {
                const templateHelper = node_path_1.default.join(templateDir, helperRel);
                if (!this.#verifier.verify(templateHelper, platformKey)) {
                    loggerHelper_1.loggerHelper.error(`[addonHost] packaged addon ${addonId}@${addonJson.version} failed signature verify; refusing to run`);
                    return undefined;
                }
            }
            const versionDir = this.#installVersion(addonId, templateDir, addonJson.version, helperRel, platformKey);
            const prev = this.readActive(addonId);
            this.#writeActive(addonId, {
                version: addonJson.version,
                previous: prev && prev.version !== addonJson.version
                    ? prev.version
                    : (prev?.previous ?? null),
            });
            this.#cleanupOldVersions(addonId, addonJson.version);
            return {
                versionDir,
                addonJson,
                platformKey,
                platformEntry,
                helperAbsPath: helperRel ? node_path_1.default.join(versionDir, helperRel) : undefined,
            };
        }
        catch (error) {
            loggerHelper_1.loggerHelper.error(`[addonHost] ensureActive(${addonId}) failed: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
    isResolvedStale(addonId, resolved) {
        try {
            const { dir: templateDir, addonJson } = this.#readPackagedTemplate(addonId);
            if (addonJson.version !== resolved.addonJson.version) {
                return true;
            }
            const platformEntry = addonJson.platforms[resolved.platformKey];
            if (!platformEntry) {
                return false;
            }
            if (!platformEntry.helper || !resolved.helperAbsPath) {
                return !this.#contentOnlyVersionMatches(templateDir, resolved.versionDir);
            }
            const templateFp = this.#verifier.fingerprint(node_path_1.default.join(templateDir, platformEntry.helper), resolved.platformKey);
            if (!templateFp) {
                return false;
            }
            const publishedFp = this.#verifier.fingerprint(resolved.helperAbsPath, resolved.platformKey);
            return publishedFp !== templateFp;
        }
        catch {
            return false;
        }
    }
    #cleanupOldVersions(addonId, current) {
        const keep = new Set([current]);
        const prev = this.readActive(addonId)?.previous;
        if (prev)
            keep.add(prev);
        const root = this.#userAddonRoot(addonId);
        for (const entry of node_fs_1.default.readdirSync(root, { withFileTypes: true })) {
            if (!entry.isDirectory() || keep.has(entry.name))
                continue;
            try {
                node_fs_1.default.rmSync(node_path_1.default.join(root, entry.name), { recursive: true, force: true });
            }
            catch (error) {
                loggerHelper_1.loggerHelper.error(`[addonHost] cleanup old version ${addonId}/${entry.name} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
}
exports.AddonHost = AddonHost;
exports.addonHost = new AddonHost();
