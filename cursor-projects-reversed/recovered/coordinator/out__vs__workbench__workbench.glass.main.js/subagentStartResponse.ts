// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentStartResponse.ts
// byteRange: [17528371, 17528790)
// beautified: false
// truncated: false
O({"subagentStartResponse.ts"(){"use strict";noe(),iq(),gFp=t=>{const e=fH(t);if(!e.isValid)return e;const n=[],i=t;if(i.permission!==void 0){const r=["allow","deny","ask"];r.includes(i.permission)||n.push(`Invalid permission value. Expected one of: ${r.join(", ")}, or undefined`)}return i.user_message!==void 0&&!O0e(i.user_message)&&n.push("user_message must be a string if provided"),NF(n.length===0,n)}}}),fFp,GVy=
