// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpEnvExpansion.js
// byteRange: [19145959, 19146867)
// beautified: false
// truncated: false
O({"mcpEnvExpansion.js"(){"use strict";XV(),_em=/\$\{([^:}]+)(?::-([^}]*))?\}/g}});function NvS(t){switch(t.status){case"connected":return{type:"connected"};case"degraded":return{type:"degraded",reason:t.statusDetail??"Unknown"};case"disconnected":return{type:"disconnected"};case"error":return{type:"error",error:t.statusDetail??"Unknown error",isRetryable:t.statusRetryable};case"initializing":return{type:"initializing"};case"needsAuth":return{type:"needsAuth",authorizationUrl:t.statusDetail??""};default:return{type:"error",error:`Unknown status: ${t.status}`}}}function yem(t){return t.tools.map(e=>({name:e.name,description:e.description??"",inputSchema:e.inputSchema??{},outputSchema:e.outputSchema?e.outputSchema:void 0,title:e.title,annotations:e.annotations,meta:e._meta}))}function LvS(t){return t.resources.map(e=>({uri:e.uri,name:e.name,description:e.description,mimeType:e.mimeType}))}var OvS=
