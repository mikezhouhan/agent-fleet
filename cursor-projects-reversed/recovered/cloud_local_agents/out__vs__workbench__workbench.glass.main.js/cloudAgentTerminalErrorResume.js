// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentTerminalErrorResume.js
// byteRange: [23422518, 23423697)
// beautified: false
// truncated: false
O({"cloudAgentTerminalErrorResume.js"(){"use strict";Lm()}});function QBm(t,e){return e==="failed"?n7m[t]:e==="running"?e7m[t]:t7m[t]}function R$S(){return{phases:[{phase:"creatingWorktree",startedAt:Date.now()}],currentPhase:"creatingWorktree"}}function P$S(t,e){const n=Date.now();return{phases:[...t.phases.map(r=>r.phase===t.currentPhase&&!r.completedAt?{...r,completedAt:n}:r),{phase:e,startedAt:n}],currentPhase:e}}function FXa(t,e){const n=t.phases.find(i=>i.phase===e);return n?n.completedAt!==void 0?"completed":"running":"pending"}function ZBm(t,e=Date.now()){if(t.completedAt===void 0)return GSi({startTimeMs:t.startedAt,nowMs:e});const n=t.completedAt-t.startedAt;if(n<1e3)return;const i=Math.round(n/1e3);if(i<60)return`${i}s`;const r=Math.floor(i/60),s=i%60;return s>0?`${r}m ${s}s`:`${r}m`}function BXa(t,e,n){const i=Date.now(),r=t.phases.map(o=>{const a=o.phase===t.currentPhase,l=e==="failed"&&a&&!o.completedAt;return{...o,completedAt:o.completedAt??i,...l?{failed:!0}:{}}});return{type:"worktree-creation",startedAt:r[0]?.startedAt??i,completedAt:i,outcome:e,phases:r,failureMessage:n?.failureMessage,scriptOutput:n?.scriptOutput}}var JBm,e7m,t7m,n7m,i7m,UXa=
