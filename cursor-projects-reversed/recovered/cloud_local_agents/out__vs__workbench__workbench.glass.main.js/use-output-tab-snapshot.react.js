// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-output-tab-snapshot.react.js
// byteRange: [31029612, 31030574)
// beautified: false
// truncated: false
O({"use-output-tab-snapshot.react.js"(){"use strict";pLl()}});import{c as xtw}from"./react-runtime/react/esm-compiler-runtime-production.js";function Itw(t,e){return t.displayName===e.displayName&&t.remoteHostLabel===e.remoteHostLabel&&t.environmentLabel===e.environmentLabel&&t.environmentKind===e.environmentKind&&t.agentSessionLabel===e.agentSessionLabel&&t.repoLabel===e.repoLabel&&t.branchLabel===e.branchLabel}function Atw(t,e){if(t===e)return!0;if(t.size!==e.size)return!1;for(const[n,i]of t){const r=e.get(n);if(r===void 0||!Itw(i,r))return!1}return!0}function Rtw(t,e){return Atw(t.workspaceInfoById,e.workspaceInfoById)}function Ptw(t,e){const n=xtw(5),i=cV1(e);let r;n[0]!==e||n[1]!==i||n[2]!==t?(r=()=>({headerFieldsToken:i,workspaceInfoById:otw(t,e)}),n[0]=e,n[1]=i,n[2]=t,n[3]=r):r=n[3];const s=r;let o;return n[4]===Symbol.for("react.memo_cache_sentinel")?(o={isEqual:Rtw},n[4]=o):o=n[4],kb(t.onDidChangeDiagnostics,s,o).workspaceInfoById}var Mtw=
