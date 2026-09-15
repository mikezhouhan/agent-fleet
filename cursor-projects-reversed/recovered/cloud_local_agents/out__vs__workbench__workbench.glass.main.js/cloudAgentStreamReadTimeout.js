// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentStreamReadTimeout.js
// byteRange: [18873692, 18874263)
// beautified: false
// truncated: false
O({"cloudAgentStreamReadTimeout.js"(){"use strict";bQp=class{async readNext(t){let e;const n=new Promise((i,r)=>{e=r,this.timeoutReject=r});try{return await Promise.race([t.next(),n])}finally{this.timeoutReject===e&&(this.timeoutReject=void 0)}}reject(t){const e=this.timeoutReject;return e===void 0?!1:(this.timeoutReject=void 0,e(t),!0)}}}});function _Qp(t,e){if(!e.useFilter||t.length===0)return{preFetchedBlobIds:Array.from(t)};const n=pFy(t);return n===void 0?{preFetchedBlobIds:Array.from(t)}:{preFetchedBlobIds:[],preFetchedBlobFilter:new VTa(gFy(n))}}var TLa,yQp=
