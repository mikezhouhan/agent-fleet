// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: admin-mcp-policy.ts
// byteRange: [19137250, 19137830)
// beautified: false
// truncated: false
O({"admin-mcp-policy.ts"(){iem(),oem="mcp-provider://"}});function aem(t){return t===void 0||t.destructiveHint===!0?!1:t.readOnlyHint===!0}function vvS(t){return aem(t)?"declared_read":t?.readOnlyHint===!1||t?.destructiveHint===!0?"write":"unannotated"}function bvS(t){if(t===void 0)return{};const e={};typeof t.title=="string"&&t.title.length>0&&(e.title=t.title.slice(0,lem));for(const n of["readOnlyHint","destructiveHint","idempotentHint","openWorldHint"])typeof t[n]=="boolean"&&(e[n]=t[n]);return Object.keys(e).length===0?{}:{annotationsJson:JSON.stringify(e)}}var lem,eOa=
