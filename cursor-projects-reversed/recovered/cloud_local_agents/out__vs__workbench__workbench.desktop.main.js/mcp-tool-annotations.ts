// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcp-tool-annotations.ts
// byteRange: [17833280, 17834567)
// beautified: false
// truncated: false
j({"mcp-tool-annotations.ts"(){"use strict"}});function Q8f(e){return[...new Set(e)]}function TRn(e){return e.trim().toLowerCase()}function J8f(e){return(e??[]).map(TRn).filter(t=>t.length>0)}function e7f(e,t){const n=TRn(e);return n.length===0?!1:t.some(i=>TRn(i)===n)}function RLd({mode:e,tools:t}){const n=J8f(t),i=e===void 0?void 0:TRn(e);return i==="all"?{mode:"all"}:i==="reads"?{mode:"reads"}:i==="custom"?n.length>0?{mode:"custom",tools:n}:{mode:"all"}:n.length>0?{mode:"custom",tools:n}:{mode:"all"}}function t7f(e,t){switch(e.mode){case"all":return!0;case"custom":return e7f(t.name,e.tools);case"reads":return X8f(t.annotations);default:return e}}function n7f(e,t){switch(t.mode){case"all":return[`${e}:*`];case"custom":return t.tools.map(n=>`${e}:${n}`);case"reads":return[];default:return t}}function i7f(e){return(e??[]).flatMap(t=>{const n=t.name===void 0?"":TRn(t.name);if(n.length===0)return[];const i=RLd({mode:t.toolAllowlistMode,tools:t.toolAllowlist});return[{name:n,policy:i,flattened:n7f(n,i)}]})}function r7f({autoRunControls:e,allowedMcpServers:t}){const n=e?.enabled===!0?e.mcpToolAllowlist??[]:[],i=i7f(t);return{tools:Q8f([...i.flatMap(r=>[...r.flattened]),...n]),policies:i.map(r=>({name:r.name,policy:r.policy}))}}function s7f(e){return r7f(e).tools}var DLd=
