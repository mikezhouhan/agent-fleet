// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: useCloudAgentVideoAnnotations.js
// byteRange: [24712153, 24713285)
// beautified: false
// truncated: false
O({"useCloudAgentVideoAnnotations.js"(){"use strict";Pt(),pp(),Qn(),us(),Lf(),dss=Dr(rBt)}});function Ey1(t){return t>=26e3&&t<=26999||t>=5870&&t<=5890?!0:t===2375||t===5901||t===50052}function tdg(t){if(!q2a(t))return;let e;try{e=new URL(t)}catch{return}if(e.protocol!=="http:"&&e.protocol!=="https:")return;const n=e.port!==""?Number.parseInt(e.port,10):e.protocol==="https:"?443:80;if(!Number.isInteger(n)||n<=0||n>65535||Ey1(n))return;const i=idg.has(e.hostname)?"127.0.0.1":e.hostname;return{protocol:e.protocol,remoteHost:i,remotePort:n,suffix:`${e.pathname}${e.search}${e.hash}`}}function Ull(t,e){const n=xy1(t);return n===void 0?`${(/^[a-z][a-z0-9+.-]*:\/\//i.test(t)?t:`${e.protocol}//${t}`).replace(/\/+$/,"")}${e.suffix}`:`${e.protocol}//${e.remoteHost}:${n}${e.suffix}`}function xy1(t){const e=/:(\d{1,5})\/?$/.exec(t);if(e===null)return;const n=Number.parseInt(e[1],10);return n>0&&n<=65535?n:void 0}function ndg(t){let e;try{e=new URL(t)}catch{return"invalid"}return e.protocol!=="http:"&&e.protocol!=="https:"?"invalid":q2a(t)?e.hostname.endsWith(".localhost")?"loopback-vhost":"loopback":"not-loopback"}var idg,Iy1=
