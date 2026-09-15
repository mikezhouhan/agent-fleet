// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: modelsSettingsSnapshot.js
// byteRange: [26678539, 26679067)
// beautified: false
// truncated: false
O({"modelsSettingsSnapshot.js"(){"use strict"}});function LW1(t,e){const n=t.trim();if(n.length===0)return{valid:!1,error:"Model name cannot be empty."};const i=e?.relaxLengthLimit?yDg:_Dg;if(n.length>i)return{valid:!1,error:`Model name must be at most ${i} characters.`};if(/[\x00-\x1f\x7f]/.test(n))return{valid:!1,error:"Model name cannot contain control characters."};for(const{pattern:r,keyPrefix:s}of kDg)if(r.test(n))return{valid:!1,error:s!==void 0?SDg(s):wDg};return{valid:!0,trimmed:n}}var _Dg,yDg,MCt,SDg,wDg,kDg,OW1=
