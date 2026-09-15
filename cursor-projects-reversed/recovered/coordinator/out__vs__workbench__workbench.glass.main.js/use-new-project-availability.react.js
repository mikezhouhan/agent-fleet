// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: use-new-project-availability.react.js
// byteRange: [28701012, 28701981)
// beautified: false
// truncated: false
O({"use-new-project-availability.react.js"(){"use strict";cm(),Ks(),gTi(),xCt(),PC(),Kc(),ex(),iqe(),kn(),Ixl=new Map}});async function ffs({uri:t,displayPath:e,fileService:n,gitContextService:i,workspacesService:r}){let s;try{const a=await n.stat(t);s={isDirectory:a.isDirectory,isFile:a.isFile}}catch(a){if(TEe(a)!==fg.FileNotFound)return{ok:!1,kind:"error",step:"stat",message:`Couldn't access ${e}.`}}if(s?.isFile)return{ok:!1,kind:"pathIsFile"};if(!s?.isDirectory)try{await n.createFolder(t)}catch{return{ok:!1,kind:"error",step:"createFolder",message:`Couldn't create folder at ${e}.`}}try{await i.executeGitCommand(t.fsPath,["init"],{caller:"createLocalWorkspaceProject"})}catch{return{ok:!1,kind:"error",step:"gitInit",message:`\`git init\` failed in ${e}.`}}let o;try{o=await r.getSingleFolderWorkspaceIdentifier(t)}catch{o=void 0}return o?{ok:!0,project:Qw(o)}:{ok:!1,kind:"error",step:"resolveWorkspace",message:`Couldn't open ${e} as a workspace.`}}var bJg=
