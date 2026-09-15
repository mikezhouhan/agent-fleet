// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentDiffConversion.js
// byteRange: [19065793, 19066490)
// beautified: false
// truncated: false
j({"cloudAgentDiffConversion.js"(){"use strict";Ti(),M7d(),ry()}});function P7d(e){return e===void 0?F7d:e.getDynamicConfig(O7d,{disableExposureLog:!0})}function L7d(e){return e!==void 0&&e.length>0?e:nWi}function SKf(e){return(e[e.length-1]??0)+1e3}function wKf(e){if(e.focused)return e.backoffDelayMs;const t=e.baseIntervalMs*B7d;return Math.max(e.backoffDelayMs,t)}function N7d(e){if(e.consecutiveFailures<=0)return e.baseIntervalMs;const t=Math.min(e.consecutiveFailures,U7d),n=e.baseIntervalMs*Math.pow(e.multiplier,t);return Math.min(Math.floor(n),e.maxBackoffMs)}function kKf(e){const t=N7d(e);return e.rateLimitFloorMs===void 0?t:Math.max(t,e.rateLimitFloorMs)}var O7d,nWi,F7d,B7d,U7d,$7d=
