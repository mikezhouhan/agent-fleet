// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: cloudAgentStreamUiTelemetry.js
// byteRange: [20222940, 20223588)
// beautified: false
// truncated: false
O({"cloudAgentStreamUiTelemetry.js"(){"use strict";Llm=new Set(["textDelta","thinkingDelta","thinkingCompleted","partialToolCall","toolCallStarted","toolCallCompleted","userMessageAppended","turnEnded"]),BHr=2e3,s9a=15e3,o9a=15e3,Olm=6e4,Flm=30,Blm=6e4,R0n=new Map,P0n=[]}});function a9a(t){return Wlm(t).endsWith(Glm)}function jlm(t){const e=Wlm(t);return e===Hlm||e===zlm}function $lm(t){const e=[t.filename,t.fullPath,t.rule?.fullPath].filter(i=>i!==void 0&&i.length>0);return e.some(i=>a9a(i))?!0:e.some(i=>!jlm(i))?!1:(e.length>0?e:[t.name??""]).some(i=>jlm(i)||a9a(i))}function Wlm(t){return t.trim().replaceAll("\\","/")}var Hlm,zlm,Glm,AwS=
