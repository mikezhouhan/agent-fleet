// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: ProjectDatabaseDocument.js
// byteRange: [12338772, 12339740)
// beautified: false
// truncated: false
j({"ProjectDatabaseDocument.js"(){"use strict";r5l=256*1024,cB=Object.freeze({tasks:256,properties:32,optionsPerProperty:64,blockedByReferencesPerTask:32,propertyValuesPerTask:32,multiSelectValuesPerProperty:64,projectTitleCharacters:512,projectDescriptionCharacters:8*1024,propertyNameCharacters:256,optionLabelCharacters:256,taskSubtitleCharacters:2*1024,taskBodyCharacters:16*1024,textPropertyValueCharacters:4*1024})}});function HVg(e){if(typeof e!="object"||e===null||!("key"in e))return;const t=Reflect.get(e,"key");return typeof t=="string"?t:void 0}function jVg(e){const t=e.state.plugins,n=t.findIndex(s=>HVg(s.spec.key)?.startsWith("history$"));if(n<0)return;const i=t[n],r=i.spec.key;r&&(e.unregisterPlugin(r),e.registerPlugin(i,(s,o)=>{const a=[...o];return a.splice(n,0,s),a}))}function s5l(e,t,n={}){const i=e.chain().setContent(t,n).command(({tr:r})=>(r.setSelection(g_.atEnd(r.doc)),!0)).setMeta("addToHistory",!1).run();return i&&jVg(e),i}var o5l,a5l=
