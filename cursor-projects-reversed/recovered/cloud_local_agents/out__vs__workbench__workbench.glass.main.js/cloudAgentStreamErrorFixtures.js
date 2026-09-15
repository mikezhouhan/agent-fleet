// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentStreamErrorFixtures.js
// byteRange: [20224985, 20226038)
// beautified: false
// truncated: false
O({"cloudAgentStreamErrorFixtures.js"(){"use strict";Yc(),od(),fh(),UHr="We are having difficulties reaching the AI provider.",Klm="The AI provider is rate-limiting requests or is temporarily at capacity.",Ylm="We failed to reach the AI provider despite multiple retry attempts.",Xlm="We are having difficulties reaching the execution environment.",Qlm={transientProviderErrorThenRecovers:RwS,transientErrorsThenPermanentError:PwS,environmentSetupFailedPermanently:MwS,environmentUnreachableThenRecovers:DwS}}});function Zlm(t){return t.map(e=>e.id).join("")}function OwS(t){const e=new Jlm(t.allAgents,t.id,t.source);return{id:t.id,name:t.name,createdAt:t.createdAt,lastUpdatedAt:t.lastUpdatedAt,workspaceIdentifier:t.workspaceIdentifier,source:t.source,isArchived:t.isArchived,agents:e,branchNames:new ecm(e)}}function FwS(t,e){return new MAe([e],n=>n.map(i=>OwS({id:i.id,name:i.name,createdAt:i.createdAt,lastUpdatedAt:i.lastUpdatedAt,workspaceIdentifier:i.workspaceIdentifier,source:i.source,isArchived:i.isArchived,allAgents:t})))}var Jlm,ecm,BwS=
