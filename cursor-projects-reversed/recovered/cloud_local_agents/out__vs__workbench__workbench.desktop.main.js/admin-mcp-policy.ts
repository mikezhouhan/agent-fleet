// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: admin-mcp-policy.ts
// byteRange: [17890894, 17891474)
// beautified: false
// truncated: false
j({"admin-mcp-policy.ts"(){fNd(),_Nd="mcp-provider://"}});function yNd(e){return e===void 0||e.destructiveHint===!0?!1:e.readOnlyHint===!0}function hUf(e){return yNd(e)?"declared_read":e?.readOnlyHint===!1||e?.destructiveHint===!0?"write":"unannotated"}function pUf(e){if(e===void 0)return{};const t={};typeof e.title=="string"&&e.title.length>0&&(t.title=e.title.slice(0,SNd));for(const n of["readOnlyHint","destructiveHint","idempotentHint","openWorldHint"])typeof e[n]=="boolean"&&(t[n]=e[n]);return Object.keys(t).length===0?{}:{annotationsJson:JSON.stringify(t)}}var SNd,mio=
