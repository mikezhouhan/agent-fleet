// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: taskSubagentRecencyIndex.js
// byteRange: [16508024, 16509100)
// beautified: false
// truncated: false
j({"taskSubagentRecencyIndex.js"(){"use strict";Ol(),ebt(),n4i()}});function tIf(e){return e.type==="new"?e.environment.usePrivateWorker:void 0}function LIn(e){return e.selectedPoolName?.trim()||void 0}function nIf(e){if(e.type==="existing"){if(Kh(e.environment))return e.environment.uri.authority;if(Y_(e.environment))return e.environment.configPath.authority}}function iIf(e){return e.length<=AKs?e:`${e.slice(0,AKs).trimEnd()}...`}function rIf(e){const t=vku(e.richText)?.trim()||e.prompt,n=t===void 0?void 0:K_(t).map(i=>i.trim()).find(i=>i.length>0);return iIf(n||e.fallback||MXe)}function syd(e){return e.requestedAgentName??rIf({prompt:e.prompt,richText:e.richText,fallback:e.setupRunAgentName?.trim()||MXe})}function IKs(e){return e.source==="claude-code"&&e.claudeCodeMetadata!==void 0}function i4i(e){return e===Pc.AS_SUBAGENT_FROM_LOCAL||e===Pc.AS_SUBAGENT_FROM_CLOUD}function C3(e){const t=[],n=new Set;for(const i of e){const r=i.repoUrl.value?.trim();r&&!n.has(r)&&(n.add(r),t.push(r))}return t}function sIf(e){return e[0]?.activeBranchName.value}var MXe,AKs,T3=
