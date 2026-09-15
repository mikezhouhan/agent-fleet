// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: transcriptPaths.js
// byteRange: [16143259, 16143784)
// beautified: false
// truncated: false
j({"transcriptPaths.js"(){"use strict";pXe(),Co(),qt()}});async function n0f(e){const t=e.workspaceUri.scheme===lt.file?e.workspaceUri.fsPath:e.workspaceUri.path,n=Se.joinPath(await e.pathService.userHome(),v4t,MNi(t)),i=Se.joinPath(n,Nzs),r=Bvt({transcriptsDir:i,conversationId:e.conversationId,preferJsonl:!0}).filter(a=>a.path.endsWith(".jsonl"));let s,o=!1;for(const a of r)try{return(await e.fileService.readFile(a)).value.toString()}catch(c){if(c instanceof Error&&DP(c)===1)continue;o||(s=c,o=!0)}if(o)throw s}var i0f=
