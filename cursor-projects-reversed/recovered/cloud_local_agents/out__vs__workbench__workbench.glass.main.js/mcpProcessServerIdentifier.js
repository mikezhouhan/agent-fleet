// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpProcessServerIdentifier.js
// byteRange: [18696884, 18697668)
// beautified: false
// truncated: false
O({"mcpProcessServerIdentifier.js"(){"use strict";O_(),sjr="::mcpScope:",sKp="MCP: "}});function ydS(t){return rKp(t)}function SdS(t,e){const n=tNa(e);return t.id===n||t.id?.startsWith(`${n}.workspaceId-`)||t.label===ydS(e)}function oKp(t,e){return t===e||t?.startsWith(`${e}.workspaceId-`)===!0}function wdS(t){return t.label===lKp||oKp(t.id,cKp)||oKp(t.id,nNa)}function aKp(t,e){return t.find(n=>n.workspaceId===e)??t.find(n=>n.workspaceId===void 0||n.workspaceId==="empty-window")??t[0]}function kdS(t,e){const n=aKp(t.filter(i=>SdS(i,e.serverIdentifier)),e.workspaceId);return e.useSharedProcessOutput?n??aKp(t.filter(wdS),e.workspaceId):n}function CdS(t){if(t.useSharedProcessOutput)return DAe(nNa,t.workspaceId)}function TdS(t,e){return kdS(t,e)?.id??CdS(e)}var lKp,cKp,nNa,EdS=
