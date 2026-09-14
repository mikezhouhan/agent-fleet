// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agentProjectReactive.js
// byteRange: [20226038, 20226863)
// beautified: false
// truncated: false
O({"agentProjectReactive.js"(){"use strict";Lv(),Jlm=class{constructor(t,e,n){this.allAgents=t,this.projectId=e,this.source=n}get value(){return this.allAgents.value.filter(t=>t.source===this.source&&t.projectId===this.projectId)}onChange(t){let e=Zlm(this.value);return this.allAgents.onChange(()=>{const n=this.value,i=Zlm(n);i!==e&&(e=i,t(n))})}},ecm=class{constructor(t){this.agents=t}get value(){const t=new Set;for(const e of this.agents.value)for(const n of e.trackedGitRepos.value){const i=n.activeBranchName.value;i&&t.add(i)}return[...t]}onChange(t){let e=this.value.join("\0");return this.agents.onChange(()=>{const n=this.value,i=n.join("\0");i!==e&&(e=i,t(n))})}}}});function s$t(t){return Il(t)?`folder:${t.uri.toString()}`:sh(t)?`config:${t.configPath.toString()}`:null}var UwS,tcm,ncm,icm,rcm,l9a,c9a,scm,u9a=
