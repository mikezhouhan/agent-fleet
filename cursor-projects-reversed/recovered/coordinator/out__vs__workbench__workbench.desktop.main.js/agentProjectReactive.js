// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: agentProjectReactive.js
// byteRange: [18972723, 18973536)
// beautified: false
// truncated: false
j({"agentProjectReactive.js"(){"use strict";I1(),x8d=class{constructor(e,t,n){this.allAgents=e,this.projectId=t,this.source=n}get value(){return this.allAgents.value.filter(e=>e.source===this.source&&e.projectId===this.projectId)}onChange(e){let t=E8d(this.value);return this.allAgents.onChange(()=>{const n=this.value,i=E8d(n);i!==t&&(t=i,e(n))})}},I8d=class{constructor(e){this.agents=e}get value(){const e=new Set;for(const t of this.agents.value)for(const n of t.trackedGitRepos.value){const i=n.activeBranchName.value;i&&e.add(i)}return[...e]}onChange(e){let t=this.value.join("\0");return this.agents.onChange(()=>{const n=this.value,i=n.join("\0");i!==t&&(t=i,e(n))})}}}});function b_t(e){return Kh(e)?`folder:${e.uri.toString()}`:Y_(e)?`config:${e.configPath.toString()}`:null}var iqf,A8d,R8d,lao,D8d,rqf=
