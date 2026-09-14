// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: localAgentGatewayConfiguration.js
// byteRange: [19834395, 19835711)
// beautified: false
// truncated: false
O({"localAgentGatewayConfiguration.js"(){"use strict";xu(),rHr(),w0n="https://api.openai.com/v1",mom=new Map([[3294798,{baseUrl:"https://inference.tesla.com",headersSpec:"X-Cost-Tags: repo={gitOrgRepo},branch={gitBranch},tool=cursor",defaultAgentRunMode:"allowlist_without_sandbox",extraText:{text:"Find my personal token:",link:{label:"https://tokens.bottlerocket.tesla.com/personal-tokens/",url:"https://tokens.bottlerocket.tesla.com/personal-tokens/"}}}]]),gom="Base URL and API Key are required.",cHr="Connect Cursor to a compatible LLM Gateway or API when in local mode. Can also set via CURSOR_LOCAL_AGENT_BASE_URL, CURSOR_LOCAL_AGENT_API_KEY, and CURSOR_LOCAL_AGENT_HEADERS."}});function n1S(t){const e=t.headersEnv!==void 0?t.headersEnv:S0n(t.teamId)?.headersSpec;return e===void 0||e===""?{}:sNb(e,{gitOrgRepo:t.gitOrgRepo,gitBranch:t.gitBranch})}async function fom(t){try{return n1S({headersEnv:t.shellEnvironment[$0u],teamId:t.teamId,...await i1S(t)})}catch{return{}}}async function i1S(t){const e=t.workspaceContextService.getWorkspace(),n=e.folders[0],i=t.workspaceMetadataService.getMetadata(Wk(e)),r=pmt(d3a(i))??"",s=n===void 0?void 0:OM(n.uri,!0,t.environmentService.remoteAuthority!==void 0),o=await t.gitContextService.getOrFetchCurrentBranch({cwd:s})??"";return{gitOrgRepo:r,gitBranch:o}}var vom=
