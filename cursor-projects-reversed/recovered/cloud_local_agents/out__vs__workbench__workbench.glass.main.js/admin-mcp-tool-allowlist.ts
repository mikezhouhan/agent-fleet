// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: admin-mcp-tool-allowlist.ts
// byteRange: [19080917, 19081773)
// beautified: false
// truncated: false
O({"admin-mcp-tool-allowlist.ts"(){nfS()}});function dfS(t){return t===c_a.WORKSPACE?"workspace":"system"}function _Jp(t,e){return e==="workspace"?{boundary:"workspace",isAdminForcedWorkspace:!0}:{boundary:t,isAdminForcedWorkspace:!1}}function hfS(t){const e=[],n=new Set;for(const i of t??[]){const r=i.trim();r.length===0||n.has(r)||(n.add(r),e.push(r))}return e}function yJp({localAllowlist:t,adminBoundary:e,adminAllowlist:n}){return e==="workspace"?{allowlist:[...n??[]],isAdminForced:!0}:{allowlist:[...t],isAdminForced:!1}}function pfS({localReadBoundary:t,localReadAllowlist:e,adminReadBoundary:n,adminReadAllowlistPaths:i}){const{boundary:r}=_Jp(t,n),{allowlist:s}=yJp({localAllowlist:e,adminBoundary:n,adminAllowlist:i});return{agentReadBoundary:r,readAllowlistEntries:s.map(o=>`Read(${o})`),additionalReadPaths:r==="workspace"?s:void 0}}var m$r=
