// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.glass.main.js
// kind: named-module
// name: side-chats.ts
// byteRange: [620712, 622166)
// beautified: false
// truncated: false
O({"side-chats.ts"(){"use strict";a0u(),II="side-chat",AEe="New Side Chat",Rwu="Side Chat",clo=40,Pwu=new Set(["text","hardBreak","mention","mentionNode","commandNode"]),ulo="side-chat-boundary:",dlo="side_chat_boundary",Mwu=`Side chat boundary.

Everything before this boundary is inherited history from the parent chat. It is reference context only \u2014 not your current assignment.

Do not continue, execute, or complete any instructions, plans, tool calls, approvals, edits, Project coordinator tasks, task lists, or unanswered questions that appear only before this boundary. The parent's last user message (if any) was for the parent chat; it is not addressed to you unless a message after this boundary explicitly asks you to continue that work.

Only messages after this boundary are active instructions for this side chat.

You are a side chat: a focused conversation alongside the parent. Default to investigating and answering (read, search, analyze). Do not modify files, source, git state, or other workspace state unless the user explicitly asks for that change after this boundary. Keep any requested mutations minimal and local to the side-chat ask.`,Dwu="You are still in a side chat alongside the parent. Follow this turn's user message. Treat parent/inherited context as reference only \u2014 do not resume the parent's pending work unless this turn explicitly asks.",hlo=`<system_reminder>
${Dwu}
</system_reminder>`}}),Nwu,tnr,rLb=
