// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerReactTranscriptFind.js
// byteRange: [24228419, 24229495)
// beautified: false
// truncated: false
O({"composerReactTranscriptFind.js"(){"use strict";zn(),Xe(),Vwn(),z$t(),rQm(),SQm=60,wQm=1e3,kQm=8,Tns="[data-find-row-key]",CQm="[data-message-id]",fnl=".virtualized-composer-messages-scroll-container"}});function Ea1(t){return`activity:${t.bubbleId}:tool:${t.toolCallId}`}function xa1(t){const e=[];for(const n of t.requests){const i=n.toolCallId;if(i===void 0||i.length===0)continue;const r=t.resolveBubbleId(i);r===void 0||r.length===0||e.push({requestId:n.id,toolCallId:i,bubbleId:r,rowKey:Ea1({bubbleId:r,toolCallId:i})})}return e}function Ia1(t){if(t.rows.some(e=>e.key===t.preferredRowKey))return{rowKey:t.preferredRowKey,expandRowIds:[]};for(const e of t.rows){const n=e.reactRow;if(n?.kind==="activityGroup"&&n.sourceIds.includes(t.bubbleId))return{rowKey:e.key,expandRowIds:[n.rowId]}}}function Aa1(t){for(const e of t.targets){if(t.revealedRequestIds.has(e.requestId))continue;const n=Ia1({preferredRowKey:e.rowKey,bubbleId:e.bubbleId,rows:t.rows});n!==void 0&&t.ensureExpanded(n.expandRowIds)&&(t.revealedRequestIds.add(e.requestId),t.reveal(n.rowKey))}}var Ra1=
