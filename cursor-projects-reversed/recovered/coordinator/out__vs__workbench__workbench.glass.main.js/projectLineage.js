// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectLineage.js
// byteRange: [19599739, 19600342)
// beautified: false
// truncated: false
O({"projectLineage.js"(){"use strict";Yc()}});function tim(t){return(t.parentComposer?.isProject===!0?t.parentConversationId:Gjt({composer:t.parentComposer,getComposer:t.getComposer}))===void 0?"agent":"project"}function nim(t){return Number.isFinite(t)?Math.round(Math.min(t,sim)):0}function Vfi(t,e){t.distribution({stat:iim,value:nim(e.durationMs),tags:{phase:e.phase,surface_kind:e.surfaceKind,outcome:e.outcome}})}function $Fa(t,e){t.distribution({stat:rim,value:nim(e.durationMs),tags:{phase:e.phase,mode:e.mode,surface_kind:e.surfaceKind,outcome:e.outcome,owner:"renderer"}})}var iim,rim,sim,oim=
