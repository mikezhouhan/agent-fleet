// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpConnectFlow.js
// byteRange: [18694910, 18695529)
// beautified: false
// truncated: false
O({"mcpConnectFlow.js"(){"use strict";Qs(),XVp(),cdS(),QVp=3e4,ZVp=12e4,JVp=200}});function pdS(t){const e=new Set;return n=>{n.outcome!=="cancelled"&&(e.has(n.source)||(e.add(n.source),t(n)))}}function mdS(t){const{event:e,metricsService:n,agentKind:i}=t,r={menu:"slash",source:e.source,outcome:e.outcome,agent_kind:i};n.increment({stat:"renderer.composer.menu_source_hydration.completed",value:1,tags:r}),n.distribution({stat:"renderer.composer.menu_source_hydration.duration_ms",value:e.durationMs,tags:r}),n.distribution({stat:"renderer.composer.menu_source_hydration.item_count",value:e.itemCount,tags:r})}var gdS=
