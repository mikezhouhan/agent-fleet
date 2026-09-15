// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentStreamErrorRowVisibility.js
// byteRange: [24172185, 24173120)
// beautified: false
// truncated: false
O({"cloudAgentStreamErrorRowVisibility.js"(){"use strict"}});function Eo1(t){const e=o=>t.kickoffMessageId!==void 0&&(o.bubbleId===t.kickoffMessageId||o.serverBubbleId===t.kickoffMessageId),n=t.rows.some(o=>{const a=t.getHumanRowIdentity(o);return a!==void 0&&e(a)}),i=[];let r=!1,s=!1;for(const o of t.rows){i.push(o);const a=t.getHumanRowIdentity(o);a!==void 0&&(!r&&t.isCloudEnvironmentStatusVisible&&!t.pinCloudStatusToStart&&t.resolvedBcId!==void 0&&(!n||e(a))&&(i.push(t.createCloudStatusRow({pairIndex:a.pairIndex,turnNumber:a.pairIndex+1,resolvedBcId:t.resolvedBcId})),r=!0),!s&&t.isLocalWorktreeSetupStatusVisible&&a.pairIndex===0&&(i.push(t.createWorktreeStatusRow(a.pairIndex)),s=!0))}if(!r&&t.isCloudEnvironmentStatusVisible&&t.resolvedBcId!==void 0){let o=0;for(;o<i.length&&t.isTranscriptOpeningRow(i[o]);)o+=1;i.splice(o,0,t.createCloudStatusRow({pairIndex:0,turnNumber:1,resolvedBcId:t.resolvedBcId}))}return i}var xo1=
