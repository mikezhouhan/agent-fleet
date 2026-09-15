// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: internalMcpToolDisplayResolver.js
// byteRange: [25334964, 25335638)
// beautified: false
// truncated: false
O({"internalMcpToolDisplayResolver.js"(){"use strict";Rem(),zss()}});function jT1(t,e){const n=l=>{const c=l.toLowerCase(),u=t.allServers(),d=u.filter(p=>p.name.toLowerCase()===c);return d.length>1?{server:void 0,ambiguous:!0}:{server:d[0]??u.find(p=>p.identifier.toLowerCase()===c),ambiguous:!1}},i=new Set,r=()=>{for(const l of i)l()};fn(()=>{t.allServers(),r()});const s=e.onDidResolveIcons(r);return Tn(()=>s.dispose()),{mcpServerIconStore:{getIcon:l=>e.getServerIcon(l),subscribe:(l,c)=>(i.add(c),()=>{i.delete(c)})},resolveMcpToolTitle:(l,c)=>{const{server:u}=n(l);return u?t.toolsCache()[u.identifier]?.find(h=>h.name===c||h.originalName===c)?.title:void 0}}}var $T1=
