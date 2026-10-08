// Every network bound in the executor, in one place. undici applies no timeout to a proxy
// CONNECT and git has no transport timeout, so ANY outbound await without a bound here can hang
// forever behind a wedged system proxy — stranding the claim loop (≤0.1.38) or the token pump,
// heartbeat tick and /done report (≤0.1.39), leaving a locally-finished step "running" for good.
export const TIMEOUTS_MS = {
  // ── tds server (serverRequest) ──────────────────────────────────────────
  // Must exceed the server's long-poll window (29s hold, maxDuration 35): the bound only exists
  // to cut a dead connection, never a healthy hold.
  claim: 60_000,
  // token / heartbeat / done. Must stay under the 60s heartbeat interval so a timed-out beat
  // can't wedge the next tick behind the inFlight guard; one hung token POST stalls the serial
  // pump for at most this long.
  stepPost: 30_000,
  recover: 15_000,
  // Must stay under the 20s beat cadence so a slow beat never queues behind the next. Sized for a
  // lossy path, not a healthy one: at 5s a single slow handshake failed the beat, and three of those
  // in a row expire the server's 60s presence lease and flip a working machine offline.
  presence: 15_000,
  // Graceful-shutdown beat: best-effort, don't hold the exit.
  presenceOffline: 2_000,
  // One-shot probes: `tds status`, `tds start` preflight.
  statusProbe: 8_000,
  enroll: 15_000,
  enrollPoll: 10_000,
  // One server-executed tool call. The agent is waiting, so keep it tight; replay-safe read tools
  // get a bounded re-issue on top rather than a longer single wait.
  remoteTool: 10_000,
  // open_repo: the git tool's credential fetch, blocking the whole call before any git runs. It is
  // a metadata read (repo name, default branch, token) with no bearing on repo size, but it sat on
  // the 10s tool bound and turned every slow beat into a "git timed out" the agent couldn't act on.
  openRepo: 30_000,

  // ── R2 presigned blobs ──────────────────────────────────────────────────
  // Downloads feed the turn (session hydrate, images, skills): a drop degrades the turn, so allow
  // a slow link room. Session backup likewise: a long turn's jsonl is multi-MB gzipped, and for a
  // cancelled run this upload is the only copy the server will ever see.
  r2UploadSession: 60_000,
  r2Download: 30_000,
  // An external project's change diff, posted to the server after the checkpoint push: up to
  // CHANGES_DIFF_MAX_BYTES of JSON, so the session backup's allowance rather than a tool call's.
  changesUpload: 60_000,

  // ── git subprocesses ────────────────────────────────────────────────────
  // Default for push/fetch/ls-remote (runGit). Generous so a large but live push never trips
  // it; a wedged CONNECT otherwise hangs the syncPush /done.
  gitNetwork: 300_000,
  // Per-attempt bound for the synchronous end-of-turn checkpoint push of an ordinary turn (quick
  // profile: 2 attempts per lease-seeding hop, 4 on the push itself so a git-host redeploy's 5xx
  // window doesn't strand the turn; a cold worktree adds the ls-remote + fetch, so ~2 min typical,
  // ~8 min worst on /done's path). Merge turns stay on gitNetwork —
  // the sink lands the PR right after, so the head must be up whatever it costs.
  gitPushInline: 60_000,
  // Draining a conversation's deferred wrap-up (previous turn's session backup + stray reap)
  // before the next step of that conversation may start. Above the chain's own worst case (backup
  // is bounded by r2UploadSession × 2, the reap by its lsof bound) — so this fires only on a chain
  // that escaped every inner bound. An unbounded wait here meant every later step of the
  // conversation parked inside it holding a concurrency slot, and five of those took the whole
  // machine out of the claim loop.
  deferredTurnWork: 600_000,
  // chief's interactive repo git tool — user-facing latency, bound tighter.
  gitNetworkInteractive: 120_000,
  gitLocalInteractive: 30_000,
  // A full clone, not a delta.
  gitClone: 1_800_000,

  // ── model stream watchdog (streamWatchdog) ──────────────────────────────
  // Gateways can buffer entire tool arguments after a text delta. Spend the silence budget
  // on that request; hitting it is terminal. The socket backstop must outlast the watchdog.
  streamFirstEvent: 300_000,
  streamIdle: 480_000,
  streamBodyTimeout: 540_000,
  streamUsageTail: 1_000,

  // ── agent-facing tools ──────────────────────────────────────────────────
  // Default for a bash command the model gave no timeout: the SDK's own default is none, and a
  // command that never exits (foreground server, watch mode, waiting on stdin) then wedges the
  // turn until someone cancels it — the tool call never returns, so queued steers never reach the
  // model. The model can always pass a larger explicit timeout or background the process.
  bashDefault: 1_800_000,
  webFetch: 10_000,
  // MCP handshake + tools/list, per configured server, off the turn's critical path only once at
  // session build. A dead server must not stall the step start for long — it degrades to "no
  // tools from that server this turn".
  mcpConnect: 15_000,
  // One MCP tool call. Looser than remoteTool: the tool's semantics are unknown (searches, ticket
  // lookups, browsers), and unlike the todos server there is no replay-safe retry layer under it.
  mcpToolCall: 60_000,

  // ── codex app-server (JSON-RPC over stdio) ──────────────────────────────
  // A plain request/response; thread/resume replays the rollout first, so it gets more room.
  codexRpc: 60_000,
  codexResume: 300_000,
  // After stdin closes the server finishes writing its rollout and exits; past this it is killed.
  codexExit: 10_000,

  // ── grok agent stdio (ACP JSON-RPC over stdio) ──────────────────────────
  grokRpc: 60_000,
  // session/load replays the whole updates.jsonl as notifications before it answers.
  grokLoad: 300_000,
  grokExit: 10_000,

  // ── cursor-agent acp (ACP JSON-RPC over stdio) ──────────────────────────
  // session/new signs the services in and loads the MCP servers before it answers.
  cursorRpc: 60_000,
  // session/load replays the whole conversation as notifications before it answers.
  cursorLoad: 300_000,
  // The agent has no exit of its own on a closed stdin, so every turn may pay this in full: long
  // enough for the store's pending writes, no longer.
  cursorExit: 5_000,

  // ── agy stream-json (one JSON line per message over stdio) ──────────────
  // To the init event: the conversation is open, the MCP servers are still connecting.
  antigravityStart: 60_000,
  // agy stays about five seconds after stdin closes, then exits by itself; killed sooner it
  // could lose the turn's last writes to the conversation.
  antigravityExit: 15_000,

  // ── devin acp (ACP JSON-RPC over stdio) ─────────────────────────────────
  // session/new fetches the account's settings and starts the MCP servers before it answers.
  devinRpc: 60_000,
  // session/load replays the whole conversation as notifications before it answers.
  devinLoad: 300_000,
  // The server exits by itself within a second of stdin closing; past this it is killed.
  devinExit: 10_000,

  // ── copilot --headless (JSON-RPC over stdio, Content-Length framed) ─────
  copilotRpc: 60_000,
  // session.resume reads the whole event log back and reconnects the MCP servers.
  copilotResume: 300_000,
  // The server exits within a second of stdin closing, the session's shutdown event written.
  copilotExit: 10_000,

  // ── gemini --acp (ACP JSON-RPC over stdio) ──────────────────────────────
  // initialize waits on the CLI's own start, which signs in first; session/new connects the MCP
  // servers before it answers.
  geminiRpc: 60_000,
  // session/load reads the whole session back and starts replaying it.
  geminiLoad: 300_000,
  // session/load answers while that replay is still streaming: the turn starts once the updates
  // have stopped for this long.
  geminiReplayQuiet: 300,
  // The CLI does not always exit on a closed stdin, so a turn may pay this in full. Its session
  // log is appended synchronously, so there is nothing to wait for but stragglers.
  geminiExit: 2_000,

  // ── omp --mode rpc (one JSON command per line over stdio) ────────────────
  // To the ready frame: settings, credentials and extensions are loaded by then.
  ompStart: 60_000,
  // A plain command and its answer; set_model may first wait on a provider's model discovery.
  ompRpc: 60_000,
  // After stdin closes omp drains what it accepted, records the exit in the session and leaves.
  ompExit: 10_000,

  // ── opencode acp (ACP JSON-RPC over stdio) ──────────────────────────────
  // session/new starts the directory's services and waits on the model catalog before it answers.
  opencodeRpc: 60_000,
  // session/load replays the whole session as notifications before it answers.
  opencodeLoad: 300_000,
  // The agent exits within a second of stdin closing; past this it is killed.
  opencodeExit: 10_000,
  // `opencode session export` and `import`, each on a server of its own that it starts and stops.
  opencodeSession: 120_000,
  // The platform bridge listing its tools once the session is open, and OpenCode then taking
  // them in: a prompt sent sooner reaches the model without them.
  opencodeBridgeListed: 15_000,
  opencodeToolsSettle: 300,

  // ── qwen --acp (ACP JSON-RPC over stdio) ────────────────────────────────
  // session/new signs in and connects the MCP servers before it answers.
  qwenRpc: 60_000,
  // session/resume reads the whole session log back first.
  qwenResume: 300_000,
  // The CLI exits by itself once stdin closes; past this it is killed.
  qwenExit: 10_000,

  // ── droid exec stream-jsonrpc (JSON-RPC over stdio) ─────────────────────
  // initialize_session connects the turn's MCP servers before it answers.
  droidRpc: 60_000,
  // load_session reads the whole session back and connects them again.
  droidLoad: 300_000,
  // Droid exits within a second of stdin closing, the session written; past this it is killed.
  droidExit: 10_000,

  // ── cline --acp (ACP JSON-RPC over stdio) ───────────────────────────────
  // session/new restores the sign-in and asks Cline's API about the account before it answers.
  clineRpc: 60_000,
  // session/load reads the whole session back and replays it as notifications before it answers.
  clineLoad: 300_000,
  // The CLI exits by itself once stdin closes; past this it is killed.
  clineExit: 10_000,

  // ── dsh --profile acp (ACP JSON-RPC over stdio) ─────────────────────────
  // session/new fetches the sign-in's model list and connects the turn's MCP servers before it answers.
  dshRpc: 60_000,
  // session/resume reads the whole compressed session log back first.
  dshResume: 300_000,
  // The CLI exits by itself once stdin closes; past this it is killed.
  dshExit: 10_000,
} as const
