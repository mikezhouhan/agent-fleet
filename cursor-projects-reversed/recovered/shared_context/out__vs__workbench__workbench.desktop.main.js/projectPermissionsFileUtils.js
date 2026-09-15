// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: projectPermissionsFileUtils.js
// byteRange: [18424231, 18425462)
// beautified: false
// truncated: false
j({"projectPermissionsFileUtils.js"(){"use strict";zbt(),c5d="/.cursor/permissions.json"}});function l5d(e){return e.split(/[/\\]/).filter(t=>t!==""&&t!==".")}function yHf(e){const t=e.trim();return t.startsWith("\\\\")||t.startsWith("//")}function SHf(e){return e.scheme===lt.file&&e.authority.length>0}function wHf(e){const t=e.trim();return h5d.test(t)&&!bso.test(t)}function kHf(e){const t=e.trim();return bso.test(t)&&!_so.test(t)}function CHf(e){return e.split(/[/\\]/).some(t=>t==="..")}function THf(e){return d5d.test(e)}function EHf(e){return e.startsWith("\\")&&!e.startsWith("\\\\")}function xHf(e){return e.startsWith("~/")||e.startsWith("~\\")}function vso(e){return e.scheme===lt.file}function u5d(e,t){const n=Se.file(t).path;return e.with({path:n})}function IHf(e,t,n){const i=t.trim();if(i===""||i==="~"||yHf(i)||wHf(i)||kHf(i)||CHf(i))return;if(_so.test(i)){const s=Se.parse(i);return s.scheme!==lt.file||SHf(s)?void 0:vso(e)?s:e.with({path:s.path})}if(THf(i)||Io&&EHf(i))return vso(e)?Se.file(i):u5d(e,i);if(xHf(i)){const s=l5d(i.slice(2));return s.length===0?void 0:n.joinPath(e,...s)}if(i.startsWith("/"))return e.with({path:i});const r=l5d(i);if(r.length!==0)return n.joinPath(e,...r)}var bso,_so,d5d,h5d,AHf=
