// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: new-project-picker-status-trigger.react.js
// byteRange: [28985106, 28985614)
// beautified: false
// truncated: false
O({"new-project-picker-status-trigger.react.js"(){"use strict";Pt()}});async function xN0(t){if(!S4e(t.selectedTarget))return{kind:"ready",target:t.selectedTarget,startedAsNewProject:!1};const e=sUm(t.availability);if(e===void 0)return{kind:"originUnavailable"};try{return{kind:"ready",target:(await t.newProjectService.resolveNewProjectTarget({prompt:t.projectName,runtime:"cloud",draftId:t.draftId,namespace:e.namespace})).target,startedAsNewProject:!0}}catch(n){return{kind:"mintFailed",error:n}}}var IN0=
