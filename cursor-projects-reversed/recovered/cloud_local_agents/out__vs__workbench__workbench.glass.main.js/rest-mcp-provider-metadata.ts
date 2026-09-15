// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: rest-mcp-provider-metadata.ts
// byteRange: [19141407, 19141751)
// beautified: false
// truncated: false
O({"rest-mcp-provider-metadata.ts"(){Yc(),pem=300*1e3,nOa=new Map}});async function IvS(t,e,n,i=fetch){let r;try{r=new URL(t).hostname}catch{return e}if(!mem.has(r)&&Zao(t)===void 0)return e;let s=await n.resolve(t);if(!s&&Zao(t)!==void 0){const o=(await EvS(t,i))?.clientId;o!==void 0&&(s={CLIENT_ID:o})}return s?e?{...s,...e}:s:e}var mem,AvS=
