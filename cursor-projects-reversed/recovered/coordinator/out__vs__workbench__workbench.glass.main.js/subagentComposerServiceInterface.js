// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentComposerServiceInterface.js
// byteRange: [19625268, 19626205)
// beautified: false
// truncated: false
O({"subagentComposerServiceInterface.js"(){"use strict";_t(),Ede=In("subagentComposerService")}});function FWr(t,e){return t.checkFeatureGate(Qim,{disableExposureLog:e?.disableExposureLog??!1})}async function n6a(t){if(!FWr(t.experimentService,{disableExposureLog:!0}))return;const e=t.parentConversationId?.trim()??"";if(e.length!==0)return t.commandService.executeCommand(I1u,{parentConversationId:e,childConversationId:t.childConversationId,registerLocalShellMounts:t.registerLocalShellMounts})}async function Xim(t){FWr(t.experimentService,{disableExposureLog:!0})&&await t.commandService.executeCommand(A1u,{childConversationId:t.childConversationId})}async function U_S(t){if(!FWr(t.experimentService,{disableExposureLog:!0}))return;const e=t.agentIds.map(n=>n.trim()).filter(n=>n.length>0);e.length!==0&&await t.commandService.executeCommand(R1u,{agentIds:e})}function j_S(t){const e=t.trim();return e.length>0?[e]:[]}var Qim,i6a=
