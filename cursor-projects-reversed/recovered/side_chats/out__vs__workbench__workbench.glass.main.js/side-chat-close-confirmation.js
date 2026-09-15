// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: side-chat-close-confirmation.js
// byteRange: [32575370, 32576502)
// beautified: false
// truncated: false
O({"side-chat-close-confirmation.js"(){"use strict";At(),_qt(),SBf="glass.sideChat.confirmDismissRunning",p7l="stop-and-close",m7l="close"}});function l9w(t,e,n){return t.registerCodeEditorOpenHandler((i,r,s)=>c9w(e,n,i,r,s))}async function c9w(t,e,n,i,r){const s=n.resource,o=i?t.getTabIdForEditor(i):void 0;if(!i||!o||!s)return null;const a=e.manager.getTab({groupId:Ds,tabId:o});if(a?.kind!==zt.File)return null;if(ou(i.getModel()?.uri,s)&&(!n.options||n.options.selectionSource==="code.jump"))return n.options&&OFe(n.options,i,0),i;if(n.options?.selectionSource!=="code.jump")return null;const l={editorType:a.props.editorType,uriString:s.toString(),selection:u9w(n.options?.selection),ownerAgentId:a.props.ownerAgentId};r||a.props.preview===!0?e.openPreviewFileTab(l):e.activateFileTab(l);const c=e.getActiveTabId();if(!c)return null;const u=await t.waitForFileEditor(c,s.toString());return u&&n.options&&(OFe(n.options,u,0),u.focus()),u??null}function u9w(t){if(t)return{startLineNumber:t.startLineNumber,startColumn:t.startColumn,endLineNumber:t.endLineNumber??t.startLineNumber,endColumn:t.endColumn??t.startColumn}}var d9w=
