// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/computerUse/deviceAddonLocators.js
// kind: full-copy
// name: deviceAddonLocators.js
// byteRange: [0, 855)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceAddonLocators = exports.skillRecorderHelperLocator = exports.computerUseHelperLocator = exports.SKILL_RECORDER_ADDON_ID = exports.COMPUTER_USE_ADDON_ID = void 0;
const AddonHelperLocator_1 = require("./AddonHelperLocator");
exports.COMPUTER_USE_ADDON_ID = 'manus-computer-use';
exports.SKILL_RECORDER_ADDON_ID = 'skill-recorder';
exports.computerUseHelperLocator = new AddonHelperLocator_1.AddonHelperLocator({
    addonId: exports.COMPUTER_USE_ADDON_ID,
});
exports.skillRecorderHelperLocator = new AddonHelperLocator_1.AddonHelperLocator({
    addonId: exports.SKILL_RECORDER_ADDON_ID,
    sharedHelperLocator: exports.computerUseHelperLocator,
});
exports.deviceAddonLocators = [
    exports.computerUseHelperLocator,
    exports.skillRecorderHelperLocator,
];
