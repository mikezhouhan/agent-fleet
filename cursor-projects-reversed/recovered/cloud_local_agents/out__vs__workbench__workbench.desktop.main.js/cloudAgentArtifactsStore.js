// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentArtifactsStore.js
// byteRange: [18943141, 18943481)
// beautified: false
// truncated: false
j({"cloudAgentArtifactsStore.js"(){"use strict";D9d=class{constructor(e,t){this.agentId=e,this.artifactCacheService=t}async listArtifacts(){try{return await this.artifactCacheService.listArtifactsCached(this.agentId)}catch{return[]}}async getArtifactBytes(e){return this.artifactCacheService.fetchArtifactBytes(this.agentId,e)}}}}),M9d,JGf=
