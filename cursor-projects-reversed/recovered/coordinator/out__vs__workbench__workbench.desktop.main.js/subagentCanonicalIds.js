// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: subagentCanonicalIds.js
// byteRange: [16503462, 16504423)
// beautified: false
// truncated: false
j({"subagentCanonicalIds.js"(){"use strict";bh(),Yxf=new Set([$E.RUNNING,$E.BACKGROUNDED])}});function e4i(e,t,n,i,r){const s=(...u)=>{const m=e.getComposerBubble(t,n)?.toolFormerData;m&&"additionalData"in m&&m.additionalData&&"composerData"in m.additionalData&&m.additionalData.composerData&&m.additionalData.composerData.modelConfig&&e.updateComposerBubbleSetStore(t,n,g=>{g("toolFormerData","additionalData","composerData",...u)})},o=aL({modelName:r??PIn,maxMode:!1},i),a=()=>{const h=e.getComposerBubble(t,n)?.toolFormerData;if(h&&"additionalData"in h&&h.additionalData){const m=h.additionalData;if("composerData"in m&&m.composerData){const g=m.composerData;return g.modelConfig&&g.capabilities?g:o}if("subagentComposerId"in m&&m.subagentComposerId){const g=e.getHandleIfLoadedReactive?.(m.subagentComposerId)??e.getHandleIfLoaded?.(m.subagentComposerId);if(g)try{return g.data}catch{return o}}}return o},c=Txe()?Ae(a):a;return new X_d(c,s)}var PIn,X_d,p8t=
