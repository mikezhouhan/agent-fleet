// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: glass-chat-status-bar-project-branch.js
// byteRange: [32445785, 32446946)
// beautified: false
// truncated: false
O({"glass-chat-status-bar-project-branch.js"(){"use strict";Xv()}});import{c as pFw}from"./react-runtime/react/esm-compiler-runtime-production.js";function mFw({workspaceMetadataService:t,primaryWorkspaceIdentifier:e,rootWorkspaceIdentifier:n}){if(t===void 0)return;const i=t.getMetadata(e);if(i&&i.trackedGitRepos.length>0)return i;const r=t.getMetadata(n);return r&&r.trackedGitRepos.length>0?r:i??r}function gFw(t,e){if(t===void 0||e===void 0)return t===void 0&&e===void 0;if(t.workspaceId!==e.workspaceId||t.trackedGitRepos.length!==e.trackedGitRepos.length)return!1;for(let n=0;n<t.trackedGitRepos.length;n+=1){const i=t.trackedGitRepos[n],r=e.trackedGitRepos[n];if(i.repoPath!==r.repoPath||i.repoUrl!==r.repoUrl)return!1}return!0}function fFw(t){const e=pFw(5),{workspaceMetadataService:n,primaryWorkspaceIdentifier:i,rootWorkspaceIdentifier:r}=t;let s;e[0]!==i||e[1]!==r||e[2]!==n?(s=()=>mFw({workspaceMetadataService:n,primaryWorkspaceIdentifier:i,rootWorkspaceIdentifier:r}),e[0]=i,e[1]=r,e[2]=n,e[3]=s):s=e[3];const o=s;let a;return e[4]===Symbol.for("react.memo_cache_sentinel")?(a={isEqual:gFw},e[4]=a):a=e[4],kb(n?.onDidChangeMetadata,o,a)}var vFw=
