// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: worktree.js
// byteRange: [15691129, 15691867)
// beautified: false
// truncated: false
j({"worktree.js"(){"use strict";qe(),xh(),sBi=4,RXu=class extends Error{constructor(e="No changes to apply"){super(e),this.name="NoChangesToApplyError"}},bHs=class{constructor(e,t){this.currentLock=e,this.releaseLock=t,this._isDisposed=!1}dispose(){this._isDisposed||(this._isDisposed=!0,this.releaseLock())}[Symbol.dispose](){this.dispose()}},_Hs=class extends Error{constructor(e="Worktree operation canceled"){super(e),this.name="WorktreeOperationCanceledError"}},oBi=class extends Error{constructor(e,t){const n=t?` at ${t}`:" in another checkout";super(`Branch "${e}" is already checked out${n}.`),this.branchName=e,this.checkoutPath=t,this.name="WorktreeBranchAlreadyCheckedOutError"}},wie=un("worktreeManagerService")}}),IC,yHs,XP=
