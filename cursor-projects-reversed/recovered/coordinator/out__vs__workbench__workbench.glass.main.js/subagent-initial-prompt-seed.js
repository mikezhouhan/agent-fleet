// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagent-initial-prompt-seed.js
// byteRange: [31624748, 31625354)
// beautified: false
// truncated: false
O({"subagent-initial-prompt-seed.js"(){"use strict";Xu(),Xv()}});async function uvw({agentRepositoryService:t,childComposerId:e,composerDataService:n,parentComposerId:i}){const r=e.trim(),s=i?.trim();if(!r||!s||r===s||t.getAgentHeader(r)?.subagentParentId?.trim())return;const o=l=>{if(!l||l.data.subagentInfo?.parentComposerId?.trim())return;const c=l.data.subagentInfo,u=c?{...c,parentComposerId:s}:{subagentType:hee.TASK,additionalData:{},parentComposerId:s,conversationLengthAtSpawn:0};l.setData("subagentInfo",u)},a=n.getHandleIfLoaded(r);if(a){o(a);return}o(await n.getComposerHandleById(r))}var dvw=
