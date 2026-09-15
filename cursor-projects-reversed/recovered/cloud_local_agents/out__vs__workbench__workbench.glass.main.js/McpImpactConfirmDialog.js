// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: McpImpactConfirmDialog.js
// byteRange: [13852393, 13853327)
// beautified: false
// truncated: false
O({"McpImpactConfirmDialog.js"(){"use strict";OB(),ite(),bC()}});import{useState as Yoi,useCallback as Fsa}from"./react-runtime/react/esm-index-production.js";function Uhy(t){const[e,n]=Yoi(null),[i,r]=Yoi(null),[s,o]=Yoi({}),[a,l]=Yoi(null),[c,u]=Yoi(!1),d=Fsa(g=>{const v=Koi(g);v!==void 0&&(r(v),o(Rsa(v,g.teamMarketplaceConfiguredVariables)),l(null),n(g))},[]),h=Fsa(()=>{n(null),r(null),o({}),l(null)},[]),p=Fsa(async()=>{if(i===null||e===null)return;l(null);let g;if(Object.keys(s).length===0)g={};else{const v=Psa({schema:i,values:s});if(!v.success){l(v.error);return}g=v.data??{}}u(!0);try{await t(e,g),h()}catch(v){const b=v instanceof Error?v.message:void 0;l(b??"Failed to save plugin variables. Please try again.")}finally{u(!1)}},[i,s,e,t,h]);return{configuringPlugin:e,variableSchema:i,variableValues:s,setVariableValues:o,configureError:a,isSavingVariables:c,startConfigure:d,cancelConfigure:h,saveConfigure:p}}var jhy=
