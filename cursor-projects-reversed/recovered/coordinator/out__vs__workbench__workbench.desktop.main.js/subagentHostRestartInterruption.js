// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: subagentHostRestartInterruption.js
// byteRange: [18374534, 18375903)
// beautified: false
// truncated: false
j({"subagentHostRestartInterruption.js"(){"use strict";PXe(),IBd=new Set(["success","error","cancelled","skipped","rejected"]),ABd=new Set(["completed","cancelled","error"])}});function VWf(e){return typeof e=="object"&&e!==null&&"planUri"in e}function GWf(e){if(VWf(e)&&typeof e.planUri=="string")return e.planUri.trim()}function cso(e){const t=e?.trim();return t&&t.length>0?t:void 0}function zWf(e){switch(e.tool.case){case"sendFinalSummaryToolCall":case"communicateUpdateToolCall":return RBd(e)!==void 0;case"createPlanToolCall":return cso(e.tool.value.args?.plan)!==void 0;default:return!1}}function RBd(e){if(e!==void 0)switch(e.tool.case){case"sendFinalSummaryToolCall":return cso(e.tool.value.args?.finalSummary);case"communicateUpdateToolCall":return cso(e.tool.value.args?.finalSummary);default:return}}function lso(e){let t,n;for(let i=e.length-1;i>=0;i--){const r=e[i];if(r.type!==Ir.AI)continue;const s=r.toolFormerData,o=s?.tool;if(o===Xe.CREATE_PLAN&&s!==void 0&&!t){const a=s.params?.plan;typeof a=="string"&&a.trim().length>0&&(t=`Plan written to ${GWf(s.additionalData)||"unknown plan file"}:
${a}`)}n||(n=RBd(s?.toolCall)),o===void 0&&!t&&r.text&&r.text.trim()!==""&&(t=r.text)}if(!t)if(n)t="No output";else return;return n?["<user_visible_high_level_summary>",n,"</user_visible_high_level_summary>","<response>",t,"</response>"].join(`
`):t}var uso=
