// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpProviderService.js
// byteRange: [19141875, 19142985)
// beautified: false
// truncated: false
O({"mcpProviderService.js"(){"use strict";Ft(),Xe(),Pn(),_t(),gs(),iRe=Cu("mcpProviderService"),x$r=class extends nt{constructor(t){super(),this.experimentService=t,this._owners=new Map,this._onDidChangeProviders=this._register(new $e),this.onDidChangeProviders=this._onDidChangeProviders.event}registerMcpProvider(t){if(t.featureGateName&&!this.experimentService.checkFeatureGate(t.featureGateName,{disableExposureLog:!1}))return nt.None;const e=this._owners.get(t.id)??[];return e.push(t),this._owners.set(t.id,e),this._onDidChangeProviders.fire(),Fn(()=>this._release(t))}notifyMcpProviderChanged(t){this._owners.has(t)&&this._onDidChangeProviders.fire()}getAllProviders(){const t=[];for(const e of this._owners.values()){const n=e.at(-1);n&&t.push(n)}return t}getMcpProvider(t){return this._owners.get(t)?.at(-1)}_release(t){const e=this._owners.get(t.id);if(!e)return;const n=e.lastIndexOf(t);if(n===-1)return;const i=n===e.length-1;e.splice(n,1),e.length===0&&this._owners.delete(t.id),i&&this._onDidChangeProviders.fire()}},x$r=__decorate([__param(0,Rr)],x$r),vn(iRe,x$r,1,1)}}),gem,fem,iOa,vem,bem,PvS=
