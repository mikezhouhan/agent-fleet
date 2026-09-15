// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectTaskFilter.js
// byteRange: [13964371, 13964635)
// beautified: false
// truncated: false
O({"projectTaskFilter.js"(){"use strict";Hyr()}});function ggy(t,e){return t.some(i=>i.assignedTaskIds!==void 0)?t.filter(i=>i.assignedTaskIds?.includes(e)):t}function QEh(t,e,n){const i=t.agentIds.map(r=>n.get(r)).filter(r=>r!==void 0);return ggy(i,e.id)}var fgy=
