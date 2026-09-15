// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agent-store-conflict-notice.ts
// byteRange: [17510951, 17511604)
// beautified: false
// truncated: false
O({"agent-store-conflict-notice.ts"(){"use strict";Yc(),Hzn(),cE(),OOp=class{async execute(t,e){return e.op==="ack"?{kind:"acked",count:0}:e.op==="release"?{kind:"released",count:0}:e.op==="noteDeferredEagerWrittenPaths"?{kind:"noted",count:0}:{kind:"not-applicable"}}},Xqy=CC(t=>new OOp,(t,e)=>{})}});function Zqy(t){if(!t||t.case===void 0)return{case:void 0};if(t.case==="success"){const e=t.value.awaitResult;return!e||e.case===void 0?{case:void 0}:e.case==="complete"?{case:"complete",value:e.value}:e.case==="stillRunning"?{case:"stillRunning",value:e.value}:{case:void 0}}return t.case==="error"?{case:"error",value:t.value}:{case:void 0}}var Jqy=
