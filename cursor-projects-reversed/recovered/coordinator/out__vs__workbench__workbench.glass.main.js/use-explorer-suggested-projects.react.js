// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-explorer-suggested-projects.react.js
// byteRange: [28931726, 28932722)
// beautified: false
// truncated: false
O({"use-explorer-suggested-projects.react.js"(){"use strict";Uzr(),cpm(),Dh(),kn()}});import{useEffect as w30,useState as k30}from"./react-runtime/react/esm-index-production.js";function qtf(t){return Il(t)&&!OZ(t)}function Vtf(t){const e=t.workspaceIdentifier;if(!qtf(e))return;const n={type:"workspace",id:`workspace:${e.id}`,name:t.displayName,workspaceIdentifier:e,remoteAuthority:e.uri.authority||void 0};return sM(n)}function Ktf(){const{workspace:t}=pw(),e=Ze(Ov),n=Ze(v4),[i,r]=k30(()=>Vtf(t));return w30(()=>{let s=!1,o=0;const a=()=>{const c=++o,u=Vtf(t);u&&r(u);const h=e.getWorkspace().folders[0];if(!h){r(u);return}const p=h.uri;n.getSingleFolderWorkspaceIdentifier(p).then(g=>{if(s||c!==o)return;if(!g||!qtf(g)){r(u);return}const v={type:"workspace",id:`workspace:${g.id}`,name:h.name,workspaceIdentifier:g,remoteAuthority:g.uri.authority||void 0};r(sM(v))}).catch(()=>{s||c!==o||r(u)})};a();const l=e.onDidChangeWorkspaceFolders(a);return()=>{s=!0,l.dispose()}},[t,e,n]),i}var Ytf=
