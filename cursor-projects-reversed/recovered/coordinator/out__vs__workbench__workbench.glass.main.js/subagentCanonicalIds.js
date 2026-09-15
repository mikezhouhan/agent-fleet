// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentCanonicalIds.js
// byteRange: [17624602, 17625563)
// beautified: false
// truncated: false
O({"subagentCanonicalIds.js"(){"use strict";od(),R4p=new Set([k2.RUNNING,k2.BACKGROUNDED])}});function yBr(t,e,n,i,r){const s=(...u)=>{const h=t.getComposerBubble(e,n)?.toolFormerData;h&&"additionalData"in h&&h.additionalData&&"composerData"in h.additionalData&&h.additionalData.composerData&&h.additionalData.composerData.modelConfig&&t.updateComposerBubbleSetStore(e,n,p=>{p("toolFormerData","additionalData","composerData",...u)})},o=CF({modelName:r??lmi,maxMode:!1},i),a=()=>{const d=t.getComposerBubble(e,n)?.toolFormerData;if(d&&"additionalData"in d&&d.additionalData){const h=d.additionalData;if("composerData"in h&&h.composerData){const p=h.composerData;return p.modelConfig&&p.capabilities?p:o}if("subagentComposerId"in h&&h.subagentComposerId){const p=t.getHandleIfLoadedReactive?.(h.subagentComposerId)??t.getHandleIfLoaded?.(h.subagentComposerId);if(p)try{return p.data}catch{return o}}}return o},l=w7e()?st(a):a;return new P4p(l,s)}var lmi,P4p,cSn=
