// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentRepositorySnapshot.js
// byteRange: [19143777, 19144966)
// beautified: false
// truncated: false
j({"cloudAgentRepositorySnapshot.js"(){"use strict";y7i(),I1(),OUd=class{constructor(e){this.selectedTeamId=e,this.authenticationEpoch=0,this.revision=0,this.mutableSnapshot=new cp(void 0),this.snapshot=this.mutableSnapshot}captureScope(){return Object.freeze({authenticationEpoch:this.authenticationEpoch,selectedTeamId:this.selectedTeamId})}invalidateAuthentication(e){this.authenticationEpoch++,this.selectedTeamId=e,this.mutableSnapshot.set(void 0)}updateSelectedTeam(e){return this.selectedTeamId===e?!1:(this.selectedTeamId=e,this.mutableSnapshot.set(void 0),!0)}isCurrentScope(e){return e.authenticationEpoch===this.authenticationEpoch&&e.selectedTeamId===this.selectedTeamId}publish(e,t){if(!this.isCurrentScope(e))return!1;const n=Object.freeze({authenticationEpoch:e.authenticationEpoch,selectedTeamId:e.selectedTeamId,revision:++this.revision,candidates:Object.freeze(t.map(i=>Object.freeze({conversationId:i.conversationId,title:i.title,recency:i.recency,isArchived:i.isArchived,branches:i.branches})).sort((i,r)=>r.recency-i.recency).slice(0,F2d))});return this.mutableSnapshot.set(n),!0}}}});function FUd(){return yWi?!1:(yWi=!0,!0)}function BUd(){yWi=!1}var UUd,yWi,Hao,$Ud=
