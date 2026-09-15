// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptPerfCounters.js
// byteRange: [23414192, 23415367)
// beautified: false
// truncated: false
O({"composerTranscriptPerfCounters.js"(){"use strict";XSi={planeStructureBuilds:0,rowAdapterProjections:0,turnRequestIdScans:0,displayGeneratingBubbleIdScans:0}}});function c$S(t){return{canRevert:e=>t.reloadDescriptors.has(e),onReverted:e=>{t.releaseBody(e),t.counters.evictedBodies++}}}function u$S(t){const e=new Set(t.alwaysRetainedBubbleIds);t.viewportRange!==void 0&&jBm({...t,retainedBubbleIds:e,firstIndex:t.viewportRange.firstIndex-MXa,lastIndex:t.viewportRange.lastIndex+MXa});for(const n of t.mountedRowIndexes)$Bm({...t,retainedBubbleIds:e,rowIndex:n});return t.retainTail&&jBm({...t,retainedBubbleIds:e,firstIndex:t.rows.length-WBm,lastIndex:t.rows.length-1}),e}function d$S(t){return(t.evictableHumanBubbleIds===void 0||t.evictableHumanBubbleIds.length===0?t.loadedNonHumanBubbleIds:[...t.loadedNonHumanBubbleIds,...t.evictableHumanBubbleIds]).filter(n=>!t.retainedBubbleIds.has(n))}function jBm(t){const e=Math.max(0,t.firstIndex),n=Math.min(t.rows.length-1,t.lastIndex);for(let i=e;i<=n;i++)$Bm({...t,rowIndex:i})}function $Bm(t){const e=t.rows[t.rowIndex];if(e!==void 0)for(const n of t.getRequiredBubbleIds(e))t.retainedBubbleIds.add(n)}var MXa,WBm,DXa,NXa=
