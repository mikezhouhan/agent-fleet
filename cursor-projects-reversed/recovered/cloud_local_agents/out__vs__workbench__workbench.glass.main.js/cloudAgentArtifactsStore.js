// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentArtifactsStore.js
// byteRange: [20195900, 20196240)
// beautified: false
// truncated: false
O({"cloudAgentArtifactsStore.js"(){"use strict";rlm=class{constructor(t,e){this.agentId=t,this.artifactCacheService=e}async listArtifacts(){try{return await this.artifactCacheService.listArtifactsCached(this.agentId)}catch{return[]}}async getArtifactBytes(t){return this.artifactCacheService.fetchArtifactBytes(this.agentId,t)}}}}),z4a,slm=
