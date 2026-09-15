// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: side-chat-tab-icon.react.js
// byteRange: [27082912, 27083728)
// beautified: false
// truncated: false
O({"side-chat-tab-icon.react.js"(){"use strict";Pt(),Vj(),zCt(),HA(),U6g={icon:{kmuXW:"glass-2lah0s",$$css:!0}},j6g=PZ1(function(e){const n=RZ1(5),{tab:i}=e,r=QZ();let s;if(n[0]!==r||n[1]!==i.props.agentId){const l=typeof i.props.agentId=="string"?i.props.agentId.trim():"",c=l?r.getAgentHeader(l):void 0;s=l?zV1({agentId:l,isSideChat:c!==void 0&&Jv(c),header:c}):"chat-bubble",n[0]=r,n[1]=i.props.agentId,n[2]=s}else s=n[2];const o=s;let a;return n[3]!==o?(a=MZ1(Ot,{name:o,rootStyle:U6g.icon,size:"base"}),n[3]=o,n[4]=a):a=n[4],a})}});function $6g(t){const e=t.bcId.trim(),n=t.conversationId?.trim()??"";if(e!==""&&n==="")return{kind:"cloud",bcId:e};if(n!==""&&e==="")return{kind:"local",conversationId:n}}function NZ1(t){return t.kind==="cloud"?{bcId:t.bcId}:{bcId:"",conversationId:t.conversationId}}var W6g,aSl=
