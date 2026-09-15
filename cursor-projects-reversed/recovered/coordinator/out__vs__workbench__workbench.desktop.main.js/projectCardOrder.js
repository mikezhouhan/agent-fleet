// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: projectCardOrder.js
// byteRange: [3821979, 3823206)
// beautified: false
// truncated: false
j({"projectCardOrder.js"(){"use strict"}});function RUm(e,t){return e.config.propertyDefinitions.find(n=>n.id===t)}function Fns(e,t){return e?.options?.find(n=>n.id===t)}function DUm(e,t){const n=e.properties[t];return typeof n=="string"?n:void 0}function ezc(e,t){const n=e.properties[t];return typeof n=="string"?n:void 0}function MUm(e,t){const{dependency:n}=e.config,i=ezc(t,n.completionPropertyId);return i!==void 0&&n.completionOptionIds.includes(i)}function PUm(e,t){const n=ezc(t,e.config.dependency.completionPropertyId);return n!==void 0&&(e.config.dependency.ignoredOptionIds??[]).includes(n)}function LUm(e,t){const n=RUm(e,e.config.view.groupBy),i=Fns(n,t);return{label:i?.label??t,tone:i?.tone??"default",icon:i?.icon}}function NUm(e){return e==null?!0:typeof e=="string"||Array.isArray(e)?e.length===0:!1}function OUm(e,t){if(t===void 0||e===void 0)return null;switch(e.type){case"select":return typeof t!="string"?null:Fns(e,t)?.label??t;case"multiSelect":return Array.isArray(t)?t.map(n=>Fns(e,n)?.label??n).join(", "):null;case"boolean":return typeof t=="boolean"?t?"Yes":"No":null;case"number":return typeof t=="number"?String(t):null;case"text":return typeof t=="string"?t:null;default:return null}}var Bns=
