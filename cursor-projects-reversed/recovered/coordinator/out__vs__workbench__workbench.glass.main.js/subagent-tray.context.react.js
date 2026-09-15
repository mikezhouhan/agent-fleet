// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagent-tray.context.react.js
// byteRange: [31623680, 31624748)
// beautified: false
// truncated: false
O({"subagent-tray.context.react.js"(){"use strict";wFl=sAf(null),kFl=sAf(null)}});function cAf({handle:t,initialPrompt:e,initialPromptTaskToolCallId:n}){const i=e?.trim(),r=n?.trim();if(!i&&!r)return;const s=t.data.fullConversationHeadersOnly.find(a=>t.data.conversationMap[a.bubbleId]?.type===ws.HUMAN);if(s){const a=t.data.conversationMap[s.bubbleId];if(!r||a?.type!==ws.HUMAN||a.subagentSpawnTaskToolCallId===r)return;t.setData("conversationMap",{...t.data.conversationMap,[a.bubbleId]:{...a,subagentSpawnTaskToolCallId:r}});return}if(!i)return;const o={...mb(),type:ws.HUMAN,text:i,richText:i,...r?{subagentSpawnTaskToolCallId:r}:{}};t.setData("conversationMap",{[o.bubbleId]:o,...t.data.conversationMap}),t.setData("fullConversationHeadersOnly",[qP(o),...t.data.fullConversationHeadersOnly])}async function cvw({agentId:t,composerDataService:e,initialPrompt:n,initialPromptTaskToolCallId:i}){if(!n?.trim()&&!i?.trim())return;const r=e.getHandleIfLoaded(t)??await e.getComposerHandleById(t);r&&cAf({handle:r,initialPrompt:n,initialPromptTaskToolCallId:i})}var uAf=
