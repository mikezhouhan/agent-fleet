// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentUsedEnvironment.js
// byteRange: [23619216, 23620362)
// beautified: false
// truncated: false
O({"cloudAgentUsedEnvironment.js"(){"use strict";fh(),Ghi(),dWm="agent-pod-fork"}});import{useEffect as hWm,useMemo as WVS,useRef as CTn,useState as pWm}from"./react-runtime/react/esm-index-production.js";function HVS(t){const{bcId:e,isSetupSettled:n,isSetupStatusKnown:i,source:r}=t,s=CTn(!1),o=CTn(void 0);i&&!n?(s.current=!0,o.current=void 0):n&&s.current&&(o.current??=Date.now());const[l,c]=pWm(void 0),[u,d]=pWm(0),h=CTn(r);h.current=r;const p=CTn(l);p.current=l;const g=CTn(n);g.current=n;const v=CTn(i);v.current=i;const b=r?.websiteUrl,_=r!==void 0;return hWm(()=>{const y=e?.trim(),S=h.current;if(!S||!y){c(void 0);return}let k=!1;return FVS({loader:S.loader,bcId:y}).then(C=>{k||c(C)}),()=>{k=!0}},[e,u,_,n,i,b]),hWm(()=>{if(!_||!uWm({fields:l,isSetupSettled:n,isSetupStatusKnown:i,setupSettledAtMs:o.current}))return;const y=Ut.setInterval(()=>{if(!uWm({fields:p.current,isSetupSettled:g.current,isSetupStatusKnown:v.current,setupSettledAtMs:o.current,nowMs:Date.now()})){Ut.clearInterval(y);return}d(S=>S+1)},2e3);return()=>{Ut.clearInterval(y)}},[l,_,n,i]),WVS(()=>{if(b!==void 0)return NVS({websiteUrl:b,fields:l})},[l,b])}var zVS=
