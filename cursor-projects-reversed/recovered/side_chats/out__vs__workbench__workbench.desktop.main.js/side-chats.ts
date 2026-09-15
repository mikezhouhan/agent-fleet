// Recovered Cursor Projects client unit. Not original TypeScript.
// shippedPath: out/vs/workbench/workbench.desktop.main.js
// kind: named-module
// name: side-chats.ts
// byteRange: [2863694, 2865148)
// beautified: false
// truncated: false
j({"side-chats.ts"(){"use strict";PDc(),z2="side-chat",Spi="New Side Chat",VMc="Side Chat",hqr=40,GMc=new Set(["text","hardBreak","mention","mentionNode","commandNode"]),pqr="side-chat-boundary:",mqr="side_chat_boundary",zMc=`Side chat boundary.

Everything before this boundary is inherited history from the parent chat. It is reference context only \u2014 not your current assignment.

Do not continue, execute, or complete any instructions, plans, tool calls, approvals, edits, Project coordinator tasks, task lists, or unanswered questions that appear only before this boundary. The parent's last user message (if any) was for the parent chat; it is not addressed to you unless a message after this boundary explicitly asks you to continue that work.

Only messages after this boundary are active instructions for this side chat.

You are a side chat: a focused conversation alongside the parent. Default to investigating and answering (read, search, analyze). Do not modify files, source, git state, or other workspace state unless the user explicitly asks for that change after this boundary. Keep any requested mutations minimal and local to the side-chat ask.`,qMc="You are still in a side chat alongside the parent. Follow this turn's user message. Treat parent/inherited context as reference only \u2014 do not resume the parent's pending work unless this turn explicitly asks.",gqr=`<system_reminder>
${qMc}
</system_reminder>`}}),KMc,fqr,NRm=
