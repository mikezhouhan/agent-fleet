// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: cloudAgentStreamUiTelemetry.js
// byteRange: [18969625, 18970273)
// beautified: false
// truncated: false
j({"cloudAgentStreamUiTelemetry.js"(){"use strict";l8d=new Set(["textDelta","thinkingDelta","thinkingCompleted","partialToolCall","toolCallStarted","toolCallCompleted","userMessageAppended","turnEnded"]),G$i=2e3,oao=15e3,aao=15e3,u8d=6e4,d8d=30,h8d=6e4,IUt=new Map,AUt=[]}});function cao(e){return f8d(e).endsWith(_8d)}function m8d(e){const t=f8d(e);return t===v8d||t===b8d}function g8d(e){const t=[e.filename,e.fullPath,e.rule?.fullPath].filter(i=>i!==void 0&&i.length>0);return t.some(i=>cao(i))?!0:t.some(i=>!m8d(i))?!1:(t.length>0?t:[e.name??""]).some(i=>m8d(i)||cao(i))}function f8d(e){return e.trim().replaceAll("\\","/")}var v8d,b8d,_8d,qzf=
