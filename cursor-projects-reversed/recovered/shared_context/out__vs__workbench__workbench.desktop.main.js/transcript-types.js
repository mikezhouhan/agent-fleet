// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: transcript-types.js
// byteRange: [11540662, 11541583)
// beautified: false
// truncated: false
j({"transcript-types.js"(){"use strict"}});import{jsx as sbs}from"./react-runtime/react/esm-jsx-runtime-production.js";import{c as tPg}from"./react-runtime/react/esm-compiler-runtime-production.js";function AAl(e){const t=tPg(10),{entry:n}=e;if($pt(n))return null;if(n.reason==="converted-placeholder"){let o;return t[0]!==n.isStreaming||t[1]!==n.label||t[2]!==n.labelNamesTool||t[3]!==n.toolName?(o=n.labelNamesTool===!0?sbs(pT,{action:n.label,loading:n.isStreaming}):sbs(pT,{action:"Tool call",details:n.toolName,loading:n.isStreaming}),t[0]=n.isStreaming,t[1]=n.label,t[2]=n.labelNamesTool,t[3]=n.toolName,t[4]=o):o=t[4],o}const i=n.detail??RAl[n.reason],r=n.reason==="pending-approval"?"dimmed":"default";let s;return t[5]!==n.isStreaming||t[6]!==n.label||t[7]!==i||t[8]!==r?(s=sbs(pT,{action:n.label,details:i,loading:n.isStreaming,tone:r}),t[5]=n.isStreaming,t[6]=n.label,t[7]=i,t[8]=r,t[9]=s):s=t[9],s}var RAl,DAl=
