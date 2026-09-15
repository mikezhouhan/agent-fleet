// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: ComposerCloudAgentStreamErrorRow.react.js
// byteRange: [23421928, 23422518)
// beautified: false
// truncated: false
O({"ComposerCloudAgentStreamErrorRow.react.js"(){"use strict";Yc(),Pt(),S$S(),XBm="https://cursor.com/dashboard/cloud-agents#environments"}});function x$S(t){if(t.cloudAgentHeaderId!==void 0&&t.cloudAgentHeaderId.length>0)return t.cloudAgentHeaderId;if(t.backgroundAgentBcId!==void 0&&gu(t.backgroundAgentBcId))return t.backgroundAgentBcId;if(gu(t.composerId))return t.composerId}async function I$S(t){const e=x$S(t);if(e===void 0)throw new Error("Unable to retry: this composer is not a Glass cloud agent.");await t.cloudAgentRepositoryService.resumeCloudAgentFromTerminalError(e)}var A$S=
