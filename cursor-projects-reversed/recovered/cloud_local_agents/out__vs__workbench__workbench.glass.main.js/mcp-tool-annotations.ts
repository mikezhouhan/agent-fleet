// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcp-tool-annotations.ts
// byteRange: [19079630, 19080917)
// beautified: false
// truncated: false
O({"mcp-tool-annotations.ts"(){"use strict"}});function ifS(t){return[...new Set(t)]}function dfi(t){return t.trim().toLowerCase()}function rfS(t){return(t??[]).map(dfi).filter(e=>e.length>0)}function sfS(t,e){const n=dfi(t);return n.length===0?!1:e.some(i=>dfi(i)===n)}function vJp({mode:t,tools:e}){const n=rfS(e),i=t===void 0?void 0:dfi(t);return i==="all"?{mode:"all"}:i==="reads"?{mode:"reads"}:i==="custom"?n.length>0?{mode:"custom",tools:n}:{mode:"all"}:n.length>0?{mode:"custom",tools:n}:{mode:"all"}}function ofS(t,e){switch(t.mode){case"all":return!0;case"custom":return sfS(e.name,t.tools);case"reads":return tfS(e.annotations);default:return t}}function afS(t,e){switch(e.mode){case"all":return[`${t}:*`];case"custom":return e.tools.map(n=>`${t}:${n}`);case"reads":return[];default:return e}}function lfS(t){return(t??[]).flatMap(e=>{const n=e.name===void 0?"":dfi(e.name);if(n.length===0)return[];const i=vJp({mode:e.toolAllowlistMode,tools:e.toolAllowlist});return[{name:n,policy:i,flattened:afS(n,i)}]})}function cfS({autoRunControls:t,allowedMcpServers:e}){const n=t?.enabled===!0?t.mcpToolAllowlist??[]:[],i=lfS(e);return{tools:ifS([...i.flatMap(r=>[...r.flattened]),...n]),policies:i.map(r=>({name:r.name,policy:r.policy}))}}function ufS(t){return cfS(t).tools}var bJp=
