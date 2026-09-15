// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentActionDerivation.js
// byteRange: [24732279, 24733142)
// beautified: false
// truncated: false
O({"subagentActionDerivation.js"(){"use strict";Qn(),fh(),bu(),PWt(),g0n(),Qll=new WeakMap}});function eS1(t,e,n){const i=t.filter(s=>!(n.hideInCloudTip===!0&&nS1(s))).map(s=>({text:s.text.trim(),enabled:s.enabled})).filter(s=>s.enabled!==!1&&s.text.length>0);if(i.length===0)return"";const r=Math.min(Math.floor(e()*i.length),i.length-1);return i[r].text}function tS1(t,e=Math.random,n={}){return t!==void 0?eS1(t,e,n):""}function nS1(t){return ydg(t.text).some(e=>e.isSlashCommand&&e.text==="/in-cloud")}function iS1(t){return t===void 0||/\s/.test(t)||`([{'"`.includes(t)}function ydg(t){const e=[];let n=0;for(const i of t.matchAll(wdg)){const r=i[0],s=i.index??0;iS1(t[s-1])&&(s>n&&e.push({text:t.slice(n,s),isSlashCommand:!1}),e.push({text:r,isSlashCommand:!0}),n=s+r.length)}return n<t.length&&e.push({text:t.slice(n),isSlashCommand:!1}),e}var Sdg,wdg,kdg=
