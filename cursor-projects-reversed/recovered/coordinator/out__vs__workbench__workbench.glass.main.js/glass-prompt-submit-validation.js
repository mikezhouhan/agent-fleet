// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: glass-prompt-submit-validation.js
// byteRange: [27330716, 27331198)
// beautified: false
// truncated: false
O({"glass-prompt-submit-validation.js"(){"use strict"}});function Fn0(t){const e=t.promptInputForceSubmit===!0;if(t.isProjectCoordinator&&t.projectsPreferInterrupt)return!e;switch(t.queueDefaultBehavior){case"stop-and-send":return!e;case"queue":case"send":case"steer":return!1}return e}function p1l(t){const e=t===!0;return{altKey:!1,ctrlKey:e&&!dr,metaKey:e&&dr,shiftKey:!1}}function Bn0(t){return!t.hasPendingMigration&&t.queueRuntimeActive&&!t.forceSubmit?"queue":"send"}var h8g=
