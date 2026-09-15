// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-notes-absent-state.react.js
// byteRange: [27066404, 27067286)
// beautified: false
// truncated: false
O({"project-notes-absent-state.react.js"(){"use strict";Pt(),At()}});function ZQ1(t){return(t.size??0)>0}function JQ1(t){if(t.kind==="unavailable")return{kind:"unavailable",message:t.message};if(t.kind==="probing")return{kind:"unlisted"};const e=t.entries.filter(i=>i.kind==="file"),n=e.find(i=>i.path===qTi&&ZQ1(i))??e.find(i=>i.path===Mds);return n===void 0?{kind:"absent"}:{kind:"found",entry:n}}function eZ1({resolution:t,tasksFile:e,visibleFile:n}){if(t.status==="unavailable")return{kind:"unavailable",message:YX1(t.reason)};if(e.kind==="unavailable")return{kind:"unavailable",message:e.message};if(t.status==="resolving"||e.kind==="unlisted")return{kind:"loading"};if(e.kind==="absent")return{kind:"absent"};const i=n?.content;return n===void 0||i===void 0?{kind:"loading"}:i.kind==="error"?{kind:"unavailable",message:i.message}:{kind:"ready",file:{...n,content:i}}}var tZ1=
