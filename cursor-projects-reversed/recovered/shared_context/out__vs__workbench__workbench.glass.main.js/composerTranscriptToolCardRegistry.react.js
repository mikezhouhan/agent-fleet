// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: composerTranscriptToolCardRegistry.react.js
// byteRange: [24943593, 24944324)
// beautified: false
// truncated: false
O({"composerTranscriptToolCardRegistry.react.js"(){"use strict";q11(),J11(),Z01(),cw1(),Tw1(),Pw1(),jw1(),Lk1()}});async function Vpg(t,e,n){const i=e.composerId,r=e.data.createdFromBackgroundAgent?.bcId;if(t.analyticsService.trackEvent("review_changes.opened",{entrypoint:"end_of_turn_summary",composer_id:i}),t.workbenchEnvironmentService.isGlass===!0){if(n?.useLastTurnScope===!0){await t.commandService.executeCommand(Lgi,n.filePath!==void 0?{scope:"lastTurn",filePath:n.filePath}:{scope:"lastTurn"});return}const s=r!==void 0;await t.commandService.executeCommand(Lgi,s?{scope:"committed"}:void 0);return}await t.reviewChangesService.openOrUpdateReviewChangesEditor(i,r!==void 0?{fromBackgroundAgent:{bcId:r}}:void 0)}var jk1=
