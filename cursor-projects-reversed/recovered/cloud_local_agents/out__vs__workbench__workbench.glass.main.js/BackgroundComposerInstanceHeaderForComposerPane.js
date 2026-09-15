// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: BackgroundComposerInstanceHeaderForComposerPane.js
// byteRange: [25556714, 25557600)
// beautified: false
// truncated: false
O({"BackgroundComposerInstanceHeaderForComposerPane.js"(){"use strict";Qe(),Qn(),fh(),Oc(),aa(),Zo(),Gv(),tS(),aT(),us(),Ix1(),Jx1()}});function nI1(t,e){const n=new Set(t),i=[];for(const r of e)n.has(r)&&i.push(r);return i}function vdl({allValues:t,selectedValues:e}){const n=nI1(e,t),i=n.length===0||n.length===t.length,r=i?t:n;return{isAllSelected:i,selectedValues:r,selectedValueSet:new Set(r)}}function Wvg(t,e){return t.isAllSelected||t.selectedValueSet.has(e)}function Hvg({allValues:t,selectedValues:e,value:n}){const i=vdl({allValues:t,selectedValues:e}),r=i.selectedValues.filter(s=>s!==n);return r.length===i.selectedValues.length&&r.push(n),r.length===0||r.length===t.length?[...t]:t.filter(s=>r.includes(s))}function bdl({allValues:t,currentValues:e,nextValues:n}){const i=new Set(t),r=new Set;for(const s of e)i.has(s)||r.add(s);for(const s of n)r.add(s);return r}var _dl=
