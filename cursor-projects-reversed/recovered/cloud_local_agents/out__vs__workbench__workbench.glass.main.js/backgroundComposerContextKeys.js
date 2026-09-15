// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: backgroundComposerContextKeys.js
// byteRange: [24242041, 24242751)
// beautified: false
// truncated: false
O({"backgroundComposerContextKeys.js"(){"use strict";Mi(),Est=new Vt("isInBackgroundComposerWindow",!1),_nl=new Vt("isBackgroundComposerPeekContentActive",!1),IQm=new Vt("isBackgroundComposerPeekContentDiffTab",!1),AQm=new Vt("hasFetchedInitialBackgroundComposers",!1)}});async function RQm(t,e,n){let i;for(let r=0;r<e;r++)try{return await t()}catch(s){if(yyn(s))throw s;i=s,r<e-1&&await new Promise(o=>setTimeout(o,n))}throw i}function PQm(t){return t.localStateBranch||t.baseBranch||t.startingCommit}function Snl(t){let e=t;if(e.match(/^[A-Za-z]:[\\/]?/)){const n=e.indexOf(":\\")!==-1||e.indexOf(":/")!==-1?3:2;e=e.substring(n)}return e=e.replace(/\\/g,"/"),e.startsWith("/")&&(e=e.substring(1)),e}var MQm=
