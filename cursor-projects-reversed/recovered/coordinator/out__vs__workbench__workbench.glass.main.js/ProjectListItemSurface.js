// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: ProjectListItemSurface.js
// byteRange: [13990649, 13991945)
// beautified: false
// truncated: false
O({"ProjectListItemSurface.js"(){"use strict";Ja(),Ixh={"ui--default-marker":"ui--default-marker",$$css:!0},ivn=14,uPr={root:{kVAEAm:"ui-1n2onr6",k1xSpc:"ui-78zum5",kUk6DE:"ui-12lumcd",k7Eaqz:"ui-euugli",kAzted:"ui-phwom3",km5ZXQ:"ui-qr9sye",koQZXg:"ui-1yywrm5",kpe85a:"ui-1f2e1fj",kE3dHu:"ui-1t7xhzw",k9WMMc:"ui-dpxx8g",kMwMTN:"ui-1wd3ewq",khDVqt:"ui-uxw1ft",kXHlph:"ui-6ikm8r",kORKVm:"ui-10wlt62",kaIpWk:"ui-1m7fhj7",kWkggS:"ui-jbqb8w",kMeerF:"ui-1k57tk5",$$css:!0},interactive:{kWkggS:"ui-jbqb8w ui-qjnua1 ui-10co6l2",kkrTdU:"ui-1ypdohk",$$css:!0},selected:{kWkggS:"ui-i07v4r ui-1iuyybk ui-19wsfbc",$$css:!0}}}});function ify(t){if(typeof t!="object"||t===null||!("key"in t))return;const e=Reflect.get(t,"key");return typeof e=="string"?e:void 0}function rfy(t){const e=t.state.plugins,n=e.findIndex(s=>ify(s.spec.key)?.startsWith("history$"));if(n<0)return;const i=e[n],r=i.spec.key;r&&(t.unregisterPlugin(r),t.registerPlugin(i,(s,o)=>{const a=[...o];return a.splice(n,0,s),a}))}function e0e(t,e,n={}){const i=t.chain().setContent(e,n).command(({tr:r})=>(r.setSelection(VS.atEnd(r.doc)),!0)).setMeta("addToHistory",!1).run();return i&&rfy(t),i}function foa(t,e,n={}){t.view.dispatch(v$e(t.state.tr));const i=t.commands.setContent(e,n);return i&&t.view.dispatch(v$e(t.state.tr)),i}var iai,Axh=
