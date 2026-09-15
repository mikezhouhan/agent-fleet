// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: SkillCommandBadge.js
// byteRange: [11651382, 11652346)
// beautified: false
// truncated: false
j({"SkillCommandBadge.js"(){"use strict";Gc(),zyn(),tm(),HDl={root:{k1xSpc:"ui-3nfvp2",kGNEyG:"ui-1pha0wt",kXLuUW:"ui-11njtxf",khDVqt:"ui-uxw1ft",$$css:!0}}}});function VDl(e){return e.nodeType===Node.ELEMENT_NODE}function bNg(e){return VDl(e)&&zDl.has(e.nodeName)}function GDl(e){if(e.nodeType===Node.TEXT_NODE)return e.nodeValue??"";if(!VDl(e))return"";if(e.nodeName==="BR")return`
`;let t="";return e.childNodes.forEach(n=>{t+=GDl(n)}),t}function t_s(e,t){let n=null;const i=()=>{n!==null&&(t.push(...n.split(`
`)),n=null)};e.childNodes.forEach(r=>{if(!bNg(r)){n=(n??"")+GDl(r);return}if(i(),r.nodeName==="P"){if(r.hasAttribute(n_s)){t.push("");return}const s=t.length;t_s(r,t),t.length===s&&t.push("");return}t_s(r,t)}),i()}function _Ng(e,t){if(!t||t.rangeCount!==1)return null;const n=t.getRangeAt(0);if(n.collapsed||!e.contains(n.startContainer)||!e.contains(n.endContainer))return null;const i=[];return t_s(n.cloneContents(),i),i.join(`
`)}var n_s,zDl,yNg=
