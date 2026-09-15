// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentHostRestartInterruption.js
// byteRange: [19626615, 19627984)
// beautified: false
// truncated: false
O({"subagentHostRestartInterruption.js"(){"use strict";lve(),erm=new Set(["success","error","cancelled","skipped","rejected"]),trm=new Set(["completed","cancelled","error"])}});function W_S(t){return typeof t=="object"&&t!==null&&"planUri"in t}function H_S(t){if(W_S(t)&&typeof t.planUri=="string")return t.planUri.trim()}function r6a(t){const e=t?.trim();return e&&e.length>0?e:void 0}function z_S(t){switch(t.tool.case){case"sendFinalSummaryToolCall":case"communicateUpdateToolCall":return nrm(t)!==void 0;case"createPlanToolCall":return r6a(t.tool.value.args?.plan)!==void 0;default:return!1}}function nrm(t){if(t!==void 0)switch(t.tool.case){case"sendFinalSummaryToolCall":return r6a(t.tool.value.args?.finalSummary);case"communicateUpdateToolCall":return r6a(t.tool.value.args?.finalSummary);default:return}}function BWr(t){let e,n;for(let i=t.length-1;i>=0;i--){const r=t[i];if(r.type!==ws.AI)continue;const s=r.toolFormerData,o=s?.tool;if(o===vt.CREATE_PLAN&&s!==void 0&&!e){const a=s.params?.plan;typeof a=="string"&&a.trim().length>0&&(e=`Plan written to ${H_S(s.additionalData)||"unknown plan file"}:
${a}`)}n||(n=nrm(s?.toolCall)),o===void 0&&!e&&r.text&&r.text.trim()!==""&&(e=r.text)}if(!e)if(n)e="No output";else return;return n?["<user_visible_high_level_summary>",n,"</user_visible_high_level_summary>","<response>",e,"</response>"].join(`
`):e}var UWr=
