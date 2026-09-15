// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agent-host-interaction-projection.ts
// byteRange: [18794958, 18795790)
// beautified: false
// truncated: false
O({"agent-host-interaction-projection.ts"(){"use strict";XYp=class{constructor(){this.requested=new Set,this.resolved=new Set,this.pending=new Map,this.active=new Set}observeRequest(t){return this.requested.add(t),this.reconcile([t])}observeResolution(t){return this.resolved.add(t),this.reconcile([t])}replacePending(t){const e=new Set(this.pending.keys());this.pending.clear();for(const n of t)this.pending.set(n.interactionId,n),e.add(n.interactionId);return this.reconcile(e)}clearPending(){return this.replacePending([])}reconcile(t){const e=[];for(const n of t){const i=this.pending.get(n),r=i!==void 0&&this.requested.has(n)&&!this.resolved.has(n);r&&!this.active.has(n)?(this.active.add(n),e.push({case:"activate",interaction:i})):!r&&this.active.delete(n)&&e.push({case:"deactivate",interactionId:n})}return e}}}}),QYp,ZYp=
