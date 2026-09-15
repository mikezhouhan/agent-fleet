// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: queue-edit-snapshot-hydration.js
// byteRange: [27332263, 27333148)
// beautified: false
// truncated: false
O({"queue-edit-snapshot-hydration.js"(){"use strict";Pt(),Hx()}});function Gn0(t){return t.trim().replace(/^\//,"").toLowerCase()}function qn0(t){for(const e of t){if(e.type!=="skill")continue;const n=g8g.get(e.id);if(n!==void 0&&Gn0(e.name)===n)return{command:n,commandId:e.id}}}function Vn0(t){const e=t.submitEntry??"unknown",n={command:t.command,commandId:t.commandId,submitEntry:e};return t.gateEnabled?{...n,gateEnabled:!0,triggerFired:!0}:{...n,gateEnabled:!1,triggerFired:!1,skipReason:"gate_off"}}function g1l({data:t,analyticsService:e,experimentService:n}){const i=qn0(t.commands);if(i===void 0)return;const r=n.checkFeatureGate("glass_local_review_first_bugbot_cta",{disableExposureLog:!0}),s=Vn0({command:i.command,commandId:i.commandId,submitEntry:t.submitEntry,gateEnabled:r});e.trackEvent("glass.review_command.submitted",s),s.triggerFired&&e0t.triggerAd()}var g8g,f8g=
