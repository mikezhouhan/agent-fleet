// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagent-tray-environment.js
// byteRange: [31645458, 31646775)
// beautified: false
// truncated: false
O({"subagent-tray-environment.js"(){"use strict";yp(),Koe()}});import{c as ubw}from"./react-runtime/react/esm-compiler-runtime-production.js";import{useEffect as dbw,useRef as hbw,useState as pbw}from"./react-runtime/react/esm-index-production.js";function mbw({agentIds:t,backgroundComposerDataService:e,settledRequestIds:n}){const i=new Map,r=e.isBackgroundWindow()?void 0:e.data.backgroundComposers,s=new Map(r?.map(o=>[o.bcId,o]));for(const o of t){const a=s.get(o),l=tZm(a),c=l===void 0&&(!n.has(o)||a?.isComputingDiffs===!0);i.set(o,l===!0?{status:"reviewable",reviewDiffLineStats:nZm(a)}:c?{status:"pending"}:{status:"not-reviewable"})}return i}function gbw(t){const e=ubw(9),{agentIds:n,trayWorkspace:i}=t,r=Ii(i,Gx),s=Ii(i,H0),[o,a]=pbw(fbw);let l;e[0]!==n||e[1]!==r||e[2]!==o?(l={agentIds:n,backgroundComposerDataService:r,settledRequestIds:o},e[0]=n,e[1]=r,e[2]=o,e[3]=l):l=e[3];const u=S3(l,mbw);let d;e[4]===Symbol.for("react.memo_cache_sentinel")?(d=new Set,e[4]=d):d=e[4];const h=hbw(d);let p,g;return e[5]!==n||e[6]!==s?(p=()=>{for(const v of n){if(h.current.has(v))continue;h.current.add(v);const b=()=>{a(_=>_.has(v)?_:new Set(_).add(v))};s.ensureDiffStatsForBc(v).then(b).catch(_=>{b(),Hr(_)})}},g=[n,s],e[5]=n,e[6]=s,e[7]=p,e[8]=g):(p=e[7],g=e[8]),dbw(p,g),u}function fbw(){return new Set}var vbw=
