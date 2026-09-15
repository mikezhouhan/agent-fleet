// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudSubagentInfo.js
// byteRange: [18945449, 18946689)
// beautified: false
// truncated: false
j({"cloudSubagentInfo.js"(){"use strict";xh(),_g(),zu()}});function izf(e){const t=[],n=new Set;for(const i of e??[]){const r=i.repoUrl?$w(i.repoUrl):"";!r||n.has(r)||(n.add(r),t.push(r))}return t}function N9d(e){return izf(e).length>1}function rzf(e){const t=new Set;for(const n of O9d(e)){const i=n.repoUrl?$w(n.repoUrl):"";if(t.add(`${i}\0${n.repoPath}\0${n.branchName}`),t.size>1)return!0}return!1}function O9d(e){return(e??[]).flatMap(t=>{const n=PC(t.branchName);return n?[{...t,branchName:n}]:[]})}function szf(e){return N9d(e.branchesByRepo)?O9d(e.branchesByRepo)[0]?.branchName:PC(e.branchName)}function ozf(e,t){const n=PC(t);if(!(n===void 0||e.sourceBranchPr===void 0))return PC(e.sourceBranchPr.branchName)===n?n:void 0}function azf(e){if(N9d(e.branchesByRepo))return{branchesByRepo:e.branchesByRepo};const t=PC(e.branchName)??PC(e.branchesByRepo[0]?.branchName),n=e.branchesByRepo.find(o=>PC(o.branchName)===t)??e.branchesByRepo[0],i=cSe(n?.commitSha)??cSe(e.commitSha),r=t!==void 0&&PC(n?.branchName)===t,s=r?PC(n?.defaultBranch):void 0;return{...t?{branchName:t}:{},...i?{commitSha:i}:{},...rzf(e.branchesByRepo)?{branchesByRepo:e.branchesByRepo}:{},...s?{defaultBranch:s}:{},...r&&n?.prMerged===!0?{prMerged:!0}:{}}}var czf=
