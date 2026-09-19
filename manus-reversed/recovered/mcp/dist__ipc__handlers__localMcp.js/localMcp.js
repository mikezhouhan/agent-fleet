// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/handlers/localMcp.js
// kind: full-copy
// name: localMcp.js
// byteRange: [0, 3127)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localMcpHandlers = void 0;
exports.isTrustedComputerUseCaller = isTrustedComputerUseCaller;
const node_fs_1 = __importDefault(require("node:fs"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const autoWorkspaceManager_1 = require("../../computerUse/autoWorkspaceManager");
const windowManager_1 = require("../../windowManager");
function isEnsureAutoWorkspaceFolderOptions(value) {
    if (typeof value !== 'object' ||
        value === null ||
        !('sessionId' in value) ||
        typeof value.sessionId !== 'string') {
        return false;
    }
    const keys = Object.keys(value);
    if (!keys.includes('sessionId') ||
        keys.some((key) => key !== 'sessionId' && key !== 'reuseAutoWorkspacePath')) {
        return false;
    }
    return (!('reuseAutoWorkspacePath' in value) ||
        value.reuseAutoWorkspacePath === undefined ||
        typeof value.reuseAutoWorkspacePath === 'string');
}
function isTrustedComputerUseCaller(event) {
    const senderFrame = event.senderFrame;
    if (!senderFrame ||
        senderFrame.parent !== null ||
        senderFrame.frameTreeNodeId !== event.sender.mainFrame.frameTreeNodeId) {
        return false;
    }
    const browserWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (!browserWindow || browserWindow.isDestroyed()) {
        return false;
    }
    const registeredWindow = windowManager_1.windowManager.getWindowById(browserWindow.id);
    if (!registeredWindow || registeredWindow.windowType !== 'main') {
        return false;
    }
    return registeredWindow.browserWindow === browserWindow;
}
exports.localMcpHandlers = {
    listStaleAutoWorkspacePaths: async (_event, paths) => {
        if (!Array.isArray(paths)) {
            return [];
        }
        return paths
            .filter((path) => typeof path === 'string' && (0, autoWorkspaceManager_1.isAutoWorkspacePath)(path))
            .filter((path) => {
            try {
                return !(0, autoWorkspaceManager_1.isAutoWorkspaceActive)(path, node_fs_1.default.existsSync);
            }
            catch {
                return false;
            }
        });
    },
    ensureAutoWorkspaceFolder: async (event, options) => {
        try {
            if (!isTrustedComputerUseCaller(event)) {
                throw new Error('Untrusted Computer Use workspace caller');
            }
            if (!isEnsureAutoWorkspaceFolderOptions(options)) {
                throw new Error('Invalid Computer Use workspace options');
            }
            return await autoWorkspaceManager_1.autoWorkspaceManager.ensureAutoWorkspaceFolder(options);
        }
        catch (error) {
            electron_log_1.default.error('Failed to prepare Computer Use workspace:', error);
            throw new Error('Failed to prepare Computer Use workspace');
        }
    },
};
