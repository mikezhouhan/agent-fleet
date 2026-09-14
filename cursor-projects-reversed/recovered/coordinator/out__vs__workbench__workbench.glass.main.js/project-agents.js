// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-agents.js
// byteRange: [23513382, 23514088)
// beautified: false
// truncated: false
O({"project-agents.js"(){"use strict";Pt(),Lm(),H9p(),HA(),BZ(),ekt(),y1i="glass_projects_enabled",_jm="glass_projects_empty_state",yjm="glass_projects_unread_divider",QQa={icon:"cube",colorId:"default"},ZQa=[],S1i=10}});function yTn(t,e,n){const i=t.getAgent(e);if(i!==void 0)try{return n(i)}finally{i.dispose()}}function IHt(t,e,n){const i=t.getAgent(e);if(i!==void 0)try{return Promise.resolve(n(i)).finally(()=>{i.dispose()})}catch(r){throw i.dispose(),r}}async function STn(t,e,n){const i=t.getAgent(e)??await t.loadAgent(e);try{return await n(i)}finally{i.dispose()}}function w1i(t,e,n){return yTn(t,e,i=>n(i.composerDataHandle))}function PzS(t,e,n){return IHt(t,e,i=>n(i.composerDataHandle))}var AY=
