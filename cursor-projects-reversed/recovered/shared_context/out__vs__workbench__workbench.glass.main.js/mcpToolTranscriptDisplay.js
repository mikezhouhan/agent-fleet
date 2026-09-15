// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpToolTranscriptDisplay.js
// byteRange: [25334483, 25334964)
// beautified: false
// truncated: false
O({"mcpToolTranscriptDisplay.js"(){"use strict";oki="transcriptDisplay"}});function BT1(t){const e=new Map;return(async()=>{for(const n of t.getAllProviders())try{const r=(await n.listOfferings())?.tools;if(!r?.length)continue;const s=new Map;for(const o of r){const a=FT1(o._meta);a&&s.set(o.name,a)}s.size>0&&e.set(n.id,s)}catch{}})(),{resolveMcpToolDisplay:(n,i)=>e.get(n)?.get(i)??Sem(n,i),isInternalMcpServer:n=>Cem(n)!==void 0||t.getAllProviders().some(i=>i.id===n)}}var UT1=
