// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: resyncSkillPluginClient.js
// byteRange: [26332096, 26332984)
// beautified: false
// truncated: false
O({"resyncSkillPluginClient.js"(){"use strict";Na(),Zo(),Wu(),aT(),Zls()}});function p41(t,e){const n=tm.getOriginalUri(t,{supportSideBySide:Qp.PRIMARY});return n?.scheme===e?n:void 0}async function NIg(t,e){const{commandService:n,editorService:i,isGlass:r,pathService:s,workbenchEnvironmentService:o}=t;if(e.previousDir===e.nextDir)return;const a=d=>eF(Ve.file(d),o.remoteAuthority,s.defaultUriScheme),l=a(e.previousDir),c=a(e.nextDir);if(r){await n.executeCommand(iYp,{sourceUriString:l.toString(),targetUriString:c.toString()});return}const u=new Map;for(const d of i.editors){const h=p41(d,l.scheme);if(h===void 0||!f2(h,l))continue;const p=rN(l,h);if(p===void 0||p==="")continue;const g=Ms(c,p);for(const v of i.findEditors(h)){const b=u.get(v.groupId)??[];b.push({editor:v.editor,replacement:{resource:g}}),u.set(v.groupId,b)}}for(const[d,h]of u)await i.replaceEditors(h,d)}var LIg=
