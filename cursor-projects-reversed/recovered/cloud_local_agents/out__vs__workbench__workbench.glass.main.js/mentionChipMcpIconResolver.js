// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mentionChipMcpIconResolver.js
// byteRange: [23740429, 23741535)
// beautified: false
// truncated: false
O({"mentionChipMcpIconResolver.js"(){"use strict";Pt(),XJa=({attrs:t,iconSrcByMentionId:e,mcpWellKnownDetectionService:n})=>{const i=AIe(t),{icon:r}=i;if(r.kind!=="image"||GJo(t)!=="mcp")return i;const s=Cgn(t.payload),o=s?.case==="mcpSelection"?s.serverId:void 0;if(o!==void 0&&e?.has(o)){const c=e.get(o);return c===void 0||c===""?i:{...i,icon:{...r,src:c}}}const a=t.label??t.rawText;if(!a)return i;const l=n.getServerIcon(a);return l?{...i,icon:{...r,src:l}}:i},vts=(t,e)=>XJa({attrs:t,mcpWellKnownDetectionService:e})}});function Szm(t){const e=WQS(t.cacheKey),[n,i]=Lt(e.hasValue?e.value:t.defaultValue),[r,s]=Lt(!e.isInitialized),o=async()=>{try{const a=await t.fetchValue();e.value=a,e.hasValue=!0,i(()=>a)}catch(a){console.error("useCachedAsyncValue fetch error:",a),e.value=t.defaultValue,e.hasValue=!0,i(()=>t.defaultValue)}finally{e.isInitialized=!0,s(!1)}};return vc(()=>{if(o(),t.onInvalidate){const a=t.onInvalidate();a&&Tn(()=>{a.dispose()})}}),{value:n,isLoading:r,refetch:o}}function WQS(t){return _ts.has(t)||_ts.set(t,{value:void 0,hasValue:!1,isInitialized:!1}),_ts.get(t)}var _ts,wzm=
