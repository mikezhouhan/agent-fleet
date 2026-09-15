// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-agent-store-scope.js
// byteRange: [27021287, 27022597)
// beautified: false
// truncated: false
O({"project-agent-store-scope.js"(){"use strict";Wyl={status:"resolving"},YFg=["agent","user","team"]}});import{c as ZX1}from"./react-runtime/react/esm-compiler-runtime-production.js";import{useEffect as JX1,useState as XFg}from"./react-runtime/react/esm-index-production.js";function eQ1(t){const e=ZX1(13),{fileService:n,listingState:i,storeRootUri:r}=t;let s;e[0]!==i?(s=nX1(i),e[0]=i,e[1]=s):s=e[1];const o=s,a=i.kind==="ready"&&o==="unknown"?r:void 0;let l;e[2]!==n||e[3]!==a?(l={fileService:n,root:a,session:0,attempt:0},e[2]=n,e[3]=a,e[4]=l):l=e[4];const[c,u]=XFg(l),[d,h]=XFg();(c.fileService!==n||c.root?.toString()!==a?.toString())&&u(S=>({fileService:n,root:a,session:S.session+1,attempt:S.attempt+1}));let p;e[5]!==d?.attempt?(p=()=>u(S=>d?.attempt===S.attempt?{...S,attempt:S.attempt+1}:S),e[5]=d?.attempt,e[6]=p):p=e[6],F6e(p,a===void 0?null:QFg);const{attempt:g,root:v,session:b}=c;let _,y;return e[7]!==g||e[8]!==n||e[9]!==v||e[10]!==b?(_=()=>{if(v===void 0)return;const S=new ul;return yg(iX1(n,v,S.token),QTi).catch(tQ1).then(k=>{h(C=>C!==void 0&&C.attempt>g?C:{session:b,attempt:g,presence:k??"unknown"})}),()=>S.dispose(!0)},y=[g,n,v,b],e[7]=g,e[8]=n,e[9]=v,e[10]=b,e[11]=_,e[12]=y):(_=e[11],y=e[12]),JX1(_,y),o!=="unknown"?o:d?.session===b?d.presence:"unknown"}function tQ1(){}var QFg,nQ1=
