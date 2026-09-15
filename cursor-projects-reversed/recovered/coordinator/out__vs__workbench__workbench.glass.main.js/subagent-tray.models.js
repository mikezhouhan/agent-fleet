// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagent-tray.models.js
// byteRange: [31640251, 31640828)
// beautified: false
// truncated: false
O({"subagent-tray.models.js"(){"use strict";Lm(),hSn(),tcl(),lve(),B0e(),MS(),ekt(),MSs(),EAf=new Map,C2i=5,xAf=new Map}});function qvw(t){const e=t.trim();if(!(e.length===0||e==="Completed"))return e}function IAf(t){const e=t.name.trim()||R("glass.project.agents.newSubagent","New subagent"),n=qvw(t.task),i=t.environment,r=t.environmentInfo,s=t.environmentIcon;return{name:e,description:n,ariaLabel:n===void 0?e:`${e} \u2014 ${n}`,environment:i,environmentInfo:r,environmentIcon:s,showEnvironmentIcon:s!==void 0,activityState:t.state,descriptionShimmer:uxt(t.state)}}var AAf=
