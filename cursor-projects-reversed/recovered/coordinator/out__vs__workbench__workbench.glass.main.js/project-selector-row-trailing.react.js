// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-selector-row-trailing.react.js
// byteRange: [28746360, 28747254)
// beautified: false
// truncated: false
O({"project-selector-row-trailing.react.js"(){"use strict";Pt(),Aef={rowAction:{kzqmXN:"glass-1pwdyn5",kZKoxP:"glass-1vatr1o",k33iCy:"glass-lshs6z glass-uxs0m7",kSiTet:"glass-g01cxk glass-mlcfyk glass-1szrgyu",kfzvcC:"glass-47corl glass-1cx7q8o",$$css:!0}},Ref="project-selector-row-trailing"}});function Nfs(t){const e=t.lastIndexOf("/");return e>=0?t.slice(e+1):t}function Mef({projects:t,cloudProjects:e,logicalEnvironments:n}){const i=new Set,r=a=>{const l=V2(a);l.length>0&&i.add(l)};for(const a of t){const l=cst(a);l.type==="repo"&&l.repoUrls.forEach(r)}for(const a of e)Dne(a).forEach(r);for(const a of n)xke(a).forEach(r);const s=new Map;for(const a of i){const l=Nfs(a);let c=s.get(l);c===void 0&&(c=new Set,s.set(l,c)),c.add(a)}const o=new Map;for(const[a,l]of s){if(l.size!==1)continue;const[c]=l;c!==void 0&&c!==a&&o.set(c,a)}return o}function hIi(t,e){return t?.get(e)??e}var pIi=
