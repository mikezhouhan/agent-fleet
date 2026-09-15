// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectDependencyGraph.js
// byteRange: [5145044, 5145599)
// beautified: false
// truncated: false
O({"projectDependencyGraph.js"(){"use strict";Hyr(),hei()}});function Jc_(t,e,n){const i=t.config.view.groupBy;return Yvt(t).flatMap(r=>{const s=t.cards[r];return s!==void 0&&(n===void 0||n.has(r))&&Gyr(s,i)===e?[s]:[]})}function t8o(t,e){return t.config.view.groupOrder.map(n=>({groupValue:n,...nDd(t,n),cards:Jc_(t,n,e)}))}function eu_(t,e){const{groupBy:n,groupSourcePropertyId:i}=t.config.view;return t.config.propertyDefinitions.filter(r=>r.id!==n&&r.id!==i).flatMap(r=>{const s=e.properties[r.id];return iDd(s)?[]:[{definition:r,value:s}]})}var n8o=
