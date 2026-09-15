// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: get_mcp_tools_tool_pb.js
// byteRange: [13906509, 13907398)
// beautified: false
// truncated: false
j({"get_mcp_tools_tool_pb.js"(){"use strict";Ni(),W2s=T.makeMessageType("agent.v1.GetMcpToolsArgs",()=>[{no:1,name:"server",kind:"scalar",T:9,opt:!0},{no:2,name:"tool_name",kind:"scalar",T:9,opt:!0},{no:3,name:"pattern",kind:"scalar",T:9,opt:!0},{no:4,name:"tool_call_id",kind:"scalar",T:9}]),OQl=T.makeMessageType("agent.v1.GetMcpToolsAgentResult",()=>[{no:1,name:"success",kind:"message",T:FQl,oneof:"result"},{no:2,name:"error",kind:"message",T:BQl,oneof:"result"}]),FQl=T.makeMessageType("agent.v1.GetMcpToolsSuccess",()=>[{no:1,name:"content",kind:"scalar",T:9},{no:2,name:"output_file_path",kind:"scalar",T:9,opt:!0}]),BQl=T.makeMessageType("agent.v1.GetMcpToolsError",()=>[{no:1,name:"error",kind:"scalar",T:9}]),H2s=T.makeMessageType("agent.v1.GetMcpToolsToolCall",()=>[{no:1,name:"args",kind:"message",T:W2s},{no:2,name:"result",kind:"message",T:OQl}])}}),$Ql,WQl,HQl,jQl,VQl,$af=
