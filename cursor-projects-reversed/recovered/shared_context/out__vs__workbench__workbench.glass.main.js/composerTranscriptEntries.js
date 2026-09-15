// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptEntries.js
// byteRange: [25350447, 25351351)
// beautified: false
// truncated: false
O({"composerTranscriptEntries.js"(){"use strict";Xu(),od(),af(),bu(),uva(),Xv(),cg(),zT1(),s7(),v_n(),Wfe(),y6a(),lve(),pkt(),mcl(),jss(),KT1(),JT1(),AHt(),Aul=new WeakMap,bgg="Summarizing chat context",_gg="Chat context summarized",ygg="Summarization stopped"}});function lE1(t){t!==void 0&&(wgg(t.fullConversationHeadersOnly),Rul(t.generatingBubbleIds),t?.status)}function Vss(t,e){return y2(n=>{let i=!1;return fn(()=>{if(t(),i){as(e);return}i=!0}),Fn(n)})}function cE1(t,e=Cgg){let n=!1,i=Number.NEGATIVE_INFINITY,r;const s=()=>{r=void 0,!n&&(i=e.now(),t())};return{notify:()=>{if(n)return;const o=e.now(),a=o-i;if(a>=Pul&&r===void 0){i=o,t();return}r===void 0&&(r=e.schedule(s,Math.max(Pul-a,0)))},dispose:()=>{n=!0,r?.dispose(),r=void 0}}}function uE1(t){return{...t,grouping:t.grouping?{...t.grouping}:void 0}}function wgg(t){return t.map(uE1)}function Rul(t){return[...t??[]]}var Pul,kgg,Cgg,dE1=
