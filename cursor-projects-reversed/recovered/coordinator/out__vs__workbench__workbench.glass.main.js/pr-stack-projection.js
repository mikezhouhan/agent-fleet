// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: pr-stack-projection.js
// byteRange: [31239315, 31240208)
// beautified: false
// truncated: false
O({"pr-stack-projection.js"(){"use strict";OT()}});function CCf(t){const e=Pem(t);if(e===void 0)return t;const n=new URL(e);return n.searchParams.set("ref","gt-pasteable-stack"),n.toString()}function pow(t){return`[#${t.number} ${t.title}](${CCf(t.prUrl)})`}function TCf(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function mow(t){const e=TCf(CCf(t.prUrl)),n=TCf(`#${t.number} ${t.title}`);return`<a href="${e}">${n}</a>`}function gow(t){return{html:t.map(mow).join("<br />"),markdown:t.map(pow).join(`
`)}}function fow(t,e){let n=!1;const i=s=>{s.clipboardData!==null&&(s.clipboardData.setData("text/html",e.html),s.clipboardData.setData("text/plain",e.markdown),s.preventDefault(),n=!0)},r=t.document;r.addEventListener("copy",i);try{r.execCommand("copy")}catch{return!1}finally{r.removeEventListener("copy",i)}return n}var vow=
