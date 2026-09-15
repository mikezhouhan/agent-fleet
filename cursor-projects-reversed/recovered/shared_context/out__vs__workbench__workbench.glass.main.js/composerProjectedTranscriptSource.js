// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerProjectedTranscriptSource.js
// byteRange: [25311806, 25312778)
// beautified: false
// truncated: false
O({"composerProjectedTranscriptSource.js"(){"use strict";Xe()}});function iT1(t){return async(e,n)=>{const i=e.trim();if(!i)return null;if(i.startsWith(eEn)){const r=t.getAgentId();return r?rT1({artifactCacheService:t.artifactCacheService,agentId:r,filePath:i,signal:n}):null}return{url:rp.uriToBrowserUri(Ve.file(i)).toString(!0)}}}async function rT1(t){let e=0;for(;!t.signal.aborted;)try{const n=await t.artifactCacheService.resolveArtifactUrl(t.agentId,t.filePath,t.signal);return t.signal.aborted||!n.url?null:{url:n.url,onDidChange:i=>{const r=n.onDidChange(i);return()=>r.dispose()}}}catch(n){if(t.signal.aborted)return null;if(Ka.from(n).code===yo.NotFound&&e<$mg){e+=1,await sT1(Wmg,t.signal);continue}return null}return null}function sT1(t,e){return new Promise((n,i)=>{if(e.aborted){i(e.reason);return}const r=setTimeout(()=>{e.removeEventListener("abort",s),n()},t),s=()=>{clearTimeout(r),i(e.reason)};e.addEventListener("abort",s,{once:!0})})}var $mg,Wmg,oT1=
