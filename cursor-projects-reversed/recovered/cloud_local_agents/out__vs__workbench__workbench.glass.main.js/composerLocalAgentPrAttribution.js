// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerLocalAgentPrAttribution.js
// byteRange: [18865182, 18866238)
// beautified: false
// truncated: false
O({"composerLocalAgentPrAttribution.js"(){"use strict";Tnt(),Qs(),Lv(),OT(),SLa=new Set,lQp=8e3,cQp=2e3,uQp=lQp,dQp=cQp}});function imS(t){if(Lme===2&&/^penguin(\.|$)/i.test(t))return"chromebook"}function rmS(t,e,n,i,r,s,o,a,l,c,u){const d=Object.create(null);d["common.machineId"]=s,d["common.macMachineId"]=o,d["common.sqmId"]=a,d["common.devDeviceId"]=l,d.sessionID=vi()+Date.now(),d.commitHash=i,d.version=r,d["common.platformVersion"]=(t||"").replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/,"$1$2$3"),d["common.platform"]=YJi(Lme),d["common.nodePlatform"]=Fpt,d["common.nodeArch"]=n,d["common.product"]=u||"desktop",c&&(d["common.msftInternal"]=c);let h=0;const p=Date.now();Object.defineProperties(d,{timestamp:{get:()=>new Date,enumerable:!0},"common.timesincesessionstart":{get:()=>Date.now()-p,enumerable:!0},"common.sequence":{get:()=>h++,enumerable:!0}}),F$n&&(d["common.snap"]="true");const g=imS(e);return g&&(d["common.platformDetail"]=g),d}function smS(t){const e=NM.USERDNSDOMAIN;if(!e)return!1;const n=e.toLowerCase();return t.some(i=>n===i)}var hQp=
