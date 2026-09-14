// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: transcriptPaths.js
// byteRange: [17262463, 17262988)
// beautified: false
// truncated: false
O({"transcriptPaths.js"(){"use strict";qWe(),Na(),an()}});async function xGy(t){const e=t.workspaceUri.scheme===It.file?t.workspaceUri.fsPath:t.workspaceUri.path,n=Ve.joinPath(await t.pathService.userHome(),p_n,Pui(e)),i=Ve.joinPath(n,yxa),r=rUt({transcriptsDir:i,conversationId:t.conversationId,preferJsonl:!0}).filter(a=>a.path.endsWith(".jsonl"));let s,o=!1;for(const a of r)try{return(await t.fileService.readFile(a)).value.toString()}catch(l){if(l instanceof Error&&VD(l)===1)continue;o||(s=l,o=!0)}if(o)throw s}var IGy=
