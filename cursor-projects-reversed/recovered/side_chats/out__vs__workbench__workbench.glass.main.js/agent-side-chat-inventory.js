// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agent-side-chat-inventory.js
// byteRange: [31760368, 31761545)
// beautified: false
// truncated: false
O({"agent-side-chat-inventory.js"(){"use strict";fE(),x_(),Bwe(),HA()}});import{c as rSw}from"./react-runtime/react/esm-compiler-runtime-production.js";import{useRef as sSw,useSyncExternalStore as oSw}from"./react-runtime/react/esm-index-production.js";function _2f(t,e){const n=rSw(8),i=a_(al);let r;n[0]===Symbol.for("react.memo_cache_sentinel")?(r={key:"",tabs:[]},n[0]=r):r=n[0];const s=sSw(r);let o;n[1]!==i?.agents||n[2]!==t?.manager?(o=u=>{const d=t?.manager.subscribeAll(u)??lSw,h=i?.agents.onChange(u);return()=>{d(),h?.dispose()}},n[1]=i?.agents,n[2]=t?.manager,n[3]=o):o=n[3];const a=o;let l;n[4]!==e||n[5]!==i||n[6]!==t?(l=()=>{if(!t||!i)return s.current={key:"",tabs:l6l},l6l;const u=t.manager.getGroup(Ds),d=nSw({ownerAgentId:l6e(e,p=>i.getAgentHeader(p)),headers:i.agents.value,openTabs:t.manager.getAllTabs(),activeTabId:u?.activeTabId,isOpenTabVisible:(p,g)=>t.isTabVisibleForAgent(p,g)}),h=d.map(aSw).join("|");return h!==s.current.key&&(s.current={key:h,tabs:d}),s.current.tabs},n[4]=e,n[5]=i,n[6]=t,n[7]=l):l=n[7];const c=l;return oSw(a,c,c)}function aSw(t){return`${t.agentId}\0${t.tabId}\0${t.active}\0${t.isOpen}\0${t.label}`}function lSw(){}var l6l,y2f=
