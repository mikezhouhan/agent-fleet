// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: mcpOutputChannelDescriptor.js
// byteRange: [18697668, 18698579)
// beautified: false
// truncated: false
O({"mcpOutputChannelDescriptor.js"(){"use strict";Egi(),QP(),lKp="MCP Process",cKp="mcp",nNa="mcpprocess"}});async function uKp(t){const{server:e,mcpService:n,instantiationService:i,commandService:r,isGlass:s}=t;try{await i.invokeFunction(async o=>{const a=o.get(TC),l=t.workspaceId??o.get(fr).getWorkspace().id,c=a.getChannelDescriptors(),u=TdS(c,{serverIdentifier:e.identifier,useSharedProcessOutput:n.shouldUseMcpProcessOutput(e),workspaceId:l});if(u){if(s){await r.executeCommand(t.glassRevealAsTab===!0?hKp:dKp,{outputChannelId:u}),t.onDidShowGlassChannel?.();return}await a.showChannel(u);return}await r.executeCommand("workbench.action.showOutputChannels")})}catch(o){i.invokeFunction(a=>{a.get(Di).error("[MCP] Failed to open MCP server output channel; falling back to the Output picker",o instanceof Error?o.message:String(o))}),r.executeCommand("workbench.action.showOutputChannels")}}var dKp,hKp,pKp=
