// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: recentlyOpenedWorkspaceProjects.js
// byteRange: [19519146, 19519665)
// beautified: false
// truncated: false
j({"recentlyOpenedWorkspaceProjects.js"(){"use strict";NI(),En(),ni(),B9(),HUt(),lC(),Cle(),CWd=12}});function AXf(e,t){const n=OAn(t);if(n.length===0)return[];const i=new Map;for(const r of e.getAllMetadata()){if(!eBf(n,VJs(r)))continue;const s=_Wd(r);if(!s)continue;const o=kXf(s,e),a=wco(o),c={metadata:r,workspaceIdentifier:o},l=i.get(a);l?l.push(c):i.set(a,[c])}return[...i].map(([r,s])=>({canonicalKey:r,candidates:s.sort((o,a)=>Number(Sco(a.metadata.workspaceId))-Number(Sco(o.metadata.workspaceId)))}))}var EWd=
