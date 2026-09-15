// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloud-subagent-quick-actions.js
// byteRange: [32317015, 32318287)
// beautified: false
// truncated: false
O({"cloud-subagent-quick-actions.js"(){"use strict";x_(),Ob()}});import{c as gLw}from"./react-runtime/react/esm-compiler-runtime-production.js";import{useSyncExternalStore as fLw}from"./react-runtime/react/esm-index-production.js";function vLw(t,e,n){const i=gLw(17),r=aIf(),{panelWorkspace:s}=h2i(),o=QGt(),a=QZ(),l=bm(s,Ad),c=bm(s,gl),u=t?.header,d=n!==void 0?a.getAgentHeader(n):void 0;p_(d?.isProject);const h=p_(u?.name),p=u?.id,g=u!==void 0&&l!==void 0&&pLw({isActiveSurface:e,isPanelHosted:r,glassProjectsEnabled:o,agentHeader:u,projectRootHeader:d}),v=l?.manager;let b;i[0]!==g||i[1]!==v?(b=A=>v!==void 0&&g?v.subscribeAll(A):R4f(),i[0]=g,i[1]=v,i[2]=b):b=i[2];const _=b;let y;i[3]!==p||i[4]!==g||i[5]!==v||i[6]!==n?(y=()=>v!==void 0&&g&&p!==void 0&&n!==void 0?mLw(v.getAllTabs(),p,n):!1,i[3]=p,i[4]=g,i[5]=v,i[6]=n,i[7]=y):y=i[7];const S=y,k=fLw(_,S,S);let C;i[8]!==h||i[9]!==p||i[10]!==c||i[11]!==n||i[12]!==l?(C=()=>{if(l===void 0||p===void 0||n===void 0)return;l.openAgentVncTab({bcId:p,label:h?.trim()||void 0,ownerAgentId:n})||c?.error("Failed to open cloud agent desktop")},i[8]=h,i[9]=p,i[10]=c,i[11]=n,i[12]=l,i[13]=C):C=i[13];const T=C,E=g&&!k;let I;return i[14]!==T||i[15]!==E?(I={visible:E,openDesktop:T},i[14]=T,i[15]=E,i[16]=I):I=i[16],I}var R4f,bLw=
