// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: subagentPreviewMention.js
// byteRange: [23435556, 23436188)
// beautified: false
// truncated: false
O({"subagentPreviewMention.js"(){"use strict";Hx()}});function GXa(t){return{kind:"island",reason:t}}function Q$S(t){return t.isPlanExecution?qXa:t.isEditing?GXa("editing"):t.isSpecialSimulated?GXa("special-simulated"):t.hasLegacyRichTextBody?GXa("legacy-rich-text"):qXa}function Z$S(t,e){return t.eventNotification!==void 0||e&&v4p(t)!==void 0||__n(t)!==void 0||s8r(t)?!0:Spi(t)!==void 0}function J$S(t){const e=t.richText||(t.text??"");if(!e.trimStart().startsWith("{")||Tte(e)!==void 0)return!1;try{return JSON.parse(e),!0}catch{return!1}}function eWS(t){return t.isSimulatedMsg===!0&&t.isPlanExecution!==!0&&!ypi(t)}var qXa,tWS=
