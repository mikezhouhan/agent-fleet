// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: rest-mcp-provider-metadata.ts
// byteRange: [17895051, 17895395)
// beautified: false
// truncated: false
j({"rest-mcp-provider-metadata.ts"(){xh(),ENd=300*1e3,fio=new Map}});async function kUf(e,t,n,i=fetch){let r;try{r=new URL(e).hostname}catch{return t}if(!xNd.has(r)&&eqr(e)===void 0)return t;let s=await n.resolve(e);if(!s&&eqr(e)!==void 0){const o=(await SUf(e,i))?.clientId;o!==void 0&&(s={CLIENT_ID:o})}return s?t?{...s,...t}:s:t}var xNd,CUf=
