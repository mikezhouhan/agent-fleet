// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: localAgentGatewayConfiguration.js
// byteRange: [18581699, 18583015)
// beautified: false
// truncated: false
j({"localAgentGatewayConfiguration.js"(){"use strict";Tu(),g$i(),b$i="https://api.openai.com/v1",U6d=new Map([[3294798,{baseUrl:"https://inference.tesla.com",headersSpec:"X-Cost-Tags: repo={gitOrgRepo},branch={gitBranch},tool=cursor",defaultAgentRunMode:"allowlist_without_sandbox",extraText:{text:"Find my personal token:",link:{label:"https://tokens.bottlerocket.tesla.com/personal-tokens/",url:"https://tokens.bottlerocket.tesla.com/personal-tokens/"}}}]]),$6d="Base URL and API Key are required.",ioo="Connect Cursor to a compatible LLM Gateway or API when in local mode. Can also set via CURSOR_LOCAL_AGENT_BASE_URL, CURSOR_LOCAL_AGENT_API_KEY, and CURSOR_LOCAL_AGENT_HEADERS."}});function lVf(e){const t=e.headersEnv!==void 0?e.headersEnv:CDn(e.teamId)?.headersSpec;return t===void 0||t===""?{}:YAm(t,{gitOrgRepo:e.gitOrgRepo,gitBranch:e.gitBranch})}async function W6d(e){try{return lVf({headersEnv:e.shellEnvironment[mMc],teamId:e.teamId,...await uVf(e)})}catch{return{}}}async function uVf(e){const t=e.workspaceContextService.getWorkspace(),n=t.folders[0],i=e.workspaceMetadataService.getMetadata(IS(t)),r=wpn(tBf(i))??"",s=n===void 0?void 0:EP(n.uri,!0,e.environmentService.remoteAuthority!==void 0),o=await e.gitContextService.getOrFetchCurrentBranch({cwd:s})??"";return{gitOrgRepo:r,gitBranch:o}}var H6d=
