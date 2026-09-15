// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: multi-root-workspace-projects.js
// byteRange: [28841562, 28842466)
// beautified: false
// truncated: false
O({"multi-root-workspace-projects.js"(){"use strict";Pu(),Zv(),Fp()}});import{c as eD0}from"./react-runtime/react/esm-compiler-runtime-production.js";import{jsx as vtf}from"./react-runtime/react/esm-jsx-runtime-production.js";function btf(t){const e=eD0(12),{id:n,onWorkspaceNameChange:i,placeholder:r,value:s,variant:o}=t,a=o===void 0?"unfilled":o,l=a==="default"?Ufs.fieldRoot:Ufs.root;let c;e[0]!==i?(c=p=>{i(p.target.value)},e[0]=i,e[1]=c):c=e[1];const u=a==="unfilled"?Ufs.input:void 0;let d;e[2]!==n||e[3]!==r||e[4]!==c||e[5]!==u||e[6]!==s?(d=vtf(cd.Input,{"aria-label":"Workspace name",id:n,onChange:c,onKeyDown:tD0,placeholder:r,rootStyle:u,value:s}),e[2]=n,e[3]=r,e[4]=c,e[5]=u,e[6]=s,e[7]=d):d=e[7];let h;return e[8]!==l||e[9]!==d||e[10]!==a?(h=vtf(cd.Root,{rootStyle:l,size:"base",variant:a,children:d}),e[8]=l,e[9]=d,e[10]=a,e[11]=h):h=e[11],h}function tD0(t){t.stopPropagation()}var Ufs,_tf=
