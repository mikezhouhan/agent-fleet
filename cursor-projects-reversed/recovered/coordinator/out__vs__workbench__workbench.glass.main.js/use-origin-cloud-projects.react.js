// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-origin-cloud-projects.react.js
// byteRange: [28729273, 28730393)
// beautified: false
// truncated: false
O({"use-origin-cloud-projects.react.js"(){"use strict";iqe(),QJg=[]}});import{c as G20}from"./react-runtime/react/esm-compiler-runtime-production.js";function ZJg(t,e){if(t.size!==e.size)return!1;for(const[n,i]of t)if(!e.has(n)||e.get(n)!==i)return!1;return!0}function q20(t,e){if(t.size!==e.size)return!1;for(const n of t)if(!e.has(n))return!1;return!0}function Hxl(t,e){const n=G20(5),i=Ze(Lg);let r;n[0]!==t||n[1]!==i?(r=()=>t(i),n[0]=t,n[1]=i,n[2]=r):r=n[2];const s=r;let o;return n[3]!==e?(o={isEqual:e},n[3]=e,n[4]=o):o=n[4],kb(i.onDidChangeMetadata,s,o)}function V20(t){const e=new Map;for(const n of t.getAllMetadata())n.displayPath&&e.set(n.workspaceId,n.displayPath);return e.size>0?e:zxl}function K20(t){const e=new Map;for(const n of t.getAllMetadata()){const i=d3a(n)??n.worktreeInfo?.spawnedFromRepo;i&&e.set(n.workspaceId,i)}return e.size>0?e:zxl}function Y20(t){const e=new Set;for(const n of t.getAllMetadata())n.trackedGitRepos.length>0&&e.add(n.workspaceId);return e.size>0?e:tef}function Tfs(){return Hxl(V20,ZJg)}function JJg(){return Hxl(K20,ZJg)}function eef(){return Hxl(Y20,q20)}var zxl,tef,kRn=
