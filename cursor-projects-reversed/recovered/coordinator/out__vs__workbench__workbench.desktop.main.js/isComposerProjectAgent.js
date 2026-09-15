// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: isComposerProjectAgent.js
// byteRange: [17583470, 17584052)
// beautified: false
// truncated: false
j({"isComposerProjectAgent.js"(){"use strict"}});function sMd(e,t){return e?.isProject===!0&&!e.subagentParentId?.trim()&&!e.cloudSubagentParent?.parentAgentId?.trim()&&t!==void 0&&R7t(t)}function P6f({cloudAgent:e,composer:t,isUserFollowup:n,isTransportEligible:i,isProjectSteeringEnabled:r,preferSteerForUserFollowup:s=!1}){const o=sMd(e,t);return!n||!o&&!s||!i()?!1:o&&r()||s}function L6f({legacyBehavior:e,composer:t,isRemote:n,isProjectSteeringEnabled:i,isSteeringAvailable:r}){return t!==void 0&&R7t(t)&&!Oke(t)&&!n&&r()&&i()?"steer":e==="steer"?r()?"steer":"queue":e}var oMd=
