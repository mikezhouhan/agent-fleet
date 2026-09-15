// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptRowHeights.js
// byteRange: [24126740, 24127165)
// beautified: false
// truncated: false
O({"composerTranscriptRowHeights.js"(){"use strict";sXm=6,oXm=4,cns=14,aXm=4,lXm=28}});function fs1(t,e){const n=tEn.get(t);if(n!==void 0&&n!==e)throw new RangeError("a Composer scroll element cannot register more than one navigation writer");return tEn.set(t,e),()=>{tEn.get(t)===e&&tEn.delete(t)}}function vs1(t,e){const n=tEn.get(t);if(n===void 0)return!1;for(const i of cXm.get(t)??[])i(e);return n(e),!0}var tEn,cXm,uXm=
