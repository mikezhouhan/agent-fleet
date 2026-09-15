// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: explorerSuggestedProjects.js
// byteRange: [19516964, 19517820)
// beautified: false
// truncated: false
j({"explorerSuggestedProjects.js"(){"use strict";qt(),bT(),B9()}});function Sco(e){return yWd.test(e)}function WUt(e){return e.replace(/\\/g,"/").replace(SWd,"")}function wXf(e){const t=Kh(e)?e.uri:Y_(e)?e.configPath:void 0;return t?.scheme===lt.file&&WUt(t.fsPath||t.path).startsWith("/tmp/")}function wco(e){const t=Kh(e)?e.uri:Y_(e)?e.configPath:void 0;return t?t.scheme===lt.file?`uri:${WUt(t.fsPath||t.path)}`:`uri:${t.toString()}`:`id:${e.id}`}function kXf(e,t){if(!Kh(e))return e;const n=t.findCanonicalIdByFolderUri(e.uri);return n===void 0?e:{id:n,uri:e.uri}}function _Wd(e){try{if(e.folderUri)return{id:e.workspaceId,uri:Se.parse(e.folderUri,!0)};if(e.configPath)return{id:e.workspaceId,configPath:Se.parse(e.configPath,!0)};const t=e.paths.length===1?e.paths[0]?.uri:void 0;return t?{id:e.workspaceId,uri:t}:void 0}catch{return}}var yWd,SWd,HUt=
