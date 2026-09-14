// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: projectFollowupSteeringPolicy.js
// byteRange: [18792724, 18793513)
// beautified: false
// truncated: false
O({"projectFollowupSteeringPolicy.js"(){"use strict";fy(),fjt()}});function nLa({newMessageBehavior:t,manualSendBehavior:e,isAlternate:n}){switch(t){case"stop-and-send":case"steer":return{behavior:n?"queue":t,isAlternate:n};case"send":case"queue":return{behavior:n?e==="steer"?"steer":"stop-and-send":"queue",isAlternate:n};default:return{behavior:n?"stop-and-send":"queue",isAlternate:n}}}function VYp({newMessageBehavior:t,manualSendBehavior:e,isAlternate:n,projectSteeringSuppressed:i,isSimulatedSubmission:r,isSteeringAvailable:s,preferSteerForPrimary:o,mustPreserveQueue:a}){let{behavior:l}=nLa({newMessageBehavior:t,manualSendBehavior:e,isAlternate:n});return!n&&o&&(l="steer"),n&&i&&(l="queue"),r&&(l="queue"),l==="steer"&&!s&&(l=n?"stop-and-send":"queue"),a&&(l="queue"),l}var KYp=
