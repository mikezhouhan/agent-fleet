// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagent-preview-parent-link.js
// byteRange: [31625354, 31625967)
// beautified: false
// truncated: false
O({"subagent-preview-parent-link.js"(){"use strict";Xu()}});function dAf(t,e="tray"){return{navigationStack:[t],openSource:e}}function hvw({preview:t,hasPreviewBackTarget:e}){return e||t.openSource==="tray"||t.navigationStack.length>1}function PSs(t){return t?.navigationStack.at(-1)}function pvw({current:t,entry:e,openSource:n="standalone"}){return t?t.navigationStack.at(-1)?.agentId===e.agentId?t:{navigationStack:[...t.navigationStack,e],openSource:t.openSource}:dAf(e,n)}function mvw(t){return t.navigationStack.length<=1?null:{navigationStack:t.navigationStack.slice(0,-1),openSource:t.openSource}}var hAf=
