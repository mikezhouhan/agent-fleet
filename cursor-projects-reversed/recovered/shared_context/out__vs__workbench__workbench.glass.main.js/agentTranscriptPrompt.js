// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: agentTranscriptPrompt.js
// byteRange: [17273670, 17274575)
// beautified: false
// truncated: false
O({"agentTranscriptPrompt.js"(){"use strict";qWe()}});function Ixa(t){return t.length>0&&fva(t)===void 0&&t.every(e=>e.type===ws.AI)}function BGy(t){return`recovered-initial-human-v1-${t}`}function UGy(t){const e={...mb(),bubbleId:BGy(t.composerId),type:ws.HUMAN,text:t.text,isDisplayOnly:!0,conversationState:new Jf};return delete e.createdAt,e}function jGy(t){if(fva(t.existingHeaders)!==void 0)return{kind:"noop",reason:"already-has-human"};if(!Ixa(t.existingHeaders))return{kind:"noop",reason:"not-ai-only"};if(t.transcriptContent===void 0||t.transcriptContent.length===0)return{kind:"noop",reason:"no-transcript"};const e=I5p(t.transcriptContent);if(e===void 0)return{kind:"noop",reason:"no-user-prompt"};const n=UGy({composerId:t.composerId,text:e});return{kind:"recovered",headers:[qP(n),...t.existingHeaders],conversationMap:{[n.bubbleId]:n,...t.existingMap},recoveredBubbleId:n.bubbleId}}var $Gy=
