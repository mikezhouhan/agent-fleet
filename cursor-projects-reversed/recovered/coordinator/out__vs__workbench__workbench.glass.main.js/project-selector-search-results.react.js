// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-selector-search-results.react.js
// byteRange: [28897698, 28898278)
// beautified: false
// truncated: false
O({"project-selector-search-results.react.js"(){"use strict";Pt(),ARn(),_Il(),e$(),Tae(),oqe(),qoe(),eI()}});import{useCallback as JD0}from"./react-runtime/react/esm-index-production.js";function wIi(t){const e=Ze(H0),n=Ze(U2e),i=au(n.busy),r=Ua(JGt),s=JD0(async()=>{if(t.onStarted?.(),r){await n.startGithubConnectFlow({source:t.source,githubRepo:t.githubRepo,gheApplication:t.gheApplication,forceOauth:t.forceOauth});return}await e.openGithubConnectUrl()},[e,r,n,t.forceOauth,t.gheApplication,t.githubRepo,t.onStarted,t.source]);return{busy:i,directEnabled:r,connect:s}}var kIi=
