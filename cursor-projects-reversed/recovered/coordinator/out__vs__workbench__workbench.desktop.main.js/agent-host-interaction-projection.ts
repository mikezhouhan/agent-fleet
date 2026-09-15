// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: agent-host-interaction-projection.ts
// byteRange: [17586287, 17587119)
// beautified: false
// truncated: false
j({"agent-host-interaction-projection.ts"(){"use strict";uMd=class{constructor(){this.requested=new Set,this.resolved=new Set,this.pending=new Map,this.active=new Set}observeRequest(e){return this.requested.add(e),this.reconcile([e])}observeResolution(e){return this.resolved.add(e),this.reconcile([e])}replacePending(e){const t=new Set(this.pending.keys());this.pending.clear();for(const n of e)this.pending.set(n.interactionId,n),t.add(n.interactionId);return this.reconcile(t)}clearPending(){return this.replacePending([])}reconcile(e){const t=[];for(const n of e){const i=this.pending.get(n),r=i!==void 0&&this.requested.has(n)&&!this.resolved.has(n);r&&!this.active.has(n)?(this.active.add(n),t.push({case:"activate",interaction:i})):!r&&this.active.delete(n)&&t.push({case:"deactivate",interactionId:n})}return t}}}}),dMd,hMd=
