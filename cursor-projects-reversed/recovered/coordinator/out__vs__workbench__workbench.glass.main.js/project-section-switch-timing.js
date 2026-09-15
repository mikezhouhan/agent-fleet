// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-section-switch-timing.js
// byteRange: [26977788, 26978403)
// beautified: false
// truncated: false
O({"project-section-switch-timing.js"(){"use strict";HOg="glass.projects.section_switch_ms"}});import{useCallback as RY1,useEffect as PY1,useRef as MY1}from"./react-runtime/react/esm-index-production.js";function DY1(t){const{metricsService:e,section:n}=t,i=MY1(void 0),r=RY1(s=>{i.current={...s,startMs:performance.now()}},[]);return PY1(()=>{const s=xY1(i);if(s===void 0||s.toSection!==n)return;const o=new Et;return q1(()=>{q1(()=>{try{const a=IY1(s,n,performance.now());a!==void 0&&e.distribution({stat:HOg,value:a.durationMs,tags:a.tags})}finally{o.dispose()}},o,Ut)},o,Ut),()=>{o.dispose()}},[e,n]),r}var NY1=
