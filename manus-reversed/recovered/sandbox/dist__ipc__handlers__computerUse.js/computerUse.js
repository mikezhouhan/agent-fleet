// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/handlers/computerUse.js
// kind: full-copy
// name: computerUse.js
// byteRange: [0, 3737)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computerUseHandlers = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const skillRecordingClient_1 = require("../../computerUse/skillRecordingClient");
const localMcp_1 = require("./localMcp");
exports.computerUseHandlers = {
    listInstalledApps: async (event, payload) => {
        if (process.platform !== 'darwin' && process.platform !== 'win32') {
            return [];
        }
        if (!(0, localMcp_1.isTrustedComputerUseCaller)(event)) {
            return [];
        }
        const refresh = typeof payload === 'object' &&
            payload !== null &&
            'refresh' in payload &&
            payload.refresh === true;
        try {
            const result = await skillRecordingClient_1.skillRecordingClient.call('application/list', {
                filter: 'regular',
                refresh,
            });
            if (typeof result !== 'object' ||
                result === null ||
                !('apps' in result) ||
                !Array.isArray(result.apps)) {
                return [];
            }
            return result.apps.slice(0, 500).flatMap((item) => {
                if (typeof item !== 'object' || item === null) {
                    return [];
                }
                const name = 'name' in item && typeof item.name === 'string'
                    ? item.name.trim()
                    : '';
                const bundleIdentifier = 'bundleIdentifier' in item &&
                    typeof item.bundleIdentifier === 'string'
                    ? item.bundleIdentifier.trim()
                    : '';
                const appPath = 'path' in item && typeof item.path === 'string'
                    ? item.path.trim()
                    : '';
                if (!name || !appPath) {
                    return [];
                }
                return [
                    {
                        name,
                        bundleIdentifier,
                        path: appPath,
                        isSystem: 'isSystem' in item && typeof item.isSystem === 'boolean'
                            ? item.isSystem
                            : appPath.startsWith('/System/'),
                    },
                ];
            });
        }
        catch (error) {
            electron_log_1.default.debug('Failed to list installed Computer Use apps:', error);
            return [];
        }
    },
    getAppIcon: async (event, app) => {
        if (process.platform !== 'darwin' && process.platform !== 'win32') {
            return null;
        }
        if (!(0, localMcp_1.isTrustedComputerUseCaller)(event)) {
            return null;
        }
        const appIdentifier = typeof app === 'string' ? app.trim() : '';
        if (!appIdentifier || appIdentifier.length > 512) {
            return null;
        }
        try {
            const result = await skillRecordingClient_1.skillRecordingClient.call('application/icon', {
                app: appIdentifier,
            });
            if (typeof result !== 'object' ||
                result === null ||
                !('dataUrl' in result) ||
                typeof result.dataUrl !== 'string' ||
                !result.dataUrl.startsWith('data:image/png;base64,')) {
                return null;
            }
            return result.dataUrl;
        }
        catch (error) {
            electron_log_1.default.debug('Failed to resolve Computer Use app icon:', error);
            return null;
        }
    },
};
