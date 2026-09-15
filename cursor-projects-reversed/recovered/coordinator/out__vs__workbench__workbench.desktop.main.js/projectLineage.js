// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: projectLineage.js
// byteRange: [18347659, 18348262)
// beautified: false
// truncated: false
j({"projectLineage.js"(){"use strict";xh()}});function EFd(e){return(e.parentComposer?.isProject===!0?e.parentConversationId:u_t({composer:e.parentComposer,getComposer:e.getComposer}))===void 0?"agent":"project"}function xFd(e){return Number.isFinite(e)?Math.round(Math.min(e,RFd)):0}function aDn(e,t){e.distribution({stat:IFd,value:xFd(t.durationMs),tags:{phase:t.phase,surface_kind:t.surfaceKind,outcome:t.outcome}})}function Uro(e,t){e.distribution({stat:AFd,value:xFd(t.durationMs),tags:{phase:t.phase,mode:t.mode,surface_kind:t.surfaceKind,outcome:t.outcome,owner:"renderer"}})}var IFd,AFd,RFd,DFd=
