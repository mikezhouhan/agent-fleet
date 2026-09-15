// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpProviderService.js
// byteRange: [17895519, 17896629)
// beautified: false
// truncated: false
j({"mcpProviderService.js"(){"use strict";mt(),ve(),An(),qe(),Hs(),e4e=kp("mcpProviderService"),z7i=class extends _e{constructor(e){super(),this.experimentService=e,this._owners=new Map,this._onDidChangeProviders=this._register(new he),this.onDidChangeProviders=this._onDidChangeProviders.event}registerMcpProvider(e){if(e.featureGateName&&!this.experimentService.checkFeatureGate(e.featureGateName,{disableExposureLog:!1}))return _e.None;const t=this._owners.get(e.id)??[];return t.push(e),this._owners.set(e.id,t),this._onDidChangeProviders.fire(),nn(()=>this._release(e))}notifyMcpProviderChanged(e){this._owners.has(e)&&this._onDidChangeProviders.fire()}getAllProviders(){const e=[];for(const t of this._owners.values()){const n=t.at(-1);n&&e.push(n)}return e}getMcpProvider(e){return this._owners.get(e)?.at(-1)}_release(e){const t=this._owners.get(e.id);if(!t)return;const n=t.lastIndexOf(e);if(n===-1)return;const i=n===t.length-1;t.splice(n,1),t.length===0&&this._owners.delete(e.id),i&&this._onDidChangeProviders.fire()}},z7i=__decorate([__param(0,Yr)],z7i),dn(e4e,z7i,1,1)}}),INd,ANd,vio,RNd,DNd,EUf=
