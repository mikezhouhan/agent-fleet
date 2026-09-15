// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: projectFollowupSteeringPolicy.js
// byteRange: [17584052, 17584841)
// beautified: false
// truncated: false
j({"projectFollowupSteeringPolicy.js"(){"use strict";bT(),Mbt()}});function Sto({newMessageBehavior:e,manualSendBehavior:t,isAlternate:n}){switch(e){case"stop-and-send":case"steer":return{behavior:n?"queue":e,isAlternate:n};case"send":case"queue":return{behavior:n?t==="steer"?"steer":"stop-and-send":"queue",isAlternate:n};default:return{behavior:n?"stop-and-send":"queue",isAlternate:n}}}function aMd({newMessageBehavior:e,manualSendBehavior:t,isAlternate:n,projectSteeringSuppressed:i,isSimulatedSubmission:r,isSteeringAvailable:s,preferSteerForPrimary:o,mustPreserveQueue:a}){let{behavior:c}=Sto({newMessageBehavior:e,manualSendBehavior:t,isAlternate:n});return!n&&o&&(c="steer"),n&&i&&(c="queue"),r&&(c="queue"),c==="steer"&&!s&&(c=n?"stop-and-send":"queue"),a&&(c="queue"),c}var cMd=
