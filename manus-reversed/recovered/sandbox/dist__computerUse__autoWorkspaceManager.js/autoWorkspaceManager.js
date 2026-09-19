// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/autoWorkspaceManager.js
// kind: full-copy
// name: autoWorkspaceManager.js
// byteRange: [0, 12702)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoWorkspaceManager = exports.AutoWorkspaceManager = exports.AUTO_WORKSPACE_ROOT_DIRNAME = void 0;
exports.isAutoWorkspacePath = isAutoWorkspacePath;
exports.filterStaleAutoWorkspaceFolders = filterStaleAutoWorkspaceFolders;
exports.isAutoWorkspaceActive = isAutoWorkspaceActive;
const electron_1 = require("electron");
const promises_1 = require("node:fs/promises");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const loggerHelper_1 = require("../utils/loggerHelper");
const DEFAULT_MAX_CONCURRENT_SESSIONS = 512;
const MAX_SESSION_ID_LENGTH = 512;
const AUTO_WORKSPACE_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const AUTO_WORKSPACE_LEAF_PATTERN = /^[A-Za-z0-9]{6}$/;
exports.AUTO_WORKSPACE_ROOT_DIRNAME = 'manus-auto-workspace';
const AUTO_WORKSPACE_PATH_PATTERN = new RegExp(`(^|[\\\\/])${exports.AUTO_WORKSPACE_ROOT_DIRNAME}([\\\\/]|$)`);
function isAutoWorkspacePath(folderPath) {
    return AUTO_WORKSPACE_PATH_PATTERN.test(folderPath);
}
function filterStaleAutoWorkspaceFolders(folders, isActive) {
    return folders.filter((folder) => {
        if (!isAutoWorkspacePath(folder.path)) {
            return true;
        }
        try {
            return isActive(folder.path);
        }
        catch {
            return true;
        }
    });
}
function isAutoWorkspaceActive(folderPath, directoryExists) {
    return (directoryExists(folderPath) && exports.autoWorkspaceManager.isClaimed(folderPath));
}
const defaultWorkspaceBasePath = () => {
    try {
        const documents = electron_1.app.getPath('documents');
        if (documents) {
            return documents;
        }
    }
    catch {
        // 系统未登记该目录时回落到 home 下的常规位置
    }
    return node_path_1.default.join(node_os_1.default.homedir(), 'Documents');
};
function isPermissionDeniedError(error) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return false;
    }
    return error.code === 'EPERM' || error.code === 'EACCES';
}
const defaultFallbackWorkspaceBasePath = () => {
    try {
        const userData = electron_1.app.getPath('userData');
        if (userData) {
            return userData;
        }
    }
    catch {
        // 拿不到时用系统临时目录兜底：可用性优先于长期留存
    }
    return node_os_1.default.tmpdir();
};
class AutoWorkspaceManager {
    getWorkspaceBasePath;
    getFallbackWorkspaceBasePath;
    resolvedRootPath;
    getNow;
    maxConcurrentSessions;
    workspaceBySession = new Map();
    sessionByCanonicalPath = new Map();
    inFlightBySession = new Map();
    constructor(options = {}) {
        this.getWorkspaceBasePath =
            options.getWorkspaceBasePath ?? defaultWorkspaceBasePath;
        this.getFallbackWorkspaceBasePath =
            options.getFallbackWorkspaceBasePath ?? defaultFallbackWorkspaceBasePath;
        this.getNow = options.getNow ?? (() => new Date());
        this.maxConcurrentSessions =
            typeof options.maxConcurrentSessions === 'number' &&
                Number.isInteger(options.maxConcurrentSessions) &&
                options.maxConcurrentSessions > 0
                ? options.maxConcurrentSessions
                : DEFAULT_MAX_CONCURRENT_SESSIONS;
    }
    isClaimed(folderPath) {
        for (const workspace of this.workspaceBySession.values()) {
            if (workspace.folderPath === folderPath ||
                workspace.canonicalPath === folderPath) {
                return true;
            }
        }
        return false;
    }
    async ensureAutoWorkspaceFolder(options) {
        const sessionId = options.sessionId;
        if (!sessionId ||
            sessionId !== sessionId.trim() ||
            sessionId.length > MAX_SESSION_ID_LENGTH) {
            throw new Error('Invalid Computer Use workspace session id');
        }
        const inFlight = this.inFlightBySession.get(sessionId);
        if (inFlight) {
            return await inFlight;
        }
        if (this.inFlightBySession.size >= this.maxConcurrentSessions) {
            throw new Error('Too many Computer Use workspaces are being prepared');
        }
        const operation = this.prepareWorkspace({
            sessionId,
            reuseAutoWorkspacePath: options.reuseAutoWorkspacePath,
        });
        this.inFlightBySession.set(sessionId, operation);
        try {
            return await operation;
        }
        finally {
            if (this.inFlightBySession.get(sessionId) === operation) {
                this.inFlightBySession.delete(sessionId);
            }
        }
    }
    async prepareWorkspace(options) {
        const managedRoot = await this.getManagedRoot();
        const cachedWorkspace = this.workspaceBySession.get(options.sessionId);
        if (cachedWorkspace) {
            const validatedWorkspace = await this.tryValidateWorkspace(cachedWorkspace.folderPath, managedRoot);
            if (validatedWorkspace &&
                this.rememberWorkspace(options.sessionId, validatedWorkspace)) {
                return validatedWorkspace.folderPath;
            }
            this.forgetSession(options.sessionId);
        }
        if (options.reuseAutoWorkspacePath) {
            const reusableWorkspace = await this.tryValidateWorkspace(options.reuseAutoWorkspacePath, managedRoot);
            if (reusableWorkspace &&
                this.rememberWorkspace(options.sessionId, reusableWorkspace)) {
                return reusableWorkspace.folderPath;
            }
        }
        const workspace = await this.createWorkspace(managedRoot);
        if (!this.rememberWorkspace(options.sessionId, workspace)) {
            throw new Error('Computer Use workspace is already owned by another session');
        }
        return workspace.folderPath;
    }
    async getManagedRoot() {
        if (this.resolvedRootPath) {
            return await this.prepareManagedRoot(this.resolvedRootPath);
        }
        const preferredPath = node_path_1.default.resolve(this.getWorkspaceBasePath(), exports.AUTO_WORKSPACE_ROOT_DIRNAME);
        try {
            const managedRoot = await this.prepareManagedRoot(preferredPath);
            this.resolvedRootPath = preferredPath;
            return managedRoot;
        }
        catch (error) {
            if (!isPermissionDeniedError(error)) {
                throw error;
            }
            const fallbackPath = node_path_1.default.resolve(this.getFallbackWorkspaceBasePath(), exports.AUTO_WORKSPACE_ROOT_DIRNAME);
            loggerHelper_1.loggerHelper.error(`[autoWorkspace] access denied for ${preferredPath}, falling back to ${fallbackPath}`);
            const managedRoot = await this.prepareManagedRoot(fallbackPath);
            this.resolvedRootPath = fallbackPath;
            return managedRoot;
        }
    }
    async prepareManagedRoot(configuredPath) {
        await (0, promises_1.mkdir)(configuredPath, { recursive: true });
        const configuredPathStats = await (0, promises_1.lstat)(configuredPath);
        if (!configuredPathStats.isDirectory()) {
            throw new Error('Invalid Computer Use workspace root');
        }
        const canonicalPath = await (0, promises_1.realpath)(configuredPath);
        return { configuredPath, canonicalPath };
    }
    async createWorkspace(managedRoot) {
        const now = this.getNow();
        const dateSegment = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('-');
        const dateDirectory = node_path_1.default.join(managedRoot.configuredPath, dateSegment);
        await (0, promises_1.mkdir)(dateDirectory, { recursive: true });
        const dateDirectoryStats = await (0, promises_1.lstat)(dateDirectory);
        if (!dateDirectoryStats.isDirectory()) {
            throw new Error('Invalid Computer Use workspace date directory');
        }
        const canonicalDateDirectory = await (0, promises_1.realpath)(dateDirectory);
        const canonicalDateRelative = node_path_1.default.relative(managedRoot.canonicalPath, canonicalDateDirectory);
        if (canonicalDateRelative !== dateSegment) {
            throw new Error('Computer Use workspace date directory escaped its root');
        }
        const folderPath = await (0, promises_1.mkdtemp)(`${canonicalDateDirectory}${node_path_1.default.sep}`);
        const workspace = await this.tryValidateWorkspace(folderPath, managedRoot);
        if (!workspace) {
            throw new Error('Created an invalid Computer Use workspace');
        }
        return workspace;
    }
    async tryValidateWorkspace(candidatePath, managedRoot) {
        try {
            if (!node_path_1.default.isAbsolute(candidatePath)) {
                return null;
            }
            const folderPath = node_path_1.default.resolve(candidatePath);
            const configuredRelative = node_path_1.default.relative(managedRoot.configuredPath, folderPath);
            const canonicalRootRelative = node_path_1.default.relative(managedRoot.canonicalPath, folderPath);
            if (!this.isValidWorkspaceRelativePath(configuredRelative) &&
                !this.isValidWorkspaceRelativePath(canonicalRootRelative)) {
                return null;
            }
            const candidateStats = await (0, promises_1.lstat)(folderPath);
            if (!candidateStats.isDirectory()) {
                return null;
            }
            const dateDirectoryStats = await (0, promises_1.lstat)(node_path_1.default.dirname(folderPath));
            if (!dateDirectoryStats.isDirectory()) {
                return null;
            }
            const canonicalPath = await (0, promises_1.realpath)(folderPath);
            const canonicalRelative = node_path_1.default.relative(managedRoot.canonicalPath, canonicalPath);
            if (!this.isValidWorkspaceRelativePath(canonicalRelative)) {
                return null;
            }
            return { folderPath: canonicalPath, canonicalPath };
        }
        catch {
            return null;
        }
    }
    isValidWorkspaceRelativePath(relativePath) {
        if (!relativePath || node_path_1.default.isAbsolute(relativePath)) {
            return false;
        }
        const segments = relativePath.split(node_path_1.default.sep);
        const [dateSegment, leafSegment] = segments;
        if (segments.length !== 2 ||
            dateSegment === undefined ||
            leafSegment === undefined) {
            return false;
        }
        return (this.isValidDateSegment(dateSegment) &&
            AUTO_WORKSPACE_LEAF_PATTERN.test(leafSegment));
    }
    isValidDateSegment(value) {
        const match = AUTO_WORKSPACE_DATE_PATTERN.exec(value);
        if (!match) {
            return false;
        }
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(0);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month - 1, day);
        return (date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day);
    }
    rememberWorkspace(sessionId, workspace) {
        const owner = this.sessionByCanonicalPath.get(workspace.canonicalPath);
        if (owner && owner !== sessionId) {
            return false;
        }
        const previousWorkspace = this.workspaceBySession.get(sessionId);
        if (previousWorkspace) {
            this.workspaceBySession.delete(sessionId);
            if (previousWorkspace.canonicalPath !== workspace.canonicalPath &&
                this.sessionByCanonicalPath.get(previousWorkspace.canonicalPath) ===
                    sessionId) {
                this.sessionByCanonicalPath.delete(previousWorkspace.canonicalPath);
            }
        }
        this.workspaceBySession.set(sessionId, workspace);
        this.sessionByCanonicalPath.set(workspace.canonicalPath, sessionId);
        return true;
    }
    forgetSession(sessionId) {
        const workspace = this.workspaceBySession.get(sessionId);
        this.workspaceBySession.delete(sessionId);
        if (workspace &&
            this.sessionByCanonicalPath.get(workspace.canonicalPath) === sessionId) {
            this.sessionByCanonicalPath.delete(workspace.canonicalPath);
        }
    }
}
exports.AutoWorkspaceManager = AutoWorkspaceManager;
exports.autoWorkspaceManager = new AutoWorkspaceManager();
