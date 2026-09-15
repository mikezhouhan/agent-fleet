// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentTimings.js
// byteRange: [23626339, 23627145)
// beautified: false
// truncated: false
O({"cloudAgentTimings.js"(){"use strict";fh()}});function cKS(t){return t===null?[]:[{key:"request-received",label:"Request received",durationMs:0},t.timeToPrewarmedPodReceivedMs!==void 0?{key:"prewarmed-pod-received",label:"Received prewarmed pod",durationMs:t.timeToPrewarmedPodReceivedMs}:void 0,t.timeToStaleSnapshotUsedMs!==void 0?{key:"stale-snapshot-used",label:"Stale snapshot from warm fork",durationMs:t.timeToStaleSnapshotUsedMs}:void 0,t.timeToPodRequestedMs!==void 0?{key:"pod-requested",label:"Pod requested",durationMs:t.timeToPodRequestedMs}:void 0,t.timeToPodReadyMs!==void 0?{key:"pod-ready",label:"Pod ready",durationMs:t.timeToPodReadyMs}:void 0,t.timeToFirstTokenMs!==void 0?{key:"first-token",label:"First token",durationMs:t.timeToFirstTokenMs}:void 0].filter(n=>n!==void 0)}var uKS=
