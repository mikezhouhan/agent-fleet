// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentStreamReadTimeout.js
// byteRange: [17664989, 17665560)
// beautified: false
// truncated: false
j({"cloudAgentStreamReadTimeout.js"(){"use strict";NPd=class{async readNext(e){let t;const n=new Promise((i,r)=>{t=r,this.timeoutReject=r});try{return await Promise.race([e.next(),n])}finally{this.timeoutReject===t&&(this.timeoutReject=void 0)}}reject(e){const t=this.timeoutReject;return t===void 0?!1:(this.timeoutReject=void 0,t(e),!0)}}}});function OPd(e,t){if(!t.useFilter||e.length===0)return{preFetchedBlobIds:Array.from(e)};const n=odf(e);return n===void 0?{preFetchedBlobIds:Array.from(e)}:{preFetchedBlobIds:[],preFetchedBlobFilter:new vGs(cdf(n))}}var $to,FPd=
