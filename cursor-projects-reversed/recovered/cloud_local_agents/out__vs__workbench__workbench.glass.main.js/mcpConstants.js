// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpConstants.js
// byteRange: [16903832, 16904951)
// beautified: false
// truncated: false
O({"mcpConstants.js"(){"use strict";Xkp(),$7t="cursor-browser-extension",W7t="cursor-ide-browser",Qfe="cursor-ide-browser",Nte="cursor-browser-extension",U4r="cursor-app-control",fyn="cursor-subscriptions",Qkp="cursor-dev-control",Zkp="fsd",xhi="suggestions",Jkp="cursor-computer-use",eCp=[W7t],tCp="vs/workbench/services/ai/browser/media/cursor_blame_logo.svg",Yka=new Set([U4r,F4r,fyn,Qkp,Zkp,xhi,Qfe,Nte,Jkp])}});function xnt(t){return(t==="playwright"?"editor":t)??"editor"}function SWy(t){return t.dashboardManaged===!0||t.pluginManaged===!0||t.type==="streamableHttp"&&Qao({identifier:t.identifier,serverUrl:t.url})}function vOe(t){return t.dashboardManaged?"dashboard":t.projectManaged?"project":t.pluginManaged?"plugin":t.extensionId?"extension":"user"}function nCp(t){return t.identifier===Qfe||t.identifier===Nte}function iCp(t){return t.identifier===U4r}function rCp(t){return t.identifier===F4r}function wWy(t){function e(i){return!(nCp(i)||rCp(i)||i.identifier===fyn||t&&iCp(i))}function n(i){return e(i)&&i.dashboardManaged!==!0&&i.pluginManaged!==!0}return{isVisibleServer:e,isRegularServer:n}}var kC,d3=
