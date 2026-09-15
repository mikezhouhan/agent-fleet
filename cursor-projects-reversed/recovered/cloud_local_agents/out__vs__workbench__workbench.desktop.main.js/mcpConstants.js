// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: mcpConstants.js
// byteRange: [15801153, 15802269)
// beautified: false
// truncated: false
j({"mcpConstants.js"(){"use strict";Zed(),Svt="cursor-browser-extension",wvt="cursor-ide-browser",kie="cursor-ide-browser",gV="cursor-browser-extension",ABi="cursor-app-control",xjs="cursor-subscriptions",Qed="cursor-dev-control",Jed="fsd",etd="suggestions",ttd="cursor-computer-use",ntd=[wvt],itd="vs/workbench/services/ai/browser/media/cursor_blame_logo.svg",Ijs=new Set([ABi,xBi,xjs,Qed,Jed,etd,kie,gV,ttd])}});function r6e(e){return(e==="playwright"?"editor":e)??"editor"}function mwf(e){return e.dashboardManaged===!0||e.pluginManaged===!0||e.type==="streamableHttp"&&Jzr({identifier:e.identifier,serverUrl:e.url})}function Bke(e){return e.dashboardManaged?"dashboard":e.projectManaged?"project":e.pluginManaged?"plugin":e.extensionId?"extension":"user"}function rtd(e){return e.identifier===kie||e.identifier===gV}function std(e){return e.identifier===ABi}function otd(e){return e.identifier===xBi}function gwf(e){function t(i){return!(rtd(i)||otd(i)||i.identifier===xjs||e&&std(i))}function n(i){return t(i)&&i.dashboardManaged!==!0&&i.pluginManaged!==!0}return{isVisibleServer:t,isRegularServer:n}}var eE,ZP=
