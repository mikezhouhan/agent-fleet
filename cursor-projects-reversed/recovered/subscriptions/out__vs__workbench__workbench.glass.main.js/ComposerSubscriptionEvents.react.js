// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: ComposerSubscriptionEvents.react.js
// byteRange: [24699280, 24700245)
// beautified: false
// truncated: false
O({"ComposerSubscriptionEvents.react.js"(){"use strict";Pt()}});function ay1(t){const[e,n]=Lt(!1),[i,r]=Lt(!1);let s;const o=()=>s!==void 0&&s.scrollWidth>s.clientWidth,a=()=>{r(e()||o())};return vc(()=>{if(a(),s===void 0)return;const l=new ResizeObserver(a);l.observe(s),Tn(()=>l.disconnect())}),me(Kns,{get children(){var l=Hug(),c=l.firstChild,u=c.nextSibling;l.addEventListener("click",()=>{e()?n(!1):o()&&n(!0),a()}),l.addEventListener("pointerenter",a),Ie(c,me(Gug,{size:12,title:"",variant:"monochrome","aria-hidden":!0}));var d=s;return typeof d=="function"?iu(d,u):s=u,Ie(u,me(Ct,{get when(){return t.slackThread.senderName},children:h=>(()=>{var p=zug();return Ie(p,()=>`${h()}: `),p})()}),null),Ie(u,()=>t.text,null),mn(h=>{var p=!!e(),g=!!i();return p!==h.e&&l.classList.toggle("composer-unaddressed-chatter--expanded",h.e=p),g!==h.t&&l.classList.toggle("composer-unaddressed-chatter--expandable",h.t=g),h},{e:void 0,t:void 0}),l}})}var Hug,zug,Gug,ly1=
