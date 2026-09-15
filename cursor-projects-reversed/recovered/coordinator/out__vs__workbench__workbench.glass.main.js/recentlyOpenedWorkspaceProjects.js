// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: recentlyOpenedWorkspaceProjects.js
// byteRange: [20790370, 20790888)
// beautified: false
// truncated: false
O({"recentlyOpenedWorkspaceProjects.js"(){"use strict";YP(),ri(),yr(),v0(),awe(),yp(),Zv(),mpm=12}});function gpm(t,e){const n=yHe(e);if(n.length===0)return[];const i=new Map;for(const r of t.getAllMetadata()){if(!u3a(n,c3a(r)))continue;const s=Hvi(r);if(!s)continue;const o=B8a(s,t),a=Zte(o),l={metadata:r,workspaceIdentifier:o},c=i.get(a);c?c.push(l):i.set(a,[l])}return[...i].map(([r,s])=>({canonicalKey:r,candidates:s.sort((o,a)=>Number(F8a(a.metadata.workspaceId))-Number(F8a(o.metadata.workspaceId)))}))}var fpm=
