// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectCardOrder.js
// byteRange: [5140953, 5142180)
// beautified: false
// truncated: false
O({"projectCardOrder.js"(){"use strict"}});function l6t(t,e){return t.config.propertyDefinitions.find(n=>n.id===e)}function zyr(t,e){return t?.options?.find(n=>n.id===e)}function Gyr(t,e){const n=t.properties[e];return typeof n=="string"?n:void 0}function Y9o(t,e){const n=t.properties[e];return typeof n=="string"?n:void 0}function tDd(t,e){const{dependency:n}=t.config,i=Y9o(e,n.completionPropertyId);return i!==void 0&&n.completionOptionIds.includes(i)}function X9o(t,e){const n=Y9o(e,t.config.dependency.completionPropertyId);return n!==void 0&&(t.config.dependency.ignoredOptionIds??[]).includes(n)}function nDd(t,e){const n=l6t(t,t.config.view.groupBy),i=zyr(n,e);return{label:i?.label??e,tone:i?.tone??"default",icon:i?.icon}}function iDd(t){return t==null?!0:typeof t=="string"||Array.isArray(t)?t.length===0:!1}function rDd(t,e){if(e===void 0||t===void 0)return null;switch(t.type){case"select":return typeof e!="string"?null:zyr(t,e)?.label??e;case"multiSelect":return Array.isArray(e)?e.map(n=>zyr(t,n)?.label??n).join(", "):null;case"boolean":return typeof e=="boolean"?e?"Yes":"No":null;case"number":return typeof e=="number"?String(e):null;case"text":return typeof e=="string"?e:null;default:return null}}var hei=
