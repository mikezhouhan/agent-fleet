// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: projectDependencyGraph.js
// byteRange: [3825238, 3825793)
// beautified: false
// truncated: false
j({"projectDependencyGraph.js"(){"use strict";JGc(),Bns()}});function WUm(e,t,n){const i=e.config.view.groupBy;return n_i(e).flatMap(r=>{const s=e.cards[r];return s!==void 0&&(n===void 0||n.has(r))&&DUm(s,i)===t?[s]:[]})}function Uns(e,t){return e.config.view.groupOrder.map(n=>({groupValue:n,...LUm(e,n),cards:WUm(e,n,t)}))}function HUm(e,t){const{groupBy:n,groupSourcePropertyId:i}=e.config.view;return e.config.propertyDefinitions.filter(r=>r.id!==n&&r.id!==i).flatMap(r=>{const s=t.properties[r.id];return NUm(s)?[]:[{definition:r,value:s}]})}var $ns=
