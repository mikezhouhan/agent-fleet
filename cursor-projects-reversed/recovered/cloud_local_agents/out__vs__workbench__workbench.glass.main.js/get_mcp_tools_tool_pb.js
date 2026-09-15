// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: get_mcp_tools_tool_pb.js
// byteRange: [1428108, 1428997)
// beautified: false
// truncated: false
O({"get_mcp_tools_tool_pb.js"(){"use strict";Mr(),E_o=M.makeMessageType("agent.v1.GetMcpToolsArgs",()=>[{no:1,name:"server",kind:"scalar",T:9,opt:!0},{no:2,name:"tool_name",kind:"scalar",T:9,opt:!0},{no:3,name:"pattern",kind:"scalar",T:9,opt:!0},{no:4,name:"tool_call_id",kind:"scalar",T:9}]),cNu=M.makeMessageType("agent.v1.GetMcpToolsAgentResult",()=>[{no:1,name:"success",kind:"message",T:uNu,oneof:"result"},{no:2,name:"error",kind:"message",T:dNu,oneof:"result"}]),uNu=M.makeMessageType("agent.v1.GetMcpToolsSuccess",()=>[{no:1,name:"content",kind:"scalar",T:9},{no:2,name:"output_file_path",kind:"scalar",T:9,opt:!0}]),dNu=M.makeMessageType("agent.v1.GetMcpToolsError",()=>[{no:1,name:"error",kind:"scalar",T:9}]),x_o=M.makeMessageType("agent.v1.GetMcpToolsToolCall",()=>[{no:1,name:"args",kind:"message",T:E_o},{no:2,name:"result",kind:"message",T:cNu}])}}),pNu,mNu,gNu,fNu,vNu,_4b=
