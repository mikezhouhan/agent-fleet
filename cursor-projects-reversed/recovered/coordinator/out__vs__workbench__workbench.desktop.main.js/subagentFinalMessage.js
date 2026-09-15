// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: subagentFinalMessage.js
// byteRange: [18375903, 18376398)
// beautified: false
// truncated: false
j({"subagentFinalMessage.js"(){"use strict";zu(),Ol()}});async function DBd(e,t,n){for(let i=t.turns.length-1;i>=0;i--){const r=await e.getBlob(kh(),t.turns[i]);if(!r)continue;const s=Kq.fromBinary(r);if(s.turn.case==="agentConversationTurn"&&await qWf(e,s,n))return i}}async function qWf(e,t,n){if(t.turn.case!=="agentConversationTurn")return!1;const i=t.turn.value.userMessage;if(!i||i.length===0)return!1;const r=await e.getBlob(kh(),i);return r?H0.fromBinary(r).messageId===n:!1}var MBd,KWf=
