// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-new-project-cloud-projects.react.js
// byteRange: [28987383, 28988350)
// beautified: false
// truncated: false
O({"use-new-project-cloud-projects.react.js"(){"use strict";z2e(),Kc(),cIi(),iqe(),dIn(),tat(),NRn()}});import{c as DN0}from"./react-runtime/react/esm-compiler-runtime-production.js";import{useEffect as NN0,useRef as LN0}from"./react-runtime/react/esm-index-production.js";function ON0(t){const e=DN0(10),{cloudProjects:n,enabled:i,logicalEnvironments:r,logicalEnvironmentsSettled:s,newRepositoryFallback:o,onResolveDefaultTarget:a,recentProjects:l}=t,c=o===void 0?!1:o,u=Ze(rEt),d=au(u.recentCloudSelections),h=LN0(!1);let p,g;e[0]!==n||e[1]!==i||e[2]!==r||e[3]!==s||e[4]!==c||e[5]!==a||e[6]!==l||e[7]!==d?(p=()=>{if(h.current||!i)return;const v=K30({logicalEnvironmentsSettled:s,newRepositoryFallback:c,ranked:q30({cloudProjects:n,logicalEnvironments:r,recentProjects:l,recentSelections:d})});v.status==="apply"&&(h.current=!0,a(v.target))},g=[n,i,r,s,c,a,l,d],e[0]=n,e[1]=i,e[2]=r,e[3]=s,e[4]=c,e[5]=a,e[6]=l,e[7]=d,e[8]=p,e[9]=g):(p=e[8],g=e[9]),NN0(p,g)}var FN0=
