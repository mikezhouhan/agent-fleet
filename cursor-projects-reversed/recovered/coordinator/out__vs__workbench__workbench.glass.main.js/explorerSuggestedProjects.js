// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: explorerSuggestedProjects.js
// byteRange: [20788093, 20789045)
// beautified: false
// truncated: false
O({"explorerSuggestedProjects.js"(){"use strict";an(),fy(),v0()}});function F8a(t){return upm.test(t)}function q0n(t){return t.replace(/\\/g,"/").replace(dpm,"")}function $vi(t){const e=Il(t)?t.uri:sh(t)?t.configPath:void 0;return e?.scheme===It.file&&q0n(e.fsPath||e.path).startsWith("/tmp/")}function Zte(t){const e=Il(t)?t.uri:sh(t)?t.configPath:void 0;return e?e.scheme===It.file?`uri:${q0n(e.fsPath||e.path)}`:`uri:${e.toString()}`:`id:${t.id}`}function B8a(t,e){if(!Il(t))return t;const n=e.findCanonicalIdByFolderUri(t.uri);return n===void 0?t:{id:n,uri:t.uri}}function Wvi(t,e){const n=e.findCanonicalIdByFolderUri(t);return n!==void 0?{id:n,uri:t}:FUt(t)}function Hvi(t){try{if(t.folderUri)return{id:t.workspaceId,uri:Ve.parse(t.folderUri,!0)};if(t.configPath)return{id:t.workspaceId,configPath:Ve.parse(t.configPath,!0)};const e=t.paths.length===1?t.paths[0]?.uri:void 0;return e?{id:t.workspaceId,uri:e}:void 0}catch{return}}var upm,dpm,awe=
