// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: skillPublishDiagnostics.js
// byteRange: [26346925, 26347352)
// beautified: false
// truncated: false
O({"skillPublishDiagnostics.js"(){"use strict";QP(),qCi="cursorSkillPublish",ZIg="Skill Publishing",Ffl="workbench.action.customize.openSkillPublishLogs"}});function Ufl(t){const{teamId:e,marketplaces:n,isTeamPluginsAdmin:i}=t;if(e===void 0||n===void 0)return"allowed";const r=n.find(s=>s.teamId===e&&osa(s));return r===void 0||r.allowUserPublish!==!1?"allowed":i===void 0?"adminUnresolved":i?"allowed":"blockedByTeam"}var JIg=
