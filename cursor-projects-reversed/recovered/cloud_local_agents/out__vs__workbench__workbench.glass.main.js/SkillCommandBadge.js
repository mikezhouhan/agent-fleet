// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: SkillCommandBadge.js
// byteRange: [13009304, 13010268)
// beautified: false
// truncated: false
O({"SkillCommandBadge.js"(){"use strict";Ja(),Yri(),xd(),Ngh={root:{k1xSpc:"ui-3nfvp2",kGNEyG:"ui-1pha0wt",kXLuUW:"ui-11njtxf",khDVqt:"ui-uxw1ft",$$css:!0}}}});function Ogh(t){return t.nodeType===Node.ELEMENT_NODE}function YK_(t){return Ogh(t)&&Bgh.has(t.nodeName)}function Fgh(t){if(t.nodeType===Node.TEXT_NODE)return t.nodeValue??"";if(!Ogh(t))return"";if(t.nodeName==="BR")return`
`;let e="";return t.childNodes.forEach(n=>{e+=Fgh(n)}),e}function yea(t,e){let n=null;const i=()=>{n!==null&&(e.push(...n.split(`
`)),n=null)};t.childNodes.forEach(r=>{if(!YK_(r)){n=(n??"")+Fgh(r);return}if(i(),r.nodeName==="P"){if(r.hasAttribute(Sea)){e.push("");return}const s=e.length;yea(r,e),e.length===s&&e.push("");return}yea(r,e)}),i()}function XK_(t,e){if(!e||e.rangeCount!==1)return null;const n=e.getRangeAt(0);if(n.collapsed||!t.contains(n.startContainer)||!t.contains(n.endContainer))return null;const i=[];return yea(n.cloneContents(),i),i.join(`
`)}var Sea,Bgh,QK_=
