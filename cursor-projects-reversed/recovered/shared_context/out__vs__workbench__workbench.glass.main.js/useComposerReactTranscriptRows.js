// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: useComposerReactTranscriptRows.js
// byteRange: [25383420, 25384512)
// beautified: false
// truncated: false
O({"useComposerReactTranscriptRows.js"(){"use strict";Pt(),Qn(),to(),Xu(),mHt(),a6e(),s7(),AHt(),yns(),Sns(),Gtl(),_y1(),yy1(),uss(),VCn(),bE1()}});function Dul(t){const e=t.get(Yss);e!==void 0&&(clearTimeout(e),t.set(Yss,void 0))}function SE1(t){const[e,n]=Lt(),i=Jd();i.set(Kss,Ut.document.visibilityState==="visible");const r=sa(i,Kss);return fn(()=>{const s=()=>{i.set(Kss,Ut.document.visibilityState==="visible")};Ut.document.addEventListener("visibilitychange",s),Tn(()=>Ut.document.removeEventListener("visibilitychange",s))}),fn(s=>{const o=t.bcId();return o!==s&&n(void 0),o},as(()=>t.bcId())),fn(()=>{const s=t.bcId(),o=t.shouldFetch(),a=t.shouldPoll(),l=r();if(s===void 0||!o){n(void 0);return}if(!l)return;let c=!1,u=0;const d=async()=>{try{const p=await(await t.aiService.backgroundComposerClient()).getBackgroundComposerTimings({bcId:s},{timeoutMs:Agg});c||(u=0,n(p.events))}catch{u++}if(!c&&a&&u<Igg){const h=u===0?Nul:Math.min(xgg,Nul*2**Math.min(u,4));Dul(i),i.set(Yss,setTimeout(()=>void d(),h))}else c||Dul(i)};d(),Tn(()=>{c=!0,Dul(i)})}),e}var Nul,xgg,Igg,Agg,Kss,Yss,wE1=
