// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: McpImpactConfirmDialog.js
// byteRange: [12277182, 12278115)
// beautified: false
// truncated: false
j({"McpImpactConfirmDialog.js"(){"use strict";o9(),OZ(),N0()}});import{useState as Twn,useCallback as Qws}from"./react-runtime/react/esm-index-production.js";function Mjg(e){const[t,n]=Twn(null),[i,r]=Twn(null),[s,o]=Twn({}),[a,c]=Twn(null),[l,u]=Twn(!1),h=Qws(f=>{const v=Kxi(f);v!==void 0&&(r(v),o(bBl(v,f.teamMarketplaceConfiguredVariables)),c(null),n(f))},[]),m=Qws(()=>{n(null),r(null),o({}),c(null)},[]),g=Qws(async()=>{if(i===null||t===null)return;c(null);let f;if(Object.keys(s).length===0)f={};else{const v=_Bl({schema:i,values:s});if(!v.success){c(v.error);return}f=v.data??{}}u(!0);try{await e(t,f),m()}catch(v){const _=v instanceof Error?v.message:void 0;c(_??"Failed to save plugin variables. Please try again.")}finally{u(!1)}},[i,s,t,e,m]);return{configuringPlugin:t,variableSchema:i,variableValues:s,setVariableValues:o,configureError:a,isSavingVariables:l,startConfigure:h,cancelConfigure:m,saveConfigure:g}}var Pjg=
