// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptPendingApproval.js
// byteRange: [24187315, 24188276)
// beautified: false
// truncated: false
O({"composerTranscriptPendingApproval.js"(){"use strict";w0i="pending-approval:",_ns=`${w0i}current`}});function hnl(t,e){const n=e?.includeRoutedModelLabel??!0,i=new Map;for(const r of t){const s=r.startedAtMs??Ko1(r.createdAt),o=n?r.grouping?.routedModelLabel:void 0,a=e?.completedAtMsBySourceId?.get(r.bubbleId)??r.completedAtMs;s===void 0&&o===void 0&&a===void 0||i.set(r.bubbleId,{...s===void 0?{}:{startMs:s},...a===void 0?{}:{completedAtMs:a},...o===void 0?{}:{routedModelLabel:o}})}return i}function Vo1(t,e){const n=new Map;for(const i of t){const r=i.grouping;if(r?.toolFormerTool!==vt.TASK_V2)continue;const s=pAa(e,r.toolCallId);if(s?.completedTimestampMs===void 0||s.status!==k2.SUCCESS&&s.status!==k2.ERROR&&s.status!==k2.ABORTED)continue;const o=Number(s.completedTimestampMs);Number.isSafeInteger(o)&&o>0&&n.set(i.bubbleId,o)}return n}function Ko1(t){if(t===void 0)return;const e=new Date(t).getTime();return Number.isFinite(e)?e:void 0}var Sns=
