// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptFindTypes.js
// byteRange: [21558825, 21559835)
// beautified: false
// truncated: false
O({"composerTranscriptFindTypes.js"(){"use strict";Ft(),Xe(),Vwn(),VSm=64,H$t=5e3,kVr="message",KSm="tool",YSm="data-composer-find-target",Nja=".virtualized-composer-messages-scroll-container",Lja=`[${YSm}="${KSm}"]`,XSm=`${Nja}, ${Lja}`}});function APS(t){const e=QSm(),n=t.registry===void 0&&e===void 0,i=t.registry??e??qSm();return n&&Tn(()=>i.dispose()),me(CVr.Provider,{value:i,get children(){return t.children}})}function RPS(){const t=l0(CVr);if(t===void 0)throw new Error("useComposerTranscriptFindRegistry must be used within ComposerTranscriptFindRegistryProvider.");return t}function QSm(){return l0(CVr)}function PPS(t){const e=QSm();if(e===void 0)return;let n=nt.None;vc(()=>{n=e.register(t)});const i=Jd();i.set(TVr,e.isSearchActive());const r=sa(i,TVr),s=a=>{i.set(TVr,a)},o=e.onDidChangeSearchActive(s);Tn(()=>o.dispose()),fn(Sb(()=>r()?t.getUnits():void 0,(a,l)=>{a!==void 0&&l!==void 0&&e.notifyScopeChanged(t.scopeId)})),Tn(()=>n.dispose())}function MPS(){return l0(ZSm)}var CVr,ZSm,TVr,Oja=
