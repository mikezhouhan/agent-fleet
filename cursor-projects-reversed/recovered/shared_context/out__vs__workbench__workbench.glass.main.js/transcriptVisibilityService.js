// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: transcriptVisibilityService.js
// byteRange: [17564560, 17565324)
// beautified: false
// truncated: false
O({"transcriptVisibilityService.js"(){"use strict";Xe(),Pn(),_t(),Y8r=In("transcriptVisibilityService"),a6p=class{constructor(){this.refCounts=new Map}register(t){this.refCounts.set(t,(this.refCounts.get(t)??0)+1);let e=!1;return Fn(()=>{if(e)return;e=!0;const n=this.refCounts.get(t);n!==void 0&&(n<=1?this.refCounts.delete(t):this.refCounts.set(t,n-1))})}isVisible(t){return this.refCounts.has(t)}},l6p=new a6p,c6p=class{constructor(t=l6p){this.store=t}registerVisibleTranscript(t){return this.store.register(t)}isTranscriptVisible(t){return this.store.isVisible(t)}},vn(Y8r,c6p,1)}});async function d6p(t,e){if(t===void 0||t.length===0)return;const n=await e(t);if(n===void 0)return;const i=new TextDecoder().decode(n).trim();return i.length>0?i:void 0}var h6p=
