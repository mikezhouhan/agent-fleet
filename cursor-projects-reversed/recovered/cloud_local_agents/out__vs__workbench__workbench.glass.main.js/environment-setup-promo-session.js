// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: environment-setup-promo-session.js
// byteRange: [31786658, 31787424)
// beautified: false
// truncated: false
O({"environment-setup-promo-session.js"(){"use strict";g1s=new Set,f1s=new Set}});function $Sw(t){return t.hasAgentReviewDiff&&((t.fileCount??0)>0||(t.added??0)>0||(t.removed??0)>0)}function M2f(t){return t.editorPanelVisible?t.activeEditorTabKind===zt.Diff||t.activeEditorTabKind===zt.Pr:!1}function D2f(t){return t.hasReviewDiff&&!t.isReviewSurfaceOpen&&!t.isCloudAgentOnBaseBranch}function C6l(t){if(!t)return;const e=typeof t.added=="number"&&t.added>0?t.added:void 0,n=typeof t.removed=="number"&&t.removed>0?t.removed:void 0;if(!(e===void 0&&n===void 0))return{added:e,removed:n}}function WSw(t){if(t.prDiffs&&t.prDiffs.length>0){let e=0,n=0;for(const i of t.prDiffs)e+=i.additions,n+=i.deletions;return C6l({added:e,removed:n})}return C6l(t.fallback)}var v1s=
