// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: isComposerProjectAgent.js
// byteRange: [18792142, 18792724)
// beautified: false
// truncated: false
O({"isComposerProjectAgent.js"(){"use strict"}});function GYp(t,e){return t?.isProject===!0&&!t.subagentParentId?.trim()&&!t.cloudSubagentParent?.parentAgentId?.trim()&&e!==void 0&&k1n(e)}function qhS({cloudAgent:t,composer:e,isUserFollowup:n,isTransportEligible:i,isProjectSteeringEnabled:r,preferSteerForUserFollowup:s=!1}){const o=GYp(t,e);return!n||!o&&!s||!i()?!1:o&&r()||s}function VhS({legacyBehavior:t,composer:e,isRemote:n,isProjectSteeringEnabled:i,isSteeringAvailable:r}){return e!==void 0&&k1n(e)&&!A0e(e)&&!n&&r()&&i()?"steer":t==="steer"?r()?"steer":"queue":t}var qYp=
