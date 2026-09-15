// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: subagentStartResponse.ts
// byteRange: [16409037, 16409455)
// beautified: false
// truncated: false
j({"subagentStartResponse.ts"(){"use strict";mK(),A9(),Fvd=e=>{const t=v6(e);if(!t.isValid)return t;const n=[],i=e;if(i.permission!==void 0){const r=["allow","deny","ask"];r.includes(i.permission)||n.push(`Invalid permission value. Expected one of: ${r.join(", ")}, or undefined`)}return i.user_message!==void 0&&!sle(i.user_message)&&n.push("user_message must be a string if provided"),e2(n.length===0,n)}}}),Bvd,yTf=
