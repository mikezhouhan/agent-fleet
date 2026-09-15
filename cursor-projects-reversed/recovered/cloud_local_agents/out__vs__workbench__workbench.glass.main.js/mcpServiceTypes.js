// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpServiceTypes.js
// byteRange: [16904951, 16905479)
// beautified: false
// truncated: false
O({"mcpServiceTypes.js"(){"use strict";Yc(),_t(),fAe(),kC=In("mcpService")}});function Xka(t){const e=t.isConnecting?t.isExchangingToken?"exchangingToken":t.authUrlOpened?"waitingForCallback":"connecting":void 0;return I$y({status:t.status,isEnabled:t.isEnabled,isBlocked:t.isBlocked,blockedMessage:t.blockedMessage,error:t.error,healthyLabelMode:t.healthyLabelMode,enabledToolCount:t.enabledToolCount,promptCount:t.promptCount,resourceCount:t.resourceCount,connectProgress:e})}function sCp(t){return Xka(t).detailLabel}var j4r=
