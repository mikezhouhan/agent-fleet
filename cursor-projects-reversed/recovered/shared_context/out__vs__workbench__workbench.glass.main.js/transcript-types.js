// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: transcript-types.js
// byteRange: [12898188, 12899109)
// beautified: false
// truncated: false
O({"transcript-types.js"(){"use strict"}});import{jsx as pJo}from"./react-runtime/react/esm-jsx-runtime-production.js";import{c as XG_}from"./react-runtime/react/esm-compiler-runtime-production.js";function mJo(t){const e=XG_(10),{entry:n}=t;if(T_t(n))return null;if(n.reason==="converted-placeholder"){let o;return e[0]!==n.isStreaming||e[1]!==n.label||e[2]!==n.labelNamesTool||e[3]!==n.toolName?(o=n.labelNamesTool===!0?pJo(HE,{action:n.label,loading:n.isStreaming}):pJo(HE,{action:"Tool call",details:n.toolName,loading:n.isStreaming}),e[0]=n.isStreaming,e[1]=n.label,e[2]=n.labelNamesTool,e[3]=n.toolName,e[4]=o):o=e[4],o}const i=n.detail??wph[n.reason],r=n.reason==="pending-approval"?"dimmed":"default";let s;return e[5]!==n.isStreaming||e[6]!==n.label||e[7]!==i||e[8]!==r?(s=pJo(HE,{action:n.label,details:i,loading:n.isStreaming,tone:r}),e[5]=n.isStreaming,e[6]=n.label,e[7]=i,e[8]=r,e[9]=s):s=e[9],s}var wph,gJo=
