// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpProcessServerIdentifier.js
// byteRange: [17493534, 17494318)
// beautified: false
// truncated: false
j({"mcpProcessServerIdentifier.js"(){"use strict";rb(),R8i="::mcpScope:",lRd="MCP: "}});function g5f(e){return cRd(e)}function f5f(e,t){const n=Deo(t);return e.id===n||e.id?.startsWith(`${n}.workspaceId-`)||e.label===g5f(t)}function uRd(e,t){return e===t||e?.startsWith(`${t}.workspaceId-`)===!0}function v5f(e){return e.label===hRd||uRd(e.id,pRd)||uRd(e.id,Meo)}function dRd(e,t){return e.find(n=>n.workspaceId===t)??e.find(n=>n.workspaceId===void 0||n.workspaceId==="empty-window")??e[0]}function b5f(e,t){const n=dRd(e.filter(i=>f5f(i,t.serverIdentifier)),t.workspaceId);return t.useSharedProcessOutput?n??dRd(e.filter(v5f),t.workspaceId):n}function _5f(e){if(e.useSharedProcessOutput)return $ge(Meo,e.workspaceId)}function y5f(e,t){return b5f(e,t)?.id??_5f(t)}var hRd,pRd,Meo,S5f=
