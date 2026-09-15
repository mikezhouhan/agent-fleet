// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agent-store-traversal.js
// byteRange: [26988449, 26989375)
// beautified: false
// truncated: false
O({"agent-store-traversal.js"(){"use strict";Yc(),fo(),HC(),Ods={kind:"unexplored"},Ryl=32,Fds=2e3,mFg=500,gFg=Fds}});function LIn(t){if(t){if(t.startsWith("image/"))return"image";if(t.startsWith("video/"))return"video"}}function VTi(t){return t==="application/pdf"}function Bds({resource:t,version:e}){const n=yA(t).toLowerCase(),i=t.scheme===It.file&&(YTi.has(n)||n===".mp4"),r=t.scheme===It.vscodeRemote&&YTi.has(n);if(!i&&!r)return;const s=rp.uriToBrowserUri(t);if(r&&s.scheme!==It.vscodeRemoteResource&&s.scheme!==It.https)return;const o=new URLSearchParams(s.query);return o.set("glassMediaVersion",String(e)),s.with({query:o.toString()}).toString(!0)}function fFg(t){return t.imageDataUrl!==void 0||t.videoDataUrl!==void 0||t.pdfBytesGeneration!==void 0||t.contentType==="pdf"}function lX1(t,e){if(!t)return!1;let n;try{n=Ve.parse(t).path}catch{return!1}const i=yNe(n);return LIn(i)!==void 0||e&&VTi(i)}var KTi,YTi,XCt=
