// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentRepositorySnapshot.js
// byteRange: [20414681, 20415870)
// beautified: false
// truncated: false
O({"cloudAgentRepositorySnapshot.js"(){"use strict";Zjr(),Lv(),Tdm=class{constructor(t){this.selectedTeamId=t,this.authenticationEpoch=0,this.revision=0,this.mutableSnapshot=new _a(void 0),this.snapshot=this.mutableSnapshot}captureScope(){return Object.freeze({authenticationEpoch:this.authenticationEpoch,selectedTeamId:this.selectedTeamId})}invalidateAuthentication(t){this.authenticationEpoch++,this.selectedTeamId=t,this.mutableSnapshot.set(void 0)}updateSelectedTeam(t){return this.selectedTeamId===t?!1:(this.selectedTeamId=t,this.mutableSnapshot.set(void 0),!0)}isCurrentScope(t){return t.authenticationEpoch===this.authenticationEpoch&&t.selectedTeamId===this.selectedTeamId}publish(t,e){if(!this.isCurrentScope(t))return!1;const n=Object.freeze({authenticationEpoch:t.authenticationEpoch,selectedTeamId:t.selectedTeamId,revision:++this.revision,candidates:Object.freeze(e.map(i=>Object.freeze({conversationId:i.conversationId,title:i.title,recency:i.recency,isArchived:i.isArchived,branches:i.branches})).sort((i,r)=>r.recency-i.recency).slice(0,CZp))});return this.mutableSnapshot.set(n),!0}}}});function Edm(){return Szr?!1:(Szr=!0,!0)}function xdm(){Szr=!1}var Idm,Szr,s8a,Adm=
