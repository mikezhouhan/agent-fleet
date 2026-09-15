// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentEnvironmentStatusUtils.js
// byteRange: [23625256, 23626339)
// beautified: false
// truncated: false
O({"cloudAgentEnvironmentStatusUtils.js"(){"use strict";w_n(),Xu(),s9r()}});function SZa(t){return Math.max(0,t)}function oKS(t,e){if(t===void 0||t.length===0)return null;const n=t.filter(u=>u.turnNumber===e).sort((u,d)=>u.timestampMs-d.timestampMs),i=n.find(u=>u.event===VSt.REQUEST_RECEIVED);if(i===void 0)return null;const r=u=>{const d=n.find(h=>h.event===u);if(d!==void 0)return SZa(d.timestampMs-i.timestampMs)},s=r(VSt.PREWARMED_POD_RECEIVED),o=r(VSt.STALE_SNAPSHOT_USED),a=r(VSt.POD_REQUESTED),l=r(VSt.POD_READY),c=r(VSt.FIRST_TOKEN);return s===void 0&&o===void 0&&a===void 0&&l===void 0&&c===void 0?null:{timeToPrewarmedPodReceivedMs:s,timeToStaleSnapshotUsedMs:o,timeToPodRequestedMs:a,timeToPodReadyMs:l,timeToFirstTokenMs:c,totalDurationMs:Math.max(s??0,o??0,a??0,l??0,c??0)}}function aKS(t){return`${(SZa(t)/1e3).toFixed(2)}s`}function lKS(t){const e=Math.round(SZa(t)/10);if(e===0)return"00:00.00";const n=6e3,i=Math.floor(e/n),r=e-i*n,s=Math.floor(r/100),o=r-s*100;return`${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(o).padStart(2,"0")}`}var fWm=
