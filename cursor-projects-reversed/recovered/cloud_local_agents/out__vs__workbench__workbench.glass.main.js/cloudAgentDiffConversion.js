// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentDiffConversion.js
// byteRange: [20336700, 20337397)
// beautified: false
// truncated: false
O({"cloudAgentDiffConversion.js"(){"use strict";Pt(),Cum(),ac()}});function nzr(t){return t===void 0?Aum:t.getDynamicConfig(Ium,{disableExposureLog:!0})}function U9a(t){return t!==void 0&&t.length>0?t:izr}function xum(t){return(t[t.length-1]??0)+1e3}function FkS(t){if(t.focused)return t.backoffDelayMs;const e=t.baseIntervalMs*Rum;return Math.max(t.backoffDelayMs,e)}function j9a(t){if(t.consecutiveFailures<=0)return t.baseIntervalMs;const e=Math.min(t.consecutiveFailures,Pum),n=t.baseIntervalMs*Math.pow(t.multiplier,e);return Math.min(Math.floor(n),t.maxBackoffMs)}function BkS(t){const e=j9a(t);return t.rateLimitFloorMs===void 0?e:Math.max(e,t.rateLimitFloorMs)}var Ium,izr,Aum,Rum,Pum,rzr=
