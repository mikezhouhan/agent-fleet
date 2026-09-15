// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: ProjectDatabasePlugin.js
// byteRange: [26260011, 26260396)
// beautified: false
// truncated: false
O({"ProjectDatabasePlugin.js"(){"use strict";uxg(),uxg()}});function _F1(t,e){const n=URL.parse(t);if(n){const r=Ve.parse(n.toString());return r.scheme===It.file||r.scheme===It.vscodeRemote?rp.uriToBrowserUri(r).toString(!0):t}if(t.startsWith("//"))return`${It.https}:${t}`;const i=URL.parse(t,e.toString(!0));return i?rp.uriToBrowserUri(Ve.parse(i.toString())).toString(!0):t}var yF1=
