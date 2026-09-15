// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptStreamIn.js
// byteRange: [24710724, 24711464)
// beautified: false
// truncated: false
O({"composerTranscriptStreamIn.js"(){"use strict";Jug=class{constructor(t){this.shouldTrack=t,this.seen=new Set,this.armed=new Set,this.seeded=!1}sync(t,e){if(!this.seeded){this.seeded=!0;const i=e?.armSeededTrackable===!0;for(const r of t)this.seen.add(r),i&&this.shouldTrack(r)&&this.armed.add(r);return}const n=new Set(t);for(const i of n)this.seen.has(i)||(this.seen.add(i),this.shouldTrack(i)&&this.armed.add(i));for(const i of[...this.seen])n.has(i)||(this.seen.delete(i),this.armed.delete(i))}shouldEnter(t){return this.armed.has(t)}markEntered(t){this.armed.delete(t)}}}});function Lll(t){css!==void 0&&Ut.clearTimeout(css),Fll=t,css=Ut.setTimeout(()=>{Fll=void 0,css=void 0},edg)}function Oll(t){return Fll===t}var edg,Fll,css,uss=
