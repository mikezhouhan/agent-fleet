// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: agentTranscriptPrompt.js
// byteRange: [16154445, 16155350)
// beautified: false
// truncated: false
j({"agentTranscriptPrompt.js"(){"use strict";pXe()}});function jzs(e){return e.length>0&&e4s(e)===void 0&&e.every(t=>t.type===Ir.AI)}function p0f(e){return`recovered-initial-human-v1-${e}`}function m0f(e){const t={...kf(),bubbleId:p0f(e.composerId),type:Ir.HUMAN,text:e.text,isDisplayOnly:!0,conversationState:new mf};return delete t.createdAt,t}function g0f(e){if(e4s(e.existingHeaders)!==void 0)return{kind:"noop",reason:"already-has-human"};if(!jzs(e.existingHeaders))return{kind:"noop",reason:"not-ai-only"};if(e.transcriptContent===void 0||e.transcriptContent.length===0)return{kind:"noop",reason:"no-transcript"};const t=Xgd(e.transcriptContent);if(t===void 0)return{kind:"noop",reason:"no-user-prompt"};const n=m0f({composerId:e.composerId,text:t});return{kind:"recovered",headers:[PI(n),...e.existingHeaders],conversationMap:{[n.bubbleId]:n,...e.existingMap},recoveredBubbleId:n.bubbleId}}var f0f=
