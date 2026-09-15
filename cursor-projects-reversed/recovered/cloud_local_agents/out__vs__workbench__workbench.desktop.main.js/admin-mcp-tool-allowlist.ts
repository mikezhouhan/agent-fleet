// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: admin-mcp-tool-allowlist.ts
// byteRange: [17834567, 17835423)
// beautified: false
// truncated: false
j({"admin-mcp-tool-allowlist.ts"(){Z8f()}});function o7f(e){return e===s7s.WORKSPACE?"workspace":"system"}function MLd(e,t){return t==="workspace"?{boundary:"workspace",isAdminForcedWorkspace:!0}:{boundary:e,isAdminForcedWorkspace:!1}}function a7f(e){const t=[],n=new Set;for(const i of e??[]){const r=i.trim();r.length===0||n.has(r)||(n.add(r),t.push(r))}return t}function PLd({localAllowlist:e,adminBoundary:t,adminAllowlist:n}){return t==="workspace"?{allowlist:[...n??[]],isAdminForced:!0}:{allowlist:[...e],isAdminForced:!1}}function c7f({localReadBoundary:e,localReadAllowlist:t,adminReadBoundary:n,adminReadAllowlistPaths:i}){const{boundary:r}=MLd(e,n),{allowlist:s}=PLd({localAllowlist:t,adminBoundary:n,adminAllowlist:i});return{agentReadBoundary:r,readAllowlistEntries:s.map(o=>`Read(${o})`),additionalReadPaths:r==="workspace"?s:void 0}}var P7i=
