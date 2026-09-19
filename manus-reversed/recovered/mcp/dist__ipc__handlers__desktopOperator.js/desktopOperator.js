// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/handlers/desktopOperator.js
// kind: full-copy
// name: desktopOperator.js
// byteRange: [0, 506)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.desktopOperatorHandlers = void 0;
const operatorManager_1 = require("../../agentManager/operatorManager");
exports.desktopOperatorHandlers = {
    getState: () => operatorManager_1.operatorManager.getState(),
    setEnabled: (_event, enabled) => {
        operatorManager_1.operatorManager.setEnabled(Boolean(enabled));
        return { ...operatorManager_1.operatorManager.getState(), requiresRestart: true };
    },
};
