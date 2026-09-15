// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subscription-manager.mjs
// byteRange: [32093701, 32094111)
// beautified: false
// truncated: false
O({"subscription-manager.mjs"(){tAw(),H4l=class{constructor(){this.subscriptions=[]}add(t){return JIw(this.subscriptions,t),()=>eAw(this.subscriptions,t)}notify(t,e,n){const i=this.subscriptions.length;if(i)if(i===1)this.subscriptions[0](t,e,n);else for(let r=0;r<i;r++){const s=this.subscriptions[r];s&&s(t,e,n)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}}}}),Gke,SPe,hAw=
