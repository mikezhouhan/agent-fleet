// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptApprovalRuntime.js
// byteRange: [25319555, 25320163)
// beautified: false
// truncated: false
O({"composerTranscriptApprovalRuntime.js"(){"use strict";bu(),bWe(),jss()}});function Xmg({linkServices:t,openFile:e,openArtifactVideo:n}){return{open(i,r){const s=i.trim();if(n!==void 0&&m0i(s)&&p0i(s)){n(s);return}const o=r.button===1||(dr?r.metaKey:r.ctrlKey);if(!r.altKey&&Int(i)!==void 0){vjr(t,i,{metaKey:r.metaKey||dr&&r.button===1,ctrlKey:r.ctrlKey||!dr&&r.button===1});return}let a=!1;try{const c=Ve.parse(i);a=o&&(c.scheme===It.http||c.scheme===It.https)}catch{return}const l=r.altKey||o&&!a;BYm({activation:{openExternal:a,openToSide:l},href:i,openFile:e,openerService:t.openerService})}}}var Qmg=
