// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: transcriptVisibilityService.js
// byteRange: [16445219, 16445983)
// beautified: false
// truncated: false
j({"transcriptVisibilityService.js"(){"use strict";ve(),An(),qe(),P6i=un("transcriptVisibilityService"),Abd=class{constructor(){this.refCounts=new Map}register(e){this.refCounts.set(e,(this.refCounts.get(e)??0)+1);let t=!1;return nn(()=>{if(t)return;t=!0;const n=this.refCounts.get(e);n!==void 0&&(n<=1?this.refCounts.delete(e):this.refCounts.set(e,n-1))})}isVisible(e){return this.refCounts.has(e)}},Rbd=new Abd,Dbd=class{constructor(e=Rbd){this.store=e}registerVisibleTranscript(e){return this.store.register(e)}isTranscriptVisible(e){return this.store.isVisible(e)}},dn(P6i,Dbd,1)}});async function Pbd(e,t){if(e===void 0||e.length===0)return;const n=await t(e);if(n===void 0)return;const i=new TextDecoder().decode(n).trim();return i.length>0?i:void 0}var Lbd=
