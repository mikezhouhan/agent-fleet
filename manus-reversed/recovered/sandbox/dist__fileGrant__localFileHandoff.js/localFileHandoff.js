// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/fileGrant/localFileHandoff.js
// kind: full-copy
// name: localFileHandoff.js
// byteRange: [0, 1292)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLocalFileHandoff = startLocalFileHandoff;
const electron_1 = require("electron");
const loggerHelper_1 = require("../utils/loggerHelper");
const fileGrantService_1 = require("./fileGrantService");
let handoffInFlight = false;
async function startLocalFileHandoff(win) {
    const browserWindow = win.browserWindow;
    const webContents = browserWindow?.webContents;
    if (!browserWindow || browserWindow.isDestroyed() || !webContents) {
        return;
    }
    if (handoffInFlight) {
        return;
    }
    handoffInFlight = true;
    try {
        const result = await electron_1.dialog.showOpenDialog(browserWindow, {
            properties: ['openFile', 'multiSelections'],
            title: 'Select files to send to Manus',
        });
        if (result.canceled || result.filePaths.length === 0) {
            return;
        }
        const token = fileGrantService_1.fileGrantService.issue(result.filePaths, webContents);
        win.emitToRenderer('navigation', 'onOpenLocalFiles', { grantToken: token });
    }
    catch (error) {
        loggerHelper_1.loggerHelper.error('[fileGrant] local file handoff failed', error);
    }
    finally {
        handoffInFlight = false;
    }
}
