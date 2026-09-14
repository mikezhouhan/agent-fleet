// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: create-local-workspace-project.js
// byteRange: [28701981, 28702516)
// beautified: false
// truncated: false
O({"create-local-workspace-project.js"(){"use strict";Ef(),Zv()}});function Axl(t){let i=t.toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(r=>r.length>0&&!_Jg.has(r)).slice(0,yJg).join("-").replace(/-+/g,"-").replace(/^-|-$/g,"");return i.length>vfs&&(i=i.slice(0,vfs).replace(/-+$/g,"")),i.length===0||!vfa.test(i)||!/^[A-Za-z0-9]/.test(i)?bfs:i}function n20(t,e){if(e<=1)return t;const n=`-${e}`,i=Math.max(1,vfs-n.length),r=t.slice(0,i).replace(/-+$/g,"");return`${r.length>0?r:bfs}${n}`}var _Jg,vfs,yJg,bfs,SJg=
