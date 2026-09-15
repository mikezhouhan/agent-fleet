// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-document-task-row.react.js
// byteRange: [27033500, 27034614)
// beautified: false
// truncated: false
O({"project-document-task-row.react.js"(){"use strict";Pt(),oc(),m4(),At(),e6g(),i6g={p:bae.chipsParagraph}}});import{c as cQ1}from"./react-runtime/react/esm-compiler-runtime-production.js";import{jsx as uQ1}from"./react-runtime/react/esm-jsx-runtime-production.js";function JTi(t){switch(t){case"for-review":return R("glass.project.document.status.forReview","For Review");case"in-progress":return R("glass.project.document.status.inProgress","In Progress");case"queued":return R("glass.project.document.status.queued","Queued");case"done":return R("glass.project.document.status.done","Done");case"canceled":return R("glass.project.document.status.canceled","Canceled");default:return t}}function dQ1(t){switch(t){case"in-progress":return"circle-circle";case"for-review":return"circle";case"queued":return"circle-dashed";case"done":return"check-circle";case"canceled":return"x-circle";default:return t}}function Xds(t){const e=cQ1(4),{status:n}=t;let i;e[0]!==n?(i=dQ1(n),e[0]=n,e[1]=i):i=e[1];let r;return e[2]!==i?(r=uQ1(Ot,{"aria-hidden":!0,color:"tertiary",name:i,size:"sm"}),e[2]=i,e[3]=r):r=e[3],r}var Vyl=
