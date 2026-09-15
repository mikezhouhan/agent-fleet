// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpConnectFlow.js
// byteRange: [17491564, 17492183)
// beautified: false
// truncated: false
j({"mcpConnectFlow.js"(){"use strict";oo(),nRd(),r5f(),iRd=3e4,rRd=12e4,sRd=200}});function c5f(e){const t=new Set;return n=>{n.outcome!=="cancelled"&&(t.has(n.source)||(t.add(n.source),e(n)))}}function l5f(e){const{event:t,metricsService:n,agentKind:i}=e,r={menu:"slash",source:t.source,outcome:t.outcome,agent_kind:i};n.increment({stat:"renderer.composer.menu_source_hydration.completed",value:1,tags:r}),n.distribution({stat:"renderer.composer.menu_source_hydration.duration_ms",value:t.durationMs,tags:r}),n.distribution({stat:"renderer.composer.menu_source_hydration.item_count",value:t.itemCount,tags:r})}var u5f=
