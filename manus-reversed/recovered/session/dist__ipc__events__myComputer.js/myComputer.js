// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/ipc/events/myComputer.js
// kind: full-copy
// name: myComputer.js
// byteRange: [0, 332)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myComputerEvents = void 0;
const myComputerService_1 = require("../../myComputerService/myComputerService");
exports.myComputerEvents = {
    onLifecycleChanged: (callback) => myComputerService_1.myComputerService.onLifecycleChanged(callback),
};
