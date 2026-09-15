// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: subagentComposerServiceInterface.js
// byteRange: [18373187, 18374124)
// beautified: false
// truncated: false
j({"subagentComposerServiceInterface.js"(){"use strict";qe(),SZe=un("subagentComposerService")}});function YUi(e,t){return e.checkFeatureGate(CBd,{disableExposureLog:t?.disableExposureLog??!1})}async function wBd(e){if(!YUi(e.experimentService,{disableExposureLog:!0}))return;const t=e.parentConversationId?.trim()??"";if(t.length!==0)return e.commandService.executeCommand(lDc,{parentConversationId:t,childConversationId:e.childConversationId,registerLocalShellMounts:e.registerLocalShellMounts})}async function kBd(e){YUi(e.experimentService,{disableExposureLog:!0})&&await e.commandService.executeCommand(uDc,{childConversationId:e.childConversationId})}async function WWf(e){if(!YUi(e.experimentService,{disableExposureLog:!0}))return;const t=e.agentIds.map(n=>n.trim()).filter(n=>n.length>0);t.length!==0&&await e.commandService.executeCommand(dDc,{agentIds:t})}function HWf(e){const t=e.trim();return t.length>0?[t]:[]}var CBd,TBd=
