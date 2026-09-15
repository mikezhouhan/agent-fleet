// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: project-selector-menu-session.js
// byteRange: [28898719, 28900013)
// beautified: false
// truncated: false
O({"project-selector-menu-session.js"(){"use strict"}});import{useEffect as n30,useRef as i30,useState as r30}from"./react-runtime/react/esm-index-production.js";function s30(t){const e=t.trim();return e.length===0||xa&&(e.startsWith("\\\\")||e.startsWith("//"))?!1:!!(e.startsWith("/")||e.startsWith("~/")||e==="~"||/^[a-zA-Z]:[/\\]/.test(e))}function o30(t){const e=Ze(Of),n=Ze(v4),i=XHt(),[r,s]=r30({status:"idle"}),o=i30(null),a=Ebe(Mtf),l=t.trim(),c=s30(l);return n30(()=>{if(o.current?.abort(),o.current=null,!c){a.cancel(),s({status:"idle"});return}s({status:"checking"});const u=new AbortController;return o.current=u,a.trigger(()=>{(async()=>{try{const d=i?vXn(l,i):l,h=Ve.file(d);if(xa&&h.authority){s({status:"no-match"});return}let p;try{p=await e.stat(h)}catch(_){if(u.signal.aborted)return;TEe(_)===fg.FileNotFound?s({status:"creatable",creatable:{uri:h,displayPath:d}}):s({status:"no-match"});return}if(u.signal.aborted)return;if(!p.isDirectory){s({status:"no-match"});return}const g=await n.getSingleFolderWorkspaceIdentifier(h);if(u.signal.aborted)return;if(!g){s({status:"no-match"});return}const v=Qw(g),b=sM(v);s({status:"matched",match:{project:v,target:b,displayPath:d}})}catch{u.signal.aborted||s({status:"no-match"})}})()}),()=>{u.abort()}},[l,c,e,n,i,a]),r}var Mtf,a30=
