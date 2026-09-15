// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: agent-store-conflict-notice.ts
// byteRange: [16391631, 16392284)
// beautified: false
// truncated: false
j({"agent-store-conflict-notice.ts"(){"use strict";xh(),ckn(),AC(),ivd=class{async execute(e,t){return t.op==="ack"?{kind:"acked",count:0}:t.op==="release"?{kind:"released",count:0}:t.op==="noteDeferredEagerWrittenPaths"?{kind:"noted",count:0}:{kind:"not-applicable"}}},T1f=Vw(e=>new ivd,(e,t)=>{})}});function x1f(e){if(!e||e.case===void 0)return{case:void 0};if(e.case==="success"){const t=e.value.awaitResult;return!t||t.case===void 0?{case:void 0}:t.case==="complete"?{case:"complete",value:t.value}:t.case==="stillRunning"?{case:"stillRunning",value:t.value}:{case:void 0}}return e.case==="error"?{case:"error",value:e.value}:{case:void 0}}var I1f=
