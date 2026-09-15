// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: worktree.js
// byteRange: [16793713, 16794450)
// beautified: false
// truncated: false
O({"worktree.js"(){"use strict";_t(),Yc(),i4r=4,o0p=class extends Error{constructor(t="No changes to apply"){super(t),this.name="NoChangesToApplyError"}},q0a=class{constructor(t,e){this.currentLock=t,this.releaseLock=e,this._isDisposed=!1}dispose(){this._isDisposed||(this._isDisposed=!0,this.releaseLock())}[Symbol.dispose](){this.dispose()}},V0a=class extends Error{constructor(t="Worktree operation canceled"){super(t),this.name="WorktreeOperationCanceledError"}},r4r=class extends Error{constructor(t,e){const n=e?` at ${e}`:" in another checkout";super(`Branch "${t}" is already checked out${n}.`),this.branchName=t,this.checkoutPath=e,this.name="WorktreeBranchAlreadyCheckedOutError"}},jL=In("worktreeManagerService")}}),H0,K0a,$2=
