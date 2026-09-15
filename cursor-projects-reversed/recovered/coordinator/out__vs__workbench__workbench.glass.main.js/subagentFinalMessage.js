// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentFinalMessage.js
// byteRange: [19627984, 19628479)
// beautified: false
// truncated: false
O({"subagentFinalMessage.js"(){"use strict";Xu(),bu()}});async function irm(t,e,n){for(let i=e.turns.length-1;i>=0;i--){const r=await t.getBlob(kp(),e.turns[i]);if(!r)continue;const s=dK.fromBinary(r);if(s.turn.case==="agentConversationTurn"&&await G_S(t,s,n))return i}}async function G_S(t,e,n){if(e.turn.case!=="agentConversationTurn")return!1;const i=e.turn.value.userMessage;if(!i||i.length===0)return!1;const r=await t.getBlob(kp(),i);return r?mk.fromBinary(r).messageId===n:!1}var rrm,q_S=
