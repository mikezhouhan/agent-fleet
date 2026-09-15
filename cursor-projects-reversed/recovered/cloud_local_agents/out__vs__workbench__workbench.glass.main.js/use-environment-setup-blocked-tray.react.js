// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-environment-setup-blocked-tray.react.js
// byteRange: [32056094, 32056972)
// beautified: false
// truncated: false
O({"use-environment-setup-blocked-tray.react.js"(){"use strict";z_(),Pt(),fh(),Qs(),fy(),bs(),dff(),GVt(),KAi(),aMl(),HIn(),qVt(),q3f(),UZ(),Dh(),QAi(),kn(),xg(),Y3f={value:"done",onChange:()=>({dispose:()=>{}})},P4l=new Set,HKt=new Set,zKt={bcIds:new Set,listeners:new Set,version:0,dismiss(t){this.bcIds.add(t),this.version++;for(const e of this.listeners)e()},subscribe:t=>(zKt.listeners.add(t),()=>{zKt.listeners.delete(t)}),getVersion:()=>zKt.version},X3f={actionHistory:[],hasBlockingActions:!1,isSaveEnvironmentReady:!1},M4l={entry:null,readiness:{...X3f,hasSetupVmEnvironmentToolResult:!1,hasSuccessfulEnvironmentJsonProposal:!1}}}});function Q3f(t,e){return`${t??J3f}:${e}`}function $xw(t,e,n){return t.has(Q3f(e,n))}function Wxw(t,e,n){const i=new Set(t);return i.add(Q3f(e,n)),i}function Z3f({hasPendingPlan:t,isPlanMode:e,isStreaming:n}){return t&&e&&!n}var J3f,D4l=
