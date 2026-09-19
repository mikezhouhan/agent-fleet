// Recovered Manus 1.7.6 client unit. Not original TypeScript.
// shippedPath: dist/agentManager/operatorManagerUtils.js
// kind: full-copy
// name: operatorManagerUtils.js
// byteRange: [0, 700)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operatorManagerUtils = void 0;
class OperatorManagerUtils {
    resolveEnabled(options) {
        if (options.environmentOverride === '1') {
            return true;
        }
        if (options.environmentOverride === '0') {
            return false;
        }
        return options.storedValue !== 'false';
    }
    resolveBinDirName(options) {
        const useDevBinary = options.isPackaged
            ? options.isMac && options.runtimeEnv === 'dev'
            : options.isElectronDev;
        return useDevBinary ? 'bin/bin-dev' : 'bin';
    }
}
exports.operatorManagerUtils = new OperatorManagerUtils();
