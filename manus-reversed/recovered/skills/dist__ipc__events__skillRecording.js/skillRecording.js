// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/events/skillRecording.js
// kind: full-copy
// name: skillRecording.js
// byteRange: [0, 686)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillRecordingEvents = void 0;
const skillRecordingClient_1 = require("../../computerUse/skillRecordingClient");
const windowManager_1 = require("../../windowManager");
exports.skillRecordingEvents = {
    onStatusChanged: (callback) => skillRecordingClient_1.skillRecordingClient.onRecordingStatusChanged((status) => {
        if (status.state === 'processing') {
            const mainWindow = windowManager_1.windowManager.mainWindow ?? windowManager_1.windowManager.openNewMainWindow();
            mainWindow.show();
            mainWindow.focus();
        }
        callback(status);
    }),
};
