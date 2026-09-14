// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectPermissionsFileUtils.js
// byteRange: [19676335, 19677566)
// beautified: false
// truncated: false
O({"projectPermissionsFileUtils.js"(){"use strict";Pjt(),Mrm="/.cursor/permissions.json"}});function Drm(t){return t.split(/[/\\]/).filter(e=>e!==""&&e!==".")}function byS(t){const e=t.trim();return e.startsWith("\\\\")||e.startsWith("//")}function _yS(t){return t.scheme===It.file&&t.authority.length>0}function yyS(t){const e=t.trim();return Orm.test(e)&&!m6a.test(e)}function SyS(t){const e=t.trim();return m6a.test(e)&&!g6a.test(e)}function wyS(t){return t.split(/[/\\]/).some(e=>e==="..")}function kyS(t){return Lrm.test(t)}function CyS(t){return t.startsWith("\\")&&!t.startsWith("\\\\")}function TyS(t){return t.startsWith("~/")||t.startsWith("~\\")}function p6a(t){return t.scheme===It.file}function Nrm(t,e){const n=Ve.file(e).path;return t.with({path:n})}function EyS(t,e,n){const i=e.trim();if(i===""||i==="~"||byS(i)||yyS(i)||SyS(i)||wyS(i))return;if(g6a.test(i)){const s=Ve.parse(i);return s.scheme!==It.file||_yS(s)?void 0:p6a(t)?s:t.with({path:s.path})}if(kyS(i)||xa&&CyS(i))return p6a(t)?Ve.file(i):Nrm(t,i);if(TyS(i)){const s=Drm(i.slice(2));return s.length===0?void 0:n.joinPath(t,...s)}if(i.startsWith("/"))return t.with({path:i});const r=Drm(i);if(r.length!==0)return n.joinPath(t,...r)}var m6a,g6a,Lrm,Orm,xyS=
