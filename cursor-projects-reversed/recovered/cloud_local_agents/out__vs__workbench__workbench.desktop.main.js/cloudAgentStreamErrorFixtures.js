// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentStreamErrorFixtures.js
// byteRange: [18971670, 18972723)
// beautified: false
// truncated: false
j({"cloudAgentStreamErrorFixtures.js"(){"use strict";xh(),bh(),_g(),z$i="We are having difficulties reaching the AI provider.",w8d="The AI provider is rate-limiting requests or is temporarily at capacity.",k8d="We failed to reach the AI provider despite multiple retry attempts.",C8d="We are having difficulties reaching the execution environment.",T8d={transientProviderErrorThenRecovers:Kzf,transientErrorsThenPermanentError:Yzf,environmentSetupFailedPermanently:Xzf,environmentUnreachableThenRecovers:Zzf}}});function E8d(e){return e.map(t=>t.id).join("")}function eqf(e){const t=new x8d(e.allAgents,e.id,e.source);return{id:e.id,name:e.name,createdAt:e.createdAt,lastUpdatedAt:e.lastUpdatedAt,workspaceIdentifier:e.workspaceIdentifier,source:e.source,isArchived:e.isArchived,agents:t,branchNames:new I8d(t)}}function tqf(e,t){return new ibt([t],n=>n.map(i=>eqf({id:i.id,name:i.name,createdAt:i.createdAt,lastUpdatedAt:i.lastUpdatedAt,workspaceIdentifier:i.workspaceIdentifier,source:i.source,isArchived:i.isArchived,allAgents:e})))}var x8d,I8d,nqf=
