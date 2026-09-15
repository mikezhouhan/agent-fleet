// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-project-section-switch-timing.react.js
// byteRange: [26978403, 26979380)
// beautified: false
// truncated: false
O({"use-project-section-switch-timing.react.js"(){"use strict";Qs(),Q2(),Xe(),AY1()}});function zOg(t){let e=!1;return t.split(`
`).map(n=>KOg.test(n)?(e=!e,n):e?n:n.replace(VOg,"")).join(`
`).trim()}function LY1(t){const e=L1t(t.replace(YOg,"")).body,n=GOg.exec(e),i=n?.[1],r=i?.trim();return!n||!i||!r||qOg.test(i)?{tldr:void 0,remainder:zOg(e)}:{tldr:r,remainder:zOg(e.slice(n[0].length))}}function OY1(t){if(t===void 0||ku(t.path)!==qTi)return;const{description:e}=L1t(t.markdown).frontmatter;return typeof e=="string"&&e.trim()||void 0}async function FY1(t,e){try{if((await t.stat(e)).isSymbolicLink)return;const i=(await t.readFile(e)).value.toString().trim();return i?{markdown:i,path:e.fsPath}:void 0}catch(n){if(n instanceof Error&&VD(n)===1)return;throw n}}async function BY1(t){for(const e of[qTi,Mds]){const n=await FY1(t.fileService,t.workspaceContextService.resolveRelativePath(hk(t.agentScopePath,e)));if(n!==void 0)return n}}var qTi,Mds,GOg,qOg,VOg,KOg,YOg,Dds=
