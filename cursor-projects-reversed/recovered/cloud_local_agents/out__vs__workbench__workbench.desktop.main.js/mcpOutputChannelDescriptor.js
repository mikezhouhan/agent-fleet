// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpOutputChannelDescriptor.js
// byteRange: [17494318, 17495229)
// beautified: false
// truncated: false
j({"mcpOutputChannelDescriptor.js"(){"use strict";KAn(),qE(),hRd="MCP Process",pRd="mcp",Meo="mcpprocess"}});async function mRd(e){const{server:t,mcpService:n,instantiationService:i,commandService:r,isGlass:s}=e;try{await i.invokeFunction(async o=>{const a=o.get(KS),c=e.workspaceId??o.get(Gn).getWorkspace().id,l=a.getChannelDescriptors(),u=y5f(l,{serverIdentifier:t.identifier,useSharedProcessOutput:n.shouldUseMcpProcessOutput(t),workspaceId:c});if(u){if(s){await r.executeCommand(e.glassRevealAsTab===!0?fRd:gRd,{outputChannelId:u}),e.onDidShowGlassChannel?.();return}await a.showChannel(u);return}await r.executeCommand("workbench.action.showOutputChannels")})}catch(o){i.invokeFunction(a=>{a.get(Fn).error("[MCP] Failed to open MCP server output channel; falling back to the Output picker",o instanceof Error?o.message:String(o))}),r.executeCommand("workbench.action.showOutputChannels")}}var gRd,fRd,vRd=
