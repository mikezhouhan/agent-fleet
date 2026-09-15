// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpEnvExpansion.js
// byteRange: [17899603, 17900511)
// beautified: false
// truncated: false
j({"mcpEnvExpansion.js"(){"use strict";i7(),MNd=/\$\{([^:}]+)(?::-([^}]*))?\}/g}});function AUf(e){switch(e.status){case"connected":return{type:"connected"};case"degraded":return{type:"degraded",reason:e.statusDetail??"Unknown"};case"disconnected":return{type:"disconnected"};case"error":return{type:"error",error:e.statusDetail??"Unknown error",isRetryable:e.statusRetryable};case"initializing":return{type:"initializing"};case"needsAuth":return{type:"needsAuth",authorizationUrl:e.statusDetail??""};default:return{type:"error",error:`Unknown status: ${e.status}`}}}function PNd(e){return e.tools.map(t=>({name:t.name,description:t.description??"",inputSchema:t.inputSchema??{},outputSchema:t.outputSchema?t.outputSchema:void 0,title:t.title,annotations:t.annotations,meta:t._meta}))}function RUf(e){return e.resources.map(t=>({uri:t.uri,name:t.name,description:t.description,mimeType:t.mimeType}))}var DUf=
