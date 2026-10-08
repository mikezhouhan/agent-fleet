// DispatchGroup / Proposal below are declared in terms of DispatchItem, and a re-export alone gives
// this module no local binding for it. Same for ClientError, built on top of ClientErrorReport.
import type { ClientErrorReport, DispatchItem } from './schemas'
export * from './branchSync'
export * from './machineJob'
export { destDirProblem, normalizeDir } from './syncPath'

// The request schemas these are inferred from live in ./schemas — see the note there. This is a
// type-only re-export on purpose: it compiles away, so importing @tds/types never loads zod.
export type {
  AddAgentMemberRequest,
  AddHumanMemberRequest,
  BuildStepRequest,
  ChiefStepRequest,
  ClientErrorReport,
  CreateAgentRequest,
  CreateFeedbackReply,
  CreateFeedbackRequest,
  CreateModelProviderRequest,
  CreateProjectRequest,
  CreateTagRequest,
  CreateTeamRequest,
  CreateTeamSecretRequest,
  CreateTodoRequest,
  CreateUserPromptRequest,
  DiscoverModelsRequest,
  DispatchItem,
  EnrollMachineRequest,
  InviteMemberRequest,
  LinkRepoRequest,
  QuestionAnswerSubmission,
  TriggerBuildRequest,
  UpdateAgentMemoryEntryRequest,
  UpdateAgentRequest,
  UpdateChiefRequest,
  UpdateMachineRequest,
  UpdateMemberRequest,
  UpdateModelProviderRequest,
  UpdateProjectRequest,
  UpdateTagRequest,
  UpdateTeamRequest,
  UpdateTeamSecretRequest,
  UpdateTodoRequest,
  UpdateUserProfileRequest,
  UpdateUserPromptRequest,
  UploadCommitRequest,
  UploadGrantRequest,
} from './schemas'
import { repairEmphasis, repairTables } from './markdown-normalize'
import { protectMath } from './markdown-math'

// The typographic contract behind conversation markdown, shared by web's prose container and the
// native renderer so the two can't typeset the same message differently.
export * from './markdown-scale'
// The pre-parse repairs behind it, shared for the same reason.
export * from './markdown-normalize'
// How a bare URL is drawn.
export * from './markdown-link'
// Math delimiters and the LaTeX subset the renderers lay out.
export * from './markdown-math'
// GFM task list markers, rewritten into sentinel code spans the renderer paints as boxes.
export * from './markdown-tasks'
export { parseSkillFrontmatter } from './skill-frontmatter'
export * from './latex'
// A .tex file projected into markdown for the file viewer.
export * from './tex-markdown'
// The two colour themes, shared by both stylesheets and both literal token tables.
export * from './theme-tokens'

// ── Actor (unified entity: user or agent) ─────────────────────────────────────

export interface AgentModel {
  provider: string
  modelId: string
  label: string
  supportedThinkingLevels?: string[]
  // From the team's model catalog; absent when the model declares no such cap.
  contextWindow?: number
  maxTokens?: number
}

export interface UserActor {
  type: 'user'
  id: string
  displayName: string       // formerly User.name
  avatarUrl: string | null  // formerly User.picture
  status: 'active' | 'inactive'   // formerly User.isActive (true→active)
  lastSeenAt: number | null        // formerly User.lastLoginAt
  createdAt: number
  updatedAt: number
  email: string
  authProviders: Array<{ provider: string; providerId: string; email: string; linkedAt: number }>
  // UI locale; also drives the agent's output language for builds this user triggers. Absent/en = English.
  locale?: string
  // When this account's one-and-only free trial started. Set once a trial subscription is actually
  // created (never at checkout start — an abandoned checkout must not burn it) and never cleared.
  // This, not any team field, is what makes the trial once per account across all their teams.
  trialUsedAt?: number
  // The publish time of the newest what's-new entry this account has read — not the moment the
  // panel was closed. Storing the click is what let an entry published later that same day read as
  // already seen. Absent means never opened, and reads as createdAt rather than epoch zero (see
  // effectiveSeenAt in the server's whatsNew.ts): a new account has not missed what shipped before
  // it existed.
  whatsNewSeenAt?: number
  // Notification preferences; absent = everything on. `push` is the account-wide push switch —
  // only an explicit false blocks delivery. Finer grain (per type, per channel) extends this object.
  // dailyDigest/weeklyDigest are the summary emails (digestSweep.ts), same only-false-blocks rule.
  notificationPrefs?: { push?: boolean; dailyDigest?: boolean; weeklyDigest?: boolean }
  // Projects this account pinned to the top of the sidebar, newest pin first; absent = none. Spans
  // teams (ids are global) — the drawer keeps the ones in the current team.
  pinnedProjectIds?: string[]
}

// One staff member's read-only look at the product through a user's account. The session it mints is
// refused every write (see withAuth), so this is an access record, not an action log: nothing the
// staff member did inside it could have changed the account. An absent endedAt on an old row means
// the session was left to expire rather than exited.
export interface ImpersonationSession {
  id: string
  adminId: string
  adminEmail: string
  targetId: string
  targetEmail: string
  startedAt: number
  endedAt?: number
}

// Opt-in tool wire names — single source so the step-tools gate, the executor's custom-tool
// registration / server remote-tool registry, and the per-agent grant whitelist can't drift
// apart. merge_branch/create_tag must equal their githubToolSpecs registry keys, so the grant
// string doubles as the remote-tool name the def filter and execute guard match on.
export const REMOTE_SHELL_TOOL = 'remote_shell' as const
export const MERGE_BRANCH_TOOL = 'merge_branch' as const
export const CREATE_TAG_TOOL = 'create_tag' as const
export const PUSH_BRANCH_TOOL = 'push_branch' as const
export const CREATE_SKILL_TOOL = 'create_skill' as const
export const UPDATE_SKILL_TOOL = 'update_skill' as const

// Sentinel entry for AgentActor.secrets meaning "every secret a task can see — the team-level ones
// and its own project's — following the library as it grows" (the MCP_ALL_TOOLS convention).
export const ALL_SECRETS = '*'

// Optional capabilities that can be granted to an individual agent, beyond the phase's baseline
// toolset (BUILD_TOOLS/PLAN_TOOLS/REVIEW_TOOLS). A new opt-in tool ships by landing here, which
// makes it grantable both by a human in team settings and by the chief's create_agent/update_agent
// — the two share this list so a role the chief staffs can close its own loop instead of dead-ending
// at a toggle the user has to find. remote_shell included: a build agent already runs unsandboxed on
// the machine it was dispatched to, so the grant widens *which* machine it can reach, not whether it
// can execute at all, and the machine's own shellEnabled switch still has to be on.
export const AGENT_CONFIGURABLE_TOOLS = [REMOTE_SHELL_TOOL, MERGE_BRANCH_TOOL, CREATE_TAG_TOOL, PUSH_BRANCH_TOOL, CREATE_SKILL_TOOL, UPDATE_SKILL_TOOL] as const
export type AgentConfigurableTool = (typeof AGENT_CONFIGURABLE_TOOLS)[number]

export const AGENT_DESCRIPTION_MAX_CHARS = 800

// External runtimes are the machine's own installs (Claude Code, Codex, Grok Build, Cursor,
// Antigravity, Devin, GitHub Copilot, Gemini CLI, omp, OpenCode, Qwen Code, Droid, Cline, dsh),
// never bundled with the CLI; a machine reports which it has via presence (Machine.runtimes).
export const EXTERNAL_AGENT_RUNTIMES = ['claude-code', 'codex', 'grok-build', 'cursor', 'antigravity', 'devin', 'copilot', 'gemini-cli', 'omp', 'opencode', 'qwen-code', 'droid', 'cline', 'dsh'] as const
export type ExternalAgentRuntime = (typeof EXTERNAL_AGENT_RUNTIMES)[number]
export const AGENT_RUNTIMES = ['pi', ...EXTERNAL_AGENT_RUNTIMES] as const
export type AgentRuntime = (typeof AGENT_RUNTIMES)[number]
export const EXTERNAL_RUNTIME_LABELS: Record<ExternalAgentRuntime, string> = { 'claude-code': 'Claude Code', codex: 'Codex', 'grok-build': 'Grok Build', cursor: 'Cursor', antigravity: 'Antigravity', devin: 'Devin', copilot: 'GitHub Copilot', 'gemini-cli': 'Gemini CLI', omp: 'omp', opencode: 'OpenCode', 'qwen-code': 'Qwen Code', droid: 'Droid', cline: 'Cline', dsh: 'dsh' }

// The external runtime an agent runs on; undefined for the built-in pi default (absent or 'pi') and
// for any runtime this build no longer knows — a stale actor left by a rolled-back runtime resolves
// to pi rather than to a name with no label, icon or catalog behind it (which the UI would crash on).
export function externalRuntimeOf(actor: { runtime?: AgentRuntime | null } | null | undefined): ExternalAgentRuntime | undefined {
  const runtime = actor?.runtime
  return runtime && runtime !== 'pi' && (EXTERNAL_AGENT_RUNTIMES as readonly string[]).includes(runtime) ? runtime : undefined
}

// An external runtime's subscription usage, as the machine's own CLI reports it (claude /usage,
// codex /status). 'no_limits' = the sign-in has no plan windows (API key, gateway); 'error' only
// when no successful probe ever landed.
export const RUNTIME_USAGE_STATUSES = ['ok', 'signed_out', 'no_limits', 'error'] as const
export type RuntimeUsageStatus = (typeof RUNTIME_USAGE_STATUSES)[number]

// One rate-limit window. `key` is normalised across runtimes: 'five_hour' | 'seven_day' |
// 'seven_day_opus' | 'seven_day_sonnet' | 'extra_usage' | 'credits' | 'on_demand' |
// 'model:<name>' | 'limit:<id>' | 'window:<minutes>'.
export interface RuntimeUsageWindow {
  key: string
  // The runtime's own display name where it gives one (Codex limitName, Claude model bucket).
  label?: string | null
  windowMinutes?: number | null
  // 0-100; null when the runtime reports the window without a figure (Grok's weekly period).
  utilization: number | null
  // epoch ms
  resetsAt: number | null
}

export interface RuntimeUsageAccount { id?: string | null; email?: string | null; plan?: string | null }

// The longest model list a snapshot carries: presence cuts anything past it, so a CLI that lists
// more (omp, across every provider it is signed in to) ranks its own before sending.
export const RUNTIME_MODELS_MAX = 256

// One model an external runtime's CLI lists. `id` is what the CLI's own model flag takes — for
// Claude Code its alias (`sonnet`, `opus[1m]`, `default`), with the wire id it resolves to in
// `resolvedModel` for display. Lists come in the CLI's own order, its default first.
export interface ExternalRuntimeModel {
  id: string
  label: string
  // The runtime's own reasoning-effort ladder for this model, passed through as thinkingLevel;
  // empty when the model takes no effort control.
  effortLevels: string[]
  resolvedModel?: string
  // The model the CLI says supersedes this one (Codex): still runnable, no longer the pick.
  upgrade?: string
}

// A machine's latest probe of one runtime. Reported through presence and grouped by account on
// the client — the same sign-in on two machines is one account, not two.
export interface RuntimeUsageSnapshot {
  fetchedAt: number
  status: RuntimeUsageStatus
  account?: RuntimeUsageAccount | null
  windows: RuntimeUsageWindow[]
  error?: string | null
  // The models the CLI listed on that probe — the sign-in's, since a plan decides what it offers.
  // The team's picker for the runtime is the union across its machines (externalRuntimeCatalog).
  models?: ExternalRuntimeModel[]
}

// An ES partial update deep-merges objects, so a key's absence keeps the stored snapshot and only
// an explicit null clears it: the machine sends null for a runtime it no longer has, and omits one
// it has but hasn't probed since its last start — the page keeps showing the last reading.
export type MachineRuntimeUsage = Partial<Record<ExternalAgentRuntime, RuntimeUsageSnapshot | null>>

// The team's model-call spend over one time window, every runtime included: an external runtime's
// calls carry the runtime's name as their provider, so the split by runtime falls out of byModel
// (largest first).
export interface TokenUsageWindow {
  from: number
  to: number
  runs: number
  calls: number
  total: RunUsage
  byModel: ModelUsage[]
}

// One local day's total, keyed the way the client keys its calendar ('YYYY-MM-DD' in the zone it
// asked for). Days with no calls are absent.
export interface TokenUsageDay {
  day: string
  tokens: number
  costUsd: number
}

// GET /api/teams/[teamId]/runtime-usage/tokens: a year of daily totals for the heatmap, and the
// breakdown over the last 7 days (rolling, like the other windows), the last 30 days and the
// heatmap's whole span. `runtimes` are the ones with calls in that span whatever the filter, so
// the page can offer them all.
export interface TeamTokenUsage {
  fetchedAt: number
  runtimes: AgentRuntime[]
  days: TokenUsageDay[]
  week: TokenUsageWindow
  days30: TokenUsageWindow
  year: TokenUsageWindow
}

export interface AgentActor {
  type: 'agent'
  id: string
  displayName: string
  avatarUrl: string | null
  status: 'active' | 'inactive'
  lastSeenAt: number | null
  createdAt: number
  updatedAt: number
  provider: string
  modelId: string
  thinkingLevel: string | null
  // Free-text role (what this agent is for), injected into its build turns and shown in
  // agents for dispatch routing. Absent = none set.
  description?: string
  // Granted opt-in tools (AGENT_CONFIGURABLE_TOOLS subset). Absent = none granted.
  tools?: AgentConfigurableTool[]
  // Team secrets injected into this agent's shell env during tasks — secret ids, or [ALL_SECRETS]
  // for the whole library as it grows. Absent/empty = no access. Its own field, not a tools entry:
  // secrets are a permission, not a callable tool.
  secrets?: string[]
  // Default skills (tds_skills ids) auto-attached to every turn this agent runs, no per-message
  // @ mention required. Absent = none.
  skills?: string[]
  // Team MCP servers granted to this agent — tds_mcp_servers ids. Absent/empty = none. Per-server
  // checkbox (no ALL_SECRETS-style sentinel), same UX as skills.
  mcpServers?: string[]
  // Which agent runtime executes this agent's turns. Absent/'pi' = the built-in pi SDK (default).
  // 'claude-code'/'codex'/'grok-build'/'cursor'/'antigravity'/'devin'/'copilot'/'gemini-cli'/'omp'/
  // 'opencode'/'qwen-code'/'droid'/'cline'/'dsh' = the user's locally-installed CLI, driven over
  // its own protocol.
  runtime?: AgentRuntime
}

// A registered machine running the machine daemon. Not an actor: no identity,
// not a team member — agents attached to it are. buildEnabled gates whether the machine receives
// build/plan/review/chief steps (machineSelect's candidate filter). Branch sync is explicitly
// requested by the user; shellEnabled is the remote_shell opt-in.
export interface Machine {
  id: string
  name: string
  teamId: string
  deviceId: string
  // Opt-out (on by default): eligible to be picked for build/plan/review/chief steps. Off turns
  // the machine into a shell-only target — the opposite default of shellEnabled's opt-in.
  buildEnabled: boolean
  // Web-managed consent switch: agents granted remote_shell may run commands on this machine
  // (tests/compile/dev servers). Off by default; toggled on the machine page.
  shellEnabled: boolean
  maxConcurrentTasks: number | null
  // Historical ES field; retired mounts no longer use or update it.
  maxConcurrentSyncs?: number | null
  // tds version reported via the x-tds-version header; 'unknown' for CLIs that predate it.
  cliVersion?: string
  // Tunnel coordinates for remote_shell, reported via presence; absent until the sidecar is up.
  // (Per-client SSH authorizations are short-lived and live in Redis, not here — see
  // apps/server/src/lib/syncAuth.ts and /api/sync/authz.)
  tailnetAddr?: string | null
  sshHostKey?: string | null
  // Effective clone/worktree root the worker resolved at its last start, reported via presence.
  // Local filesystem path, display only — the server never controls it.
  workspacesDir?: string | null
  // Node's process.platform / process.arch, reported via presence ('android' = Termux).
  // Diagnostic: lets support tell a Termux machine from a Linux one without guessing at paths.
  platform?: string | null
  arch?: string | null
  // External agent runtimes found on the machine (its own Claude Code install — never bundled),
  // reported via presence on change. Absent on CLIs that predate it: read as none.
  runtimes?: ExternalAgentRuntime[] | null
  // Admin opt-out per external runtime (machine page): policy, unlike `runtimes`, which is what
  // the machine reports installed and presence overwrites. Absent/empty = every runtime allowed.
  disabledRuntimes?: ExternalAgentRuntime[]
  // Each installed runtime's subscription usage as last probed on this machine, via presence on
  // change (see MachineRuntimeUsage). Absent on CLIs that predate it.
  runtimeUsage?: MachineRuntimeUsage | null
  // Who last hosted the worker, reported via presence: the CLI daemon, or the desktop shell running
  // the same executor in-app. Not a kind — the same machine can be run by either — but it decides
  // what "update" and "bring it online" advice the web gives.
  runner?: MachineRunner | null
  // Last fatal error out of the tunnel sidecar (spawn failure, or the Go process's dying "error"
  // event — e.g. node-auth DNS failures); null once the tunnel comes up. Explains WHY
  // tailnetAddr/sshHostKey are missing instead of leaving only their absence.
  tunnelError?: string | null
  // Who authorized this machine into its current team (api-key or device-flow user). Audit only,
  // not used for auth; null for machines registered via the old invite flow.
  enrolledBy: string | null
  // 'hosted' machines are platform sandboxes the server itself provisions, starts and stops; 'byo'
  // (the default, and everything that predates this field) is a computer the user runs `tds` on and
  // that the server can only wait for. The distinction is what lets selection treat an offline
  // hosted machine as available-on-demand rather than simply down.
  kind?: MachineKind
  sandbox?: SandboxState
  createdAt: number
  updatedAt: number
}

export const MACHINE_KINDS = ['byo', 'hosted'] as const
export type MachineKind = (typeof MACHINE_KINDS)[number]

export const MACHINE_RUNNERS = ['cli', 'desktop'] as const
export type MachineRunner = (typeof MACHINE_RUNNERS)[number]

export function isDesktopRunMachine(machine: Pick<Machine, 'runner'>): boolean {
  return machine.runner === 'desktop'
}

export function isHostedMachine(machine: Pick<Machine, 'kind'>): boolean {
  return machine.kind === 'hosted'
}

// remote_shell reaches a machine over tds-tunnel. A platform (hosted) machine has a tunnel for
// the builder role (so its agents can shell into user-owned machines), but it cannot be a shell
// TARGET — no user process runs there to gate commands, and the sandbox's ephemeral lifecycle makes
// a standing exec connection unreliable. Every entry point that can flip shellEnabled checks this.
export function machineSupportsRemoteShell(machine: Pick<Machine, 'kind'>): boolean {
  return !isHostedMachine(machine)
}

// ── Sandbox sizes ─────────────────────────────────────────────────────────────
// A team holds exactly one platform machine, so the only dial it has is how big that machine is.
// Each size is a Cloudflare instance type, and the hourly cost is derived the same way for all
// three: provisioned memory ($0.009/GiB-hr) and disk ($0.000252/GB-hr) in full, plus CPU
// ($0.072/vCPU-hr) at the ~15% duty cycle an agent blocked on model I/O actually runs at. Asleep is
// free, so only awake time is ever charged.
//
// `small` is the floor, not a starting point: below standard-2 the disk (8 GB) cannot hold the image
// plus a repo clone plus `npm install`, and custom types cap disk at 2 GB per GiB of memory, which
// is what forces 6 GiB. Sizes go up from here, never down.

export const SANDBOX_SIZES = ['small', 'medium', 'large'] as const
export type SandboxSize = (typeof SANDBOX_SIZES)[number]

export const DEFAULT_SANDBOX_SIZE: SandboxSize = 'small'

export interface SandboxSizeSpec {
  // The Cloudflare instance type. Each one is a separate container class in the sandbox worker's
  // wrangler config — instance_type binds to the class, so it cannot be chosen per request.
  instanceType: string
  vcpu: number
  memoryGib: number
  diskGb: number
  usdPerHour: number
  // What a machine of this size runs in parallel when the team has not set a cap of its own. Paying
  // for 4 vCPU and still running three tasks would be buying idle silicon.
  defaultConcurrentTasks: number
}

export const SANDBOX_SIZE_SPECS: Record<SandboxSize, SandboxSizeSpec> = {
  small: { instanceType: 'standard-2', vcpu: 1, memoryGib: 6, diskGb: 12, usdPerHour: 0.068, defaultConcurrentTasks: 3 },
  medium: { instanceType: 'standard-3', vcpu: 2, memoryGib: 8, diskGb: 16, usdPerHour: 0.098, defaultConcurrentTasks: 5 },
  large: { instanceType: 'standard-4', vcpu: 4, memoryGib: 12, diskGb: 20, usdPerHour: 0.157, defaultConcurrentTasks: 8 },
}

export const isSandboxSize = (v: unknown): v is SandboxSize =>
  typeof v === 'string' && (SANDBOX_SIZES as readonly string[]).includes(v)

// How many containers of each size may be awake at once. A copy, not the source: the provider reads
// `max_instances` out of apps/sandbox-worker/wrangler.jsonc at deploy time and never tells us the
// number, so changing it there without changing it here leaves the watch below aimed at a ceiling
// that no longer exists.
//
// Raising it is a wrangler edit up to the account-level container quota (1,500 vCPU / 6 TiB memory /
// 30 TB disk, which works out to ~1,024 small, ~750 medium or ~375 large), and a request to
// Cloudflare past that. Sleeping sandboxes count against neither — this bounds concurrent WAKE, not
// how many machines exist.
export const SANDBOX_MAX_INSTANCES: Record<SandboxSize, number> = { small: 100, medium: 100, large: 100 }

// Where the capacity watch starts complaining. Hitting the ceiling has no distinct symptom —
// Cloudflare neither queues nor autoscales, so a container simply fails to come up and the team sees
// a machine that will not wake. Warning early is the only way anyone finds out before users do.
export const SANDBOX_CAPACITY_WARN_RATIO = 0.8

// Control-plane state for a hosted machine. Not a cache of the provider's view — the provider is
// authoritative on whether a container is up, and this only records what we asked for and what we
// need to ask for next.
export interface SandboxState {
  // Provider-side handle — what the sandbox is addressed by, which is NOT the machine id. Minted
  // lowercase (see sandboxIdNeedsMigration): hostnames are case-insensitive, and the SDK folds ids
  // to lowercase to keep preview URLs addressable. Machines provisioned before this held the
  // machine id, a nanoid that carries uppercase; startHostedMachine migrates those on their next
  // wake, which is why nothing may assume this equals `machine.id`.
  id: string
  // Handle to the last backup of the sandbox's data dir, or absent when it has never been backed up
  // (a fresh machine, or one whose backup aged out). A wake with no handle starts an empty sandbox
  // and lets the executor cold-start from the R2 session mirror, the same path a handover takes.
  backup?: SandboxBackupRef
  // When the server last started this sandbox, for the awake-time accounting. Explicitly null once
  // settled: an ES partial update merges nested objects, so omitting the key would leave the old
  // value in place and double-charge the next settlement.
  lastStartedAt?: number | null
  // The size the team has chosen, applied on the next start. Absent on everything provisioned before
  // sizes existed, which is why every read goes through sandboxSizeOf rather than the field.
  size?: SandboxSize
  // The size the running container was actually started at, snapshotted from `size` at start and
  // written in the same patch as lastStartedAt. Billing reads THIS, never `size`: a resize while the
  // machine is awake must not reprice the stretch it already spent running the old instance type.
  awakeSize?: SandboxSize
  // When the idle timer was last (re)armed: at start, and when the idle backup begins. Null while
  // a step runs or after the sandbox has stopped.
  sleepTimerSetAt?: number | null
  // When a step was last claimed here (the disk is changing) and when the backup that covers it
  // started. Two stamps rather than a flag, so a step claimed while an archive is being built is
  // never mistaken for captured — see sandboxBackupDue.
  backupDueAt?: number
  backedUpAt?: number
}

// The disk has changed since the last backup started. False on a machine no step has run on.
export const sandboxBackupDue = (sandbox: Pick<SandboxState, 'backupDueAt' | 'backedUpAt'> | undefined): boolean =>
  (sandbox?.backupDueAt ?? 0) > (sandbox?.backedUpAt ?? 0)

// What to address this machine's sandbox by. Falls back to the machine id for anything provisioned
// before ids were minted separately — those are exactly the ones needing migration.
export const sandboxIdOf = (machine: Pick<Machine, 'id' | 'sandbox'>): string =>
  machine.sandbox?.id ?? machine.id

// Uppercase in a sandbox id is a latent identity change: the SDK lowercases ids so preview URLs stay
// addressable (hostnames are case-insensitive), and an id folded under us names a DIFFERENT Durable
// Object — the running container becomes unreachable, unstoppable, and still billed. So ids are
// minted lowercase and legacy ones are moved before that can happen.
export const sandboxIdNeedsMigration = (id: string): boolean => /[A-Z]/.test(id)

export const sandboxSizeOf = (sandbox: Pick<SandboxState, 'size'> | undefined): SandboxSize =>
  sandbox?.size ?? DEFAULT_SANDBOX_SIZE

// The size a settlement should be charged at: what it was started as, falling back to the chosen
// size for windows opened before awakeSize existed.
export const sandboxAwakeSizeOf = (sandbox: Pick<SandboxState, 'size' | 'awakeSize'> | undefined): SandboxSize =>
  sandbox?.awakeSize ?? sandboxSizeOf(sandbox)

export const SANDBOX_IDLE_TIMEOUT_MIN = 10

export const sandboxSleepEstimateAt = (
  sandbox: Pick<SandboxState, 'sleepTimerSetAt'> | undefined,
): number | null =>
  sandbox?.sleepTimerSetAt ? sandbox.sleepTimerSetAt + SANDBOX_IDLE_TIMEOUT_MIN * 60_000 : null

// Opaque to us: the shape the provider hands back from a backup and wants returned to restore it.
export interface SandboxBackupRef {
  id: string
  dir: string
  localBucket?: boolean
}

// One row per team (doc id = teamId): the plan's allowance for the current billing period, whatever
// was topped up onto it, and what has been drawn against both. Machine time and inference are
// metered by different things but share one ceiling — a team that spends its month on inference has
// that much less machine time, which is the whole point of a single pool.
export interface TeamCreditLedger {
  teamId: string
  // Audit snapshot of the plan the period opened on. Team.plan plus Stripe stay authoritative.
  plan: TeamPlan
  // The Stripe invoice this allowance hangs off. It anchors the monthly windows below and is the
  // idempotence key for opening a period, so a roll must never advance it — otherwise a redelivered
  // webhook carrying the same invoice would look like a new one and hand out a second allowance.
  // Absent on ledgers written before the allowance stopped being the invoice; see creditCycleOf.
  cycleAnchor?: number
  cycleEnd?: number
  // The current allowance window: one calendar month, walked forward from cycleAnchor. A monthly
  // subscription has exactly one of these per invoice and behaves as it always did; a yearly one has
  // twelve, which is the point — what the plan grants is monthly whatever interval Stripe bills on.
  periodStart: number
  periodEnd: number
  // The plan's allowance, rewritten on every period roll.
  grantedUsd: number
  // Top-ups bought during this period. Rolls over with everything else — a period is a clean slate.
  toppedUpUsd: number
  // Checkout session ids already credited, so a redelivered webhook cannot pay a team twice. Bounded
  // by the period roll, which is why it can live inline rather than in its own index.
  topUpSessions: string[]
  // Refund ids already clawed back (refund.updated is delivered at least once and fires per status
  // change). Same lifetime as topUpSessions: a new cycle resets both, and a refund whose session is
  // no longer in topUpSessions is ignored — that money never made it into this cycle's balance.
  topUpReversals?: string[]
  modelSpentUsd: number
  sandboxSpentUsd: number
  // This cycle's grant is the reduced trial pool (TRIAL_OVERRIDES), not the plan's monthly
  // allowance. Absent = normal grant. A roll within the cycle preserves it; a new cycle decides
  // it afresh from the subscription's status.
  trial?: boolean
  // One-shot analytics claims for this period's refusals (credit_pool_exhausted, the trial's
  // vendor block): the gateway refuses per request, and these collapse that to one event per
  // period. A fresh period rebuilds the document without them, re-arming both.
  exhaustionTrackedAt?: number
  vendorBlockTrackedAt?: number
  createdAt: number
  updatedAt: number
}

// Charged at the size the container was actually started as (SandboxState.awakeSize), never at the
// size the team has since picked — see sandboxAwakeSizeOf.
export function sandboxCostUsd(awakeMs: number, size: SandboxSize = DEFAULT_SANDBOX_SIZE): number {
  return (awakeMs / 3_600_000) * SANDBOX_SIZE_SPECS[size].usdPerHour
}

// The user-facing unit for the pool. Credits exist so that what a credit SELLS for and what one
// COSTS us can move independently: DeepSeek's cache-hit rate alone swings the true cost of "a
// million tokens" by 2x, so a token count would be a promise we cannot keep at a fixed price,
// and a dollar balance would print our margin on the billing page. The ledger stays in USD; this
// is the presentation layer's conversion.
export const USD_PER_CREDIT = 0.0002

export const creditsFromUsd = (usd: number): number => usd / USD_PER_CREDIT
export const usdFromCredits = (credits: number): number => credits * USD_PER_CREDIT

export function creditLedgerBalanceUsd(
  ledger: Pick<TeamCreditLedger, 'grantedUsd' | 'toppedUpUsd' | 'modelSpentUsd' | 'sandboxSpentUsd'>,
): number {
  return ledger.grantedUsd + ledger.toppedUpUsd - ledger.modelSpentUsd - ledger.sandboxSpentUsd
}

// FIFO: spend draws the monthly grant first, then top-ups. Returns what remains of the top-up
// balance after all spend is applied — the amount that carries forward on a monthly roll.
export function topUpRemainingUsd(
  ledger: Pick<TeamCreditLedger, 'grantedUsd' | 'toppedUpUsd' | 'modelSpentUsd' | 'sandboxSpentUsd'>,
): number {
  const totalSpent = ledger.modelSpentUsd + ledger.sandboxSpentUsd
  return Math.max(0, ledger.toppedUpUsd - Math.max(0, totalSpent - ledger.grantedUsd))
}

export function creditLedgerExhausted(ledger: Parameters<typeof creditLedgerBalanceUsd>[0]): boolean {
  return creditLedgerBalanceUsd(ledger) <= 0
}

// A ledger predating cycleAnchor was written when the allowance and the invoice were the same
// window, so its periodStart is the anchor and its periodEnd is where the invoice ends.
export function creditCycleOf(ledger: Pick<TeamCreditLedger, 'cycleAnchor' | 'cycleEnd' | 'periodStart' | 'periodEnd'>): {
  anchor: number
  end: number
} {
  return { anchor: ledger.cycleAnchor ?? ledger.periodStart, end: ledger.cycleEnd ?? ledger.periodEnd }
}

// Calendar arithmetic in UTC, clamped the way Stripe clamps: an invoice anchored on the 31st bills
// the 28th in February rather than sliding into March, and every subsequent month reads off the
// anchor again so the slide never accumulates.
function addUtcMonths(ms: number, months: number): number {
  const from = new Date(ms)
  const day = from.getUTCDate()
  const at = new Date(ms)
  at.setUTCDate(1)
  at.setUTCMonth(at.getUTCMonth() + months)
  const daysInTarget = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 0)).getUTCDate()
  at.setUTCDate(Math.min(day, daysInTarget))
  return at.getTime()
}

function wholeUtcMonthsBetween(from: number, to: number): number {
  const a = new Date(from)
  const b = new Date(to)
  const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  return addUtcMonths(from, months) > to ? months - 1 : months
}

// Which month of the invoice `now` falls in. Derived from the anchor in one step rather than by
// adding a month at a time: months are not a fixed number of milliseconds, and a lazy roll may have
// to cross several at once after a team has been quiet.
//
// The last window never extends past the invoice. A subscription whose period has ended but whose
// renewal webhook has not landed yet therefore stops at its final month instead of minting new
// allowances out of a lapsed invoice.
export function creditPeriodWindow(cycleAnchor: number, now: number, cycleEnd: number): { start: number; end: number } {
  const lastMonth = cycleEnd > cycleAnchor ? Math.max(0, wholeUtcMonthsBetween(cycleAnchor, cycleEnd - 1)) : 0
  const month = Math.min(lastMonth, Math.max(0, wholeUtcMonthsBetween(cycleAnchor, now)))
  const start = addUtcMonths(cycleAnchor, month)
  const end = addUtcMonths(cycleAnchor, month + 1)
  return { start, end: cycleEnd > cycleAnchor ? Math.min(end, cycleEnd) : end }
}

// ── The models Pro includes ─────────────────────────────────────────────────
// Rates live here rather than server-side because onboarding quotes what a task costs on each one
// before anyone has bought anything, and a second copy of these numbers is a copy that can drift
// from the one the ledger actually bills. The server builds its provider table off this list; what
// stays server-side is everything a browser must never see — base URLs, key names, the reconcile.
//
// USD per million tokens, straight from each vendor's price sheet: we resell inference at cost. A
// vendor that prices by time of day keeps its off-peak rate here; the peak multiplier is server-side.
export interface ManagedModelRates {
  cacheHit: number
  cacheMiss: number
  // Only where a vendor prices its cache writes apart from plain input. Absent means the write bills
  // as a miss, which is what every vendor but OpenAI does.
  cacheWrite?: number
  output: number
}

export interface ManagedModelInfo {
  id: string
  // The vendor's own product name. Not translated — it is the name the vendor ships under.
  label: string
  vendor: 'deepseek' | 'openai' | 'xai'
  usdPerMtok: ManagedModelRates
}

// Ordered cheapest first, which is also the order onboarding lists them in: the seeded default leads
// and the pricier models read as deliberate upgrades away from it.
export const MANAGED_MODELS: readonly ManagedModelInfo[] = [
  // deepseek-flash is DeepSeek-V4.1-Flash, live 2026-09-10 and the name the vendor asks for. The
  // retired V4 Flash keeps its row at the same new rates: the vendor still accepts the id, routes
  // it to V4.1-Flash and bills it as Flash, and agents already pointing at it must keep running.
  { id: 'deepseek-flash', label: 'DeepSeek V4.1 Flash', vendor: 'deepseek', usdPerMtok: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 } },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (legacy alias)', vendor: 'deepseek', usdPerMtok: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 } },
  { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna', vendor: 'openai', usdPerMtok: { cacheHit: 0.02, cacheMiss: 0.2, cacheWrite: 0.25, output: 1.2 } },
  // V4 Pro was slated to fold into Flash on 2026-09-14, but api-docs.deepseek.com still lists it at
  // its own sheet as of 2026-10-05.
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', vendor: 'deepseek', usdPerMtok: { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 } },
  { id: 'grok-build-0.1', label: 'Grok Build 0.1', vendor: 'xai', usdPerMtok: { cacheHit: 0.2, cacheMiss: 1, output: 2 } },
  { id: 'grok-4.3', label: 'Grok 4.3', vendor: 'xai', usdPerMtok: { cacheHit: 0.2, cacheMiss: 1.25, output: 2.5 } },
  { id: 'grok-4.5', label: 'Grok 4.5', vendor: 'xai', usdPerMtok: { cacheHit: 0.3, cacheMiss: 2, output: 6 } },
  { id: 'grok-4.6', label: 'Grok 4.6', vendor: 'xai', usdPerMtok: { cacheHit: 0.5, cacheMiss: 2, output: 6 } },
  { id: 'grok-4.7', label: 'Grok 4.7', vendor: 'xai', usdPerMtok: { cacheHit: 0.5, cacheMiss: 2, output: 6 } },
]

export const managedModelsOfVendor = (vendor: ManagedModelInfo['vendor']): readonly ManagedModelInfo[] =>
  MANAGED_MODELS.filter(m => m.vendor === vendor)

// One task's token buckets — the model the credit pool was sized against, documented in
// docs/pricing.md. Modeled rather than measured: build_run.modelCalls carries the real distribution
// and is what should eventually replace these three numbers. Quoted as an estimate everywhere it
// reaches a user for exactly that reason.
export const TYPICAL_TASK_TOKENS = { cacheHit: 532_000, fresh: 134_000, output: 35_000 } as const

// A vendor that prices cache writes apart charges the fresh prompt at that rate rather than the
// plain input one: on a turn it has not seen before essentially all of the prompt is a write.
export function typicalTaskCredits(rates: ManagedModelRates): number {
  const usd = (TYPICAL_TASK_TOKENS.cacheHit * rates.cacheHit
    + TYPICAL_TASK_TOKENS.fresh * (rates.cacheWrite ?? rates.cacheMiss)
    + TYPICAL_TASK_TOKENS.output * rates.output) / 1_000_000
  return creditsFromUsd(usd)
}

// Inference only. Machine time draws the same pool, so this is a ceiling rather than a forecast —
// which is why the caller has to say so wherever it shows the number.
export const typicalTasksPerPool = (rates: ManagedModelRates, credits: number): number =>
  Math.floor(credits / typicalTaskCredits(rates))

// One-off credit packs, for a team that spends its monthly pool early. Deliberately not an automatic
// overage charge: "no surprise bills" is a promise the product makes on its pricing page, so running
// out stops the hosted machines and waits rather than quietly billing more.
//
// A pack is identified by id everywhere — checkout metadata carries the id, never an amount, so the
// credited quantity is always looked up here rather than trusted from a session that a client could
// have shaped.
export interface CreditPack {
  id: string
  credits: number
  // The face value of the credits — what they cost us, = credits * USD_PER_CREDIT.
  priceUsd: number
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: 'credits_50k', credits: 50_000, priceUsd: 10 },
  { id: 'credits_125k', credits: 125_000, priceUsd: 25 },
  { id: 'credits_250k', credits: 250_000, priceUsd: 50 },
  { id: 'credits_500k', credits: 500_000, priceUsd: 100 },
]

export const TOPUP_MIN_USD = 10
export const TOPUP_MAX_USD = 1000

// A custom top-up: the team picks an amount, not a pack. Server-side only — the client sends a
// dollar figure, the server validates and builds the pack on the fly. The credited quantity is
// stored in session metadata the same way a fixed pack's id is, so the webhook never trusts the
// client's number.
export function customCreditPack(amountUsd: number): CreditPack | null {
  if (!Number.isFinite(amountUsd) || amountUsd < TOPUP_MIN_USD || amountUsd > TOPUP_MAX_USD) return null
  const rounded = Math.floor(amountUsd)
  const credits = creditsFromUsd(rounded)
  return { id: `custom_${rounded}`, credits, priceUsd: rounded }
}

// Payment processing fee on credit top-ups, charged separately from the credit face value.
// Covers Stripe's 2.9% + $0.30 with a small margin. The fee is the user's, not the pool's —
// credits land at face value and the fee is a line item on the checkout, same model as OpenRouter.
export const TOPUP_FEE_RATE = 0.055
export const TOPUP_FEE_MIN_USD = 0.80

export function topupFeeUsd(baseUsd: number): number {
  return Math.max(TOPUP_FEE_MIN_USD, baseUsd * TOPUP_FEE_RATE)
}

export function topupTotalUsd(baseUsd: number): number {
  return baseUsd + topupFeeUsd(baseUsd)
}

export const creditPackById = (id: string | undefined | null): CreditPack | undefined =>
  CREDIT_PACKS.find(p => p.id === id)

export interface AgentCredential {
  id: string       // = machineId
  tokenHash: string
  deviceId: string
}

export type Actor = UserActor | AgentActor

export type UserActorPublic = Omit<UserActor, 'authProviders'>

export interface AgentActorPublic extends AgentActor {
  activeTaskCount: number
  // Past the team plan's agent cap (a downgrade left it there): kept, editable, deletable, but no
  // turn starts for it until the team deletes down to the cap or upgrades. Server-derived per read.
  locked?: boolean
}

export type ActorPublic = UserActorPublic | AgentActorPublic

// ── Team ──────────────────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  createdAt: number
  // DiceBear style for the team's generated agent avatars; undefined → DEFAULT_AVATAR_STYLE.
  avatarStyle?: string
  // Subscription plan; undefined → 'free' (teams created before plans existed). Server-managed,
  // never user-settable, with two mutually exclusive drivers: Stripe subscription state (webhook +
  // checkout verify) or a prepaid term (prepaidUntil below, expired by the billing sweep).
  plan?: TeamPlan
  // Stripe customer, created lazily on first checkout and persisted before the Checkout Session
  // so subscription.* webhooks can always resolve the team by customer id.
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  // The purchasing admin, persisted from the subscription's metadata on every sync — the human that
  // billing analytics attribute to when an event has no acting user (webhooks, agent-driven paths).
  billingOwnerId?: string
  // Mirror of whether Stripe holds a scheduled cancellation (cancel_at, or the older
  // cancel_at_period_end flag), kept only so a sync can see it flip: a Portal cancellation moves
  // nothing else until the period actually ends. Display reads Stripe live.
  cancelAtPeriodEnd?: boolean
  // End of a prepaid Pro term (epoch ms) — the one-off-payment path (Alipay/WeChat cannot
  // subscribe). `plan` holds 'pro' until this instant, then the billing sweep downgrades. Kept
  // after expiry as an audit trail, so only `plan` says whether the term is in effect; a
  // subscription sync clears it, keeping the two plan drivers mutually exclusive.
  prepaidUntil?: number
  prepaidInterval?: BillingInterval
  // Idempotence claim for applying a prepaid checkout session, and the identity a refund is
  // checked against — a refund for a session the team has since re-bought past is stale.
  prepaidLastSessionId?: string
  // Expiry-reminder watermark: the prepaidUntil the reminder was sent for, so a renewal (which
  // moves prepaidUntil) re-arms it.
  prepaidReminderSentForUntil?: number
  // Project count as the cap's atomic claim: bumped in the same ES update that checks the plan's
  // maxProjects, so concurrent creates cannot all pass. Unset until the first create after its
  // introduction seeds it from the live count.
  projectCount?: number
  // Derived on GET /api/teams from the credit ledger's trial flag, never stored on the document —
  // `plan` alone cannot tell a trial from a purchase (both are 'pro'), and a second persisted copy
  // of that fact would be one more thing to keep in sync with the ledger that already tracks it.
  trialing?: boolean
}

// ── Plans ─────────────────────────────────────────────────────────────────────
// Quotas per subscription plan (docs/pricing.md is the source of truth). Mostly capacity; the two
// exceptions are platform-hosted machines and platform inference, which are gated rather than
// metered-and-capped because they cost real money per hour — Free covers the same ground with the
// user's own machine and their own model key.

export type TeamPlan = 'free' | 'pro'

export interface PlanLimits {
  maxMembers: number
  maxAgents: number
  maxMachines: number
  // Platform machines the team may hold, counted within maxMachines rather than beside it — the rest
  // of that allowance is for machines the team brings itself. 0 means the plan has none at all.
  //
  // This is the dial that tiers a plan by quantity; size (SANDBOX_SIZE_SPECS) is the dial a team
  // turns day to day. Read it through hostedMachineAllowance, never directly: a future per-machine
  // add-on adds to a team's allowance without touching this table.
  maxHostedMachines: number
  // A guardrail more than a lever — a project is one ES document, and what it can cost (hosted repo
  // disk, builds) is capped by storage and per-machine concurrency already. Create fails with project_limit
  // once reached; existing projects survive a downgrade, only creating past the cap is refused.
  maxProjects: number
  maxStorageBytes: number
  // The monthly pool, denominated in platform cost. Covers hosted-machine awake time and platform
  // inference together; 0 means the plan has no pool — and with it neither platform-hosted machines
  // nor managed inference, since both draw on it. The pool IS the entitlement (planHasCreditPool);
  // a separate switch per consumer would only create states where a team may hold a machine it has
  // no pool to run. Which is also why maxHostedMachines > 0 requires this to be > 0 (credits.test).
  monthlyCreditUsd: number
}

export const PLAN_LIMITS: Record<TeamPlan, PlanLimits> = {
  free: {
    maxMembers: 1, maxAgents: 5, maxMachines: 1, maxHostedMachines: 0, maxProjects: 6, maxStorageBytes: 1024 ** 3,
    monthlyCreditUsd: 0,
  },
  pro: {
    maxMembers: 3, maxAgents: 15, maxMachines: 4, maxHostedMachines: 1, maxProjects: 20, maxStorageBytes: 20 * 1024 ** 3,
    monthlyCreditUsd: 7,
  },
}

// Pro's list price in cents, per billing period. The Stripe setup script mints its Prices from this
// and the buy button reads it, so what the page quotes and what the card is charged cannot drift.
// Yearly is 12 × $15.20 — the 20% discount lives in the amount rather than in a coupon, so the
// portal's monthly<->yearly switch keeps working.
export const PRO_PRICE_CENTS = { monthly: 1900, yearly: 18240 } as const

// The prepaid (Alipay/WeChat) term's price in CNY cents. Hand-set to round price points rather than
// computed from PRO_PRICE_CENTS at a live rate — repricing is a deploy, and the two lines may
// drift deliberately. CNY because the Stripe account (HK) may present WeChat Pay only in CNY or
// HKD, never USD.
export const PRO_PRICE_CENTS_CNY = { monthly: 13900, yearly: 132800 } as const

// Converts a top-up's USD total into the CNY a prepaid team is actually charged. Hand-maintained;
// the ledger stays in USD (metadata.creditUsd) — only the presentment currency changes.
export const TOPUP_CNY_PER_USD = 7.3

// When a prepaid term bought (or extended) at `fromMs` ends. Stripe-style month arithmetic, not
// +30/+365 days, so a prepaid year opens the same twelve monthly credit windows a yearly
// subscription would.
export const prepaidTermEndMs = (interval: BillingInterval, fromMs: number): number =>
  addUtcMonths(fromMs, interval === 'yearly' ? 12 : 1)

// Pro's card-required free trial: $0 today, auto-converts after TRIAL_PERIOD_DAYS.
export const TRIAL_PERIOD_DAYS = 7

// What the trial narrows, as one override on top of the plan rather than a plan of its own. A
// trialing team IS on pro — Stripe's `trialing` is a subscription status, not another price — so
// PLAN_LIMITS has no 'trial' row to keep in step with pro's every time pro moves.
//
// It is a taste along every axis, not only credits: the pool shrinks to roughly one built todo,
// managed inference serves DeepSeek alone (the pool-friendly vendor the allowance is sized against
// — the dear models would empty the trial pool in one task), and machines and agents cap below
// the plan's own numbers. All of it lifts the moment the trial converts. Vendors typed as
// string[] so gate code can .includes() a plain vendor string.
export const TRIAL_OVERRIDES = {
  monthlyCreditUsd: 2,
  maxMachines: 2,
  maxAgents: 5,
  managedVendors: ['deepseek'] as readonly string[],
} satisfies Partial<PlanLimits> & { managedVendors: readonly string[] }

// The override applied. Narrows, never widens — min(), so a plan whose own number already sits
// below the trial's keeps it. Every gate and every client reads its numbers through here, so a
// trial's effective limits are computed in exactly one place.
export const trialLimits = (limits: PlanLimits): PlanLimits => ({
  ...limits,
  monthlyCreditUsd: Math.min(limits.monthlyCreditUsd, TRIAL_OVERRIDES.monthlyCreditUsd),
  maxMachines: Math.min(limits.maxMachines, TRIAL_OVERRIDES.maxMachines),
  maxAgents: Math.min(limits.maxAgents, TRIAL_OVERRIDES.maxAgents),
})

export type BillingInterval = keyof typeof PRO_PRICE_CENTS

// What a year of Pro costs per month, for a page that compares the two intervals on one axis.
export const proMonthlyCents = (interval: BillingInterval): number =>
  interval === 'yearly' ? PRO_PRICE_CENTS.yearly / 12 : PRO_PRICE_CENTS.monthly

export const PRO_YEARLY_SAVING_PCT = Math.round(
  (1 - PRO_PRICE_CENTS.yearly / 12 / PRO_PRICE_CENTS.monthly) * 100,
)

export const teamPlanOf = (team: Pick<Team, 'plan'> | null | undefined): TeamPlan => team?.plan ?? 'free'

// The one gate for everything the platform pays for on a team's behalf: hosted machines, managed
// inference, and the top-ups that extend both.
export const planHasCreditPool = (plan: TeamPlan): boolean => PLAN_LIMITS[plan].monthlyCreditUsd > 0

// Whether the plan is paid at all. Distinct from planHasCreditPool on purpose: that one gates what
// the platform buys by the hour and meters out of the pool, this one gates what a paid tier simply
// includes. Todos-hosted repos are the latter — the platform stores and serves them, but they draw
// no credits, so binding them to the pool would tie "may keep a repo" to "has hours left". A tier
// above Pro inherits this by being non-free; it would have to opt out of the pool explicitly.
export const isPaidPlan = (plan: TeamPlan): boolean => plan !== 'free'

// When true, Free teams may create Todos-hosted repositories (provider: 'platform'). When false,
// hosted repos revert to a Pro-only feature and Free teams must connect a GitHub repository.
export const FREE_HOSTED_REPOS = true

// How many platform machines this team may hold. The single answer to that question on the server —
// no gate reads PLAN_LIMITS.maxHostedMachines directly, because a team's allowance is not always its
// plan's: a per-machine add-on (docs/pricing.md, Future tiers) is a licensed quantity on the same
// subscription, and when it lands it adds a term here rather than a branch at every call site.
//
// Takes the team, not the plan, for that reason — the add-on's quantity will live on the team
// document, written by the subscription webhook.
export const hostedMachineAllowance = (team: Pick<Team, 'plan'> | null | undefined): number =>
  PLAN_LIMITS[teamPlanOf(team)].maxHostedMachines

// User-facing plan names. The enum values are stable internal ids (ES values, Stripe lookup
// keys); what a tier is CALLED lives here and in the i18n copy, so renames never migrate data.
export const PLAN_DISPLAY_NAMES: Record<TeamPlan, string> = { free: 'Free', pro: 'Pro' }

// What the plan chip says, uppercased by the caller. A trial is its own badge rather than a third
// plan: entitlements still come from TeamPlan ('pro', trimmed by the TRIAL_* caps), and only the
// label separates the clock from the purchase. Reading PRO is how a team reaches day 7 unaware.
export type PlanBadge = TeamPlan | 'trial'

export const planBadgeOf = (team: Pick<Team, 'plan' | 'trialing'> | null | undefined): PlanBadge =>
  teamPlanOf(team) === 'free' ? 'free' : team?.trialing ? 'trial' : 'pro'

// Live subscription meta for the plan tab, read from Stripe at request time (Stripe stays the
// source of truth; nothing here is persisted).
export interface PlanBilling {
  interval: 'monthly' | 'yearly'
  periodEnd: number // epoch millis
  cancelAtPeriodEnd: boolean
  // Epoch millis the trial converts (or lapses, when cancelAtPeriodEnd). Null whenever the live
  // status is not 'trialing' — Stripe keeps trial_end set forever once a trial happened, so status
  // is what this field is derived from, not the raw timestamp.
  trialEnd: number | null
  // This trial ends in cancellation rather than a charge: no card is on file and the subscription
  // was created to cancel without one. A card-required trial never sets it, so the plain "converts
  // on {date}" copy is unchanged — but where it is true, saying that would be a lie, and offering
  // to end the trial early would walk the team into an uncollectable invoice.
  trialCancels?: boolean
  pastDue?: boolean
}

// The credit pool as the billing page shows it: credits, not dollars, and split by what consumed
// them. The split is what keeps credits from being a black box — "3,400 of 30,000 used" says
// nothing actionable, "2,100 on machines, 1,300 on inference" does.
export interface CreditUsage {
  granted: number
  toppedUp: number
  machineUsed: number
  inferenceUsed: number
  remaining: number
  periodEnd: number
}

// GET /api/teams/[teamId]/plan: the plan, its limits, and live usage against them.
export interface PlanUsage {
  plan: TeamPlan
  // The team's effective limits, not its plan's table row — read maxHostedMachines from here on the
  // client and an add-on that raises it needs no client change.
  limits: PlanLimits
  // `machines` counts every kind; `hostedMachines` is the platform-run subset of it, which is what
  // the add-a-machine control compares against limits.maxHostedMachines.
  usage: { members: number; agents: number; machines: number; hostedMachines: number; storageBytes: number }
  // Present when the team has an active subscription; null/absent otherwise.
  billing?: PlanBilling | null
  // Present only for a plan carrying a credit pool — a free team has no ledger at all.
  credits?: CreditUsage | null
  // May this checkout still be offered trial_period_days: the requesting user never used their
  // one trial AND this team never had a subscription. Decided server-side; the client only picks copy.
  trialEligible?: boolean
  // Present while a prepaid term (one-off Alipay/WeChat purchase) drives the plan. Unlike
  // `billing` there is no Stripe round trip behind it — ES is the term's authority.
  prepaid?: { until: number; interval: BillingInterval } | null
}

// Each user may create (be the admin of) at most this many free teams — an abuse guardrail
// against hoarding free capacity, not a billing lever (docs/pricing.md).
export const MAX_FREE_TEAMS_PER_USER = 3

// Agent-avatar DiceBear styles offered to teams — restricted to ones free for commercial use
// with NO attribution required (CC0 or Pablo-Stanley free). Single source for the zod enum and
// the client-side style registry.
export const AVATAR_STYLES = [
  'notionists', 'lorelei', 'openPeeps', 'avataaars', 'bottts',
  'thumbs', 'pixelArt', 'shapes', 'glass', 'identicon',
] as const
export type AvatarStyle = (typeof AVATAR_STYLES)[number]
export const DEFAULT_AVATAR_STYLE: AvatarStyle = 'notionists'

export interface TeamMember {
  id: string
  teamId: string
  actorId: string   // formerly agentId (stored both userId and agentId)
  memberType: 'agent' | 'user'
  role: 'admin' | 'member'
  joinedAt: number
}

// A pending email invitation to join a team. The token in the accept link is the sole credential
// (the invitee's GitHub email need not match `email`).
export interface TeamInvite {
  id: string
  teamId: string
  email: string
  role: 'member'
  token: string
  status: 'pending' | 'accepted' | 'revoked'
  invitedBy: string
  createdAt: number
  acceptedAt?: number
  acceptedBy?: string
}

// Public view of an invite (token stripped). Invite UI is currently unused.
export type TeamInvitePublic = Omit<TeamInvite, 'token'>

// ── GitHub integration ────────────────────────────────────────────────────────

export interface GithubInstallation {
  id: string                 // nanoid，ES 文档 id
  installationId: number     // GitHub App installation ID
  teamId: string
  accountLogin: string
  accountType: 'Organization' | 'User'
  createdAt: number
}

export interface GithubRepo {
  fullName: string           // "owner/repo"
  name: string
  defaultBranch: string
  private: boolean
  installationId: number
}

// GET /api/github/repos 响应
export interface GithubReposResponse {
  connected: boolean
  repos: GithubRepo[]
  // 已关联到本 team 的安装列表
  linkedInstallations?: Array<{ installationId: number; accountLogin: string }>
}

// GET /api/github/installations — the team's linked GitHub accounts, read from ES alone so an
// installation that no longer exists on GitHub still shows up (and can be disconnected).
export interface GithubInstallationsResponse {
  installations: Array<Pick<GithubInstallation, 'installationId' | 'accountLogin' | 'accountType'>>
}

// Branch list response (GET /api/projects/[id]/branches)
export interface GithubBranchesResponse {
  branches: string[]
  defaultBranch: string      // GitHub 当前默认分支
  // Conv working branches resolved to their todo, so pickers can show "#12 Fix header" instead of
  // tds/conv-<uuid>. Best-effort: a missing entry means the build or todo is gone (deleted,
  // rewound away) and the branch shows as its raw name.
  branchTodos?: Record<string, BranchTodoRef>
  // Last commit time per branch (epoch ms) for pickers that show branch recency. Sparse by design:
  // platform repos report every branch's head committer date, GitHub-hosted ones only the conv
  // branches whose build confirmed a push (GitHub's branch list carries no dates).
  branchTimes?: Record<string, number>
  // Set when the caller's ?resolve=<ref> names a conv branch that no longer exists (its build
  // never pushed, or the branch was cleaned up) but the same todo has a live current build
  // branch — the Files page redirects there instead of showing a 404.
  staleRef?: { requested: string; currentBranch: string; todo: BranchTodoRef }
}

export interface BranchTodoRef {
  seqNum: number
  title: string
  updatedAt: number
}

// ── API key (user-level credential) ─────────────────────────────────────────

// Sentinel stored in ApiKey.mcpTools meaning "every current MCP tool, and any added later". A
// full-access key stores just this instead of the enumerated list, so a newly added tool reaches
// it without a re-save. sanitizeMcpTools collapses a full selection to it; resolveMcpTools expands
// it back to the live catalog.
export const MCP_ALL_TOOLS = '*'

export const GIT_SCOPES = ['read', 'write'] as const
export type GitScope = (typeof GIT_SCOPES)[number]

export interface ApiKey {
  id: string
  userId: string
  keyHash: string   // sha256(rawKey); never returned to the client
  prefix: string    // first chars of rawKey, for display
  name: string
  createdAt: number
  lastUsedAt: number | null
  mcpTools?: string[]   // MCP tool allowlist. Absent/empty = MCP disabled; [MCP_ALL_TOOLS] = every
                        // current tool (follows the catalog as it grows); else the exact subset enabled.
  gitScopes?: GitScope[]  // Platform git-host access. Absent/empty = git disabled; 'write' always
                          // implies 'read' (sanitizeGitScopes enforces the invariant on every save).
  // Onboarding setup token (prefix tdss_): a short-lived key handed to the user's own coding agent
  // so it can finish setup unattended. Both fields are set together or not at all. The token carries
  // no mcpTools and no gitScopes, so the MCP and git-host channels refuse it on their existing
  // empty-allowlist checks — its whole reach is machine enrollment plus the /api/setup routes.
  expiresAt?: number       // epoch ms; verifyApiKeyToken refuses the key from this moment on
  setupTeamId?: string     // the one team this token may act on; its presence marks a setup token
}

// A setup token's lifetime. Long enough for an agent to install the CLI, enrol, hunt for model
// credentials and retry a failed step; short enough that a prompt left in a chat log goes stale.
export const SETUP_TOKEN_TTL_MS = 30 * 60 * 1000

// Machine enrollment API request/response types

export interface EnrollMachineResponse {
  machineId: string
  teamId: string
  token: string
}

export interface EnrollStartResponse {
  requestId: string
  verificationUrl: string
}

export type EnrollPollStatus = 'pending' | 'ready' | 'expired'
export interface EnrollPollResponse {
  status: EnrollPollStatus
  machineId?: string
  teamId?: string
  token?: string
}

// ── Legacy / existing types ────────────────────────────────────────────────────

// The runtime list is the single source; TodoPhase derives from it.
export const TODO_PHASES = [
  "todo",
  "queued",
  "planning",
  "confirm",
  "plan_reviewing",
  "building",
  "review",
  "implement_reviewing",
  "done",
  "failed",
  "closed",
] as const
export type TodoPhase = (typeof TODO_PHASES)[number]

// What a step does — a separate axis from TodoPhase (where the todo sits). The machine runs a
// StepKind; stepPhaseOf maps a todo step to the todo phases it drives. 'chief' is the account-level
// orchestrator turn: it belongs to no todo, has no track and drives no todo phase.
export type TodoStepKind = 'plan' | 'plan_revision' | 'implement' | 'implement_revision' | 'plan_review' | 'implement_review' | 'merge'
export type StepKind = TodoStepKind | 'chief'
export type MergeStatus = 'clean' | 'resolved'

// StepKind is shorthand for these axes; this table is their single source, so call sites
// read `trackOf(k) === 'plan'` instead of `k === 'plan' || k === 'plan_revision'`. StepKind is the
// stored discriminator (Message.phase / build_run.phase / SSE).
//  - track:  which side of the build the turn operates on (plan vs implement)
//  - sink:   where the output lands — the chat thread, a review turn folded into the chat thread,
//            or the chief conversation (no todo advancement at all)
export type StepTrack = 'plan' | 'implement'
type StepPhaseDef = {
  busy: Extract<TodoPhase, "planning" | "building">
  rest: Extract<TodoPhase, "confirm" | "review">
}
export type ProducingStepKind = Exclude<TodoStepKind, 'plan_review' | 'implement_review'>
type ProducingStepDef = { track: StepTrack; sink: 'chat'; phase: StepPhaseDef }
type ReviewStepDef = { track: StepTrack; sink: 'review' }
type ChiefStepDef = { sink: 'chief' }
export const STEP_DEF: Record<ProducingStepKind, ProducingStepDef> & Record<'plan_review' | 'implement_review', ReviewStepDef> & Record<'chief', ChiefStepDef> = {
  plan:               { track: 'plan',      sink: 'chat',     phase: { busy: "planning", rest: "confirm" } },
  plan_revision:      { track: 'plan',      sink: 'chat',     phase: { busy: "planning", rest: "confirm" } },
  implement:          { track: 'implement', sink: 'chat',     phase: { busy: "building", rest: "review" } },
  implement_revision: { track: 'implement', sink: 'chat',     phase: { busy: "building", rest: "review" } },
  merge:              { track: 'implement', sink: 'chat',     phase: { busy: "building", rest: "review" } },
  plan_review:        { track: 'plan',      sink: 'review' },
  implement_review:   { track: 'implement', sink: 'review' },
  chief:              { sink: 'chief' },
}
export const trackOf = (k: TodoStepKind): StepTrack => STEP_DEF[k].track

// Review steps run a read-only reviewer turn (an AI reviewer critiquing the plan/changes). Their
// reviewer message lands in the chat thread, but they never advance the todo or touch its
// branch/session — the producer revision they auto-trigger does that.
export const isReviewStep = (k: StepKind): k is 'plan_review' | 'implement_review' => STEP_DEF[k].sink === 'review'
export const isTodoStep = (k: StepKind): k is TodoStepKind => k !== 'chief'
// Producing = a todo-advancing builder turn (chat sink). Excludes review AND chief turns.
export const isProducingStep = (k: StepKind): k is ProducingStepKind => STEP_DEF[k].sink === 'chat'

// The review StepKinds as a list, for ES terms queries — derived from STEP_DEF so it can't
// drift from isReviewStep.
export const REVIEW_STEP_KINDS = (Object.keys(STEP_DEF) as StepKind[]).filter(isReviewStep)

// Agent actively working — complete/close are blocked (server) and the checkbox is locked (client).
// 'queued' is excluded: completing a queued todo cancels its pending build instead. The reviewing
// phases are an AI reviewer running over a confirm/review gate; they count as busy but their exit
// paths are explicit — see restPhaseOf.
export const BUSY_PHASES: TodoPhase[] = ["planning", "building", "plan_reviewing", "implement_reviewing"]

// An AI reviewer turn is running; the todo returns to its confirm/review gate when the round ends.
export const isReviewingPhase = (p: TodoPhase): boolean =>
  p === "plan_reviewing" || p === "implement_reviewing"

// Todo phases with a build turn pending or running: BUSY_PHASES plus 'queued' (enqueued, waiting
// on machine capacity).
export const ACTIVE_BUILD_PHASES: TodoPhase[] = ["queued", ...BUSY_PHASES]

// 'close' rejects busy phases and done (accepted work); closed stays out — repeat closes are no-ops.
export const isCloseRejectedPhase = (p: TodoPhase): boolean => BUSY_PHASES.includes(p) || p === "done"

// 'complete' rejects busy phases and closed (dropped work); done stays out — repeat completes re-stamp.
export const isCompleteRejectedPhase = (p: TodoPhase): boolean => BUSY_PHASES.includes(p) || p === "closed"

// 'reset' drops every build and returns the todo to un-started: anything that has run, done
// included. todo has nothing to drop; closed goes back through reopen first.
export const isResettablePhase = (p: TodoPhase): boolean => p !== "todo" && p !== "closed"

// Build is no longer a state machine — Todo.phase is the single source of truth and a build
// only *recommends* the todo forward. STEP_DEF is the single source for the todo phases a
// producing step drives — `busy` while it runs, `rest` once it lands and awaits the user —
// plus the notification raised. Call sites read this instead of re-deriving the
// plan/implement split.
export const stepPhaseOf = (k: ProducingStepKind): StepPhaseDef => STEP_DEF[k].phase

// The gate a step settles at when its turn ends without advancing the todo (a cancelled producer,
// a finished/crashed reviewer): the plan track parks at confirm, the implement track at review.
// Every reviewing-phase exit path derives its target from this — nothing stores "which gate".
export const restPhaseOf = (k: TodoStepKind): Extract<TodoPhase, "confirm" | "review"> =>
  trackOf(k) === "plan" ? "confirm" : "review"

// The user gate a phase rests at — or, for the reviewing phases, is being reviewed over. Narrower
// than revisionSideForPhase (failed has no gate) and trackForPhase (busy producing phases have
// none): this names only where the todo would park if every turn stopped now.
export const gateForPhase = (p: TodoPhase | null): Extract<TodoPhase, "confirm" | "review"> | null =>
  p === "confirm" || p === "plan_reviewing" ? "confirm"
    : p === "review" || p === "implement_reviewing" ? "review"
    : null

// Terminal = user-owned end states. Pipeline-driven transitions (build progress, claim,
// terminate) must never resurrect a todo that has reached one of these.
export const TERMINAL_TODO_PHASES: TodoPhase[] = ["done", "failed", "closed"]
export const isTerminalTodoPhase = (p: TodoPhase): boolean => TERMINAL_TODO_PHASES.includes(p)

// Phases that can't start a build: already in the pipeline. The single gate
// shared by the trigger core, the chief dispatch routes, and the ProposalCard's row state.
// done/failed/closed/review/todo are deliberately absent: triggering a build there is a rerun — a
// brand-new build from the default branch, demoting the previous one to history (operational todos
// like "merge and release" run repeatedly this way; closed is the same revive as done).
// The schedule sweep alone passes through this gate: a due cycle takes over an unfinished build
// (the trigger cancels it) instead of waiting for a user to clear the pipeline.
export const UNBUILDABLE_TODO_PHASES: ReadonlySet<TodoPhase> =
  new Set([...ACTIVE_BUILD_PHASES, "confirm"])

// A build the todo no longer points at (a rerun superseded it) is read-only history: it must not
// start turns or accept writes. The single predicate for every guard so the condition can't
// drift; defensive on legacy docs with no latestBuildId.
export const isBuildSuperseded = (todo: Pick<Todo, "latestBuildId">, buildId: string): boolean =>
  !!todo.latestBuildId && todo.latestBuildId !== buildId
export const SUPERSEDED_BUILD_ERROR = "A newer build has started for this task"

// Hibernation: a finished step left the todo awaiting the user (confirm a plan / review an
// implementation). Late pipeline failures must not clobber these — only explicit user actions do.
export const isAwaitingUser = (p: TodoPhase): boolean => p === "confirm" || p === "review"

// Which revision track a phase accepts when the user types into the composer: a hibernating `confirm`
// takes plan revisions, `review`/`failed` take implement revisions (a failed build stays conversational
// and resumes on the implement side), anything else (busy/terminal) takes none. The reviewing phases
// accept their gate's revision — typing over an in-flight review preempts it (RESUME_GATE cancels the
// reviewer). Shared by the build panel and the plan-doc overlay so the plan/implement split lives in
// one place.
export const revisionSideForPhase = (p: TodoPhase | null): 'plan' | 'implement' | null =>
  p === "confirm" || p === "plan_reviewing" ? "plan"
    : (p === "review" || p === "failed" || p === "implement_reviewing") ? "implement"
    : null

// Which phases a checkpoint rewind is offered at: the gates where the user is the one holding the
// turn. A busy phase is server-rejected (409) and a terminal one has nothing left to rewind into.
export const canRestoreInPhase = (p: TodoPhase | null): boolean =>
  p === "confirm" || p === "review" || p === "failed"

// The build track a phase belongs to across its whole lifecycle: plan spans planning → confirm,
// implement spans building → review (a failed build parks on the implement side). Unlike
// revisionSideForPhase — which names only the resting gate where the composer accepts input — this
// also covers the busy phase, so the plan-doc overlay keeps showing a track's feedback list while the
// agent is still working (read-only until the phase rests at its gate).
export const trackForPhase = (p: TodoPhase | null): StepTrack | null =>
  p === "planning" || p === "confirm" || p === "plan_reviewing" ? "plan"
    : (p === "building" || p === "review" || p === "failed" || p === "implement_reviewing") ? "implement"
    : null

// The revision track a standalone status note (todo closed / reopened / completed) lands on: the plan
// side covers queued → confirm, the implement side the rest — the note shows on the thread tab where
// the work last rested.
export const noteTrackForPhase = (p: TodoPhase | null): TodoStepKind =>
  p === "queued" || p === "planning" || p === "confirm" || p === "plan_reviewing" ? "plan_revision" : "implement_revision"

export type ProjectMemberRole = "owner" | "member" | "viewer"

export type ProjectProvider = 'github' | 'platform' | 'external' | 'none'

// The ONE place that knows docs created before the provider field existed are GitHub projects.
// Never compare project.provider inline — read it through this (or a predicate below) so a future
// provider extends the union and the compiler finds every dispatch site.
export function projectProviderOf(p: { provider?: ProjectProvider | null }): ProjectProvider {
  return p.provider ?? 'github'
}

// The repo carries GitHub's collaboration surface (PRs, Actions, refs/contents APIs, installation
// tokens). Platform-hosted — and any future self- or custom-hosted — repos have none of it: gate
// every GitHub API touch on this, never on `!== 'platform'`.
export function isGithubProject(p: { provider?: ProjectProvider | null }): boolean {
  return projectProviderOf(p) === 'github'
}

// Unbound projects have no repo at all (empty repoFullName/repoUrl/defaultBranch): anything that
// touches the repo must check this first. Binding is a one-way link-repo transition.
export function isUnboundProject(p: { provider?: ProjectProvider | null }): boolean {
  return projectProviderOf(p) === 'none'
}

export function isPlatformProject(p: { provider?: ProjectProvider | null }): boolean {
  return projectProviderOf(p) === 'platform'
}

// The repo lives on a git server the user runs or rents (GitLab, Gitea, …): Todos hosts no copy
// of it. The machine clones and pushes with the stored credential; a server-side read (files,
// history, branches) has git-host fetch the repo on demand with that credential into a
// short-lived cache, and the change review's diff comes from the report the machine uploaded at
// the end of the turn (MachineChangesReport).
export function isExternalProject(p: { provider?: ProjectProvider | null }): boolean {
  return projectProviderOf(p) === 'external'
}

// The clone URL of an external repo, normalized — or null when it is not one we can use. http is
// allowed (an intranet server is often plain http); credentials belong in their own fields.
export function parseExternalRepoUrl(raw: string): string | null {
  let url: URL
  try { url = new URL(raw.trim()) } catch { return null }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null
  const path = url.pathname.replace(/\/+$/, '')
  return path ? `${url.origin}${path}` : null
}

// Sent when the username is left blank: Basic auth needs a non-empty one, and GitLab access tokens,
// Gitea and Azure DevOps read only the token. Gitee, Bitbucket and GitLab deploy tokens need a real one.
export const EXTERNAL_REPO_DEFAULT_USERNAME = 'oauth2'

// Conservative subset of git's ref-name rules, enough to keep a typed branch out of option and
// refspec syntax: slash-separated parts of letters, digits and . _ - that neither start with a dot
// or dash nor end in a dot or ".lock". Whether the branch exists is the remote's to say.
export function isSafeBranchName(name: string): boolean {
  return name.length <= 200 && name.split('/').every(part =>
    /^[\p{L}\p{N}_][\p{L}\p{N}._-]*$/u.test(part) && !/\.\.|\.$|\.lock$/.test(part))
}

export function assertNever(x: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(x)}`)
}

export interface Project {
  id: string
  teamId: string
  name: string
  provider: ProjectProvider
  repoFullName: string       // github: "owner/repo" · platform: "<teamId>/<repoSlug>" · external: "" (a mirror slug on docs from before 2026-10-06, until drop-external-mirrors clears it) · none: ""
  repoUrl: string            // github: "https://github.com/owner/repo" · platform: "<git host>/<repoFullName>" · external: the user's clone URL · none: ""
  defaultBranch: string      // none: ""
  installationId: number | null  // GitHub App installation ID; null for platform-hosted and unbound
  description: string | null
  iconUrl: string | null     // uploaded object-store icon; null → generated initial badge
  nextSeqNum: number
  createdAt: number
}

// ── Repo browsing (file viewer) ─────────────────────────────────────────────
// Wire shapes for the platform repo-browser routes. `git ls-tree -r` emits only leaves
// (blob, or commit = submodule pointer); directories are reconstructed client-side from
// path prefixes, which is faithful since git tracks no empty directories.

export interface RepoTreeEntry {
  path: string
  type: 'blob' | 'commit'
  mode: string
  size: number | null  // null for submodules
}

export interface ProjectTreeResponse {
  sha: string  // the ref resolved to its commit sha
  truncated: boolean
  entries: RepoTreeEntry[]
}

export interface ProjectCommit {
  sha: string
  shortSha: string
  authorName: string
  authorEmail: string
  authoredAt: number  // unix seconds
  subject: string
}

export interface ProjectCommitsResponse {
  resolvedSha: string
  commits: ProjectCommit[]
  nextCursor: string | null  // next page's ?ref= value; null = end of history
}

export interface Tag {
  id: string
  projectId: string
  name: string
  color: string | null
  createdAt: number
  // Response-only: the ES _seq_no of the read/write that produced this doc — the LWW version
  // clients use to keep whichever copy (event snapshot or refetch) is newer. Never persisted.
  v?: number
}

export interface ProjectMember {
  id: string
  projectId: string
  memberType: 'user' | 'agent'  // formerly 'type: human | agent'
  role: ProjectMemberRole
  createdAt: number
  actorId: string | null        // references tds_actors
  displayName: string | null    // denormalized, kept for display without actor lookup
  email: string | null          // denormalized, kept for display without actor lookup
}

// The phase an agent runs in. 'build' is the canonical/default; future stages (review,
// test…) just extend this union and the map below — no data-structure change.
export type AgentPhase = 'plan' | 'build'

// The durable user choice stored on a todo. Model/provider deliberately do NOT live here: every
// new turn resolves them from the current AgentActor, then snapshots the result onto the run.
export interface AgentSelection {
  agentId: string
  // Per-phase thinking override; null/absent = agent's current default.
  thinkingLevel?: string | null
}

// Assignment IS the durable phase→selection map. `build` is required (default + fallback for any
// phase without its own selection); other phases optional.
export interface AgentAssignment {
  build: AgentSelection
  plan?: AgentSelection
}

// Complete, immutable config for one model-running turn. Unlike AgentSelection, provider/model are
// required: the server resolves them from AgentActor before it creates a run or queue job.
export interface AgentRunConfig {
  agentId: string
  provider: string
  modelId: string
  thinkingLevel?: string
}

// plan/revision/plan_review steps run on the plan track; implement* run the build agent.
export function agentPhaseOf(step: TodoStepKind): AgentPhase {
  return trackOf(step) === 'plan' ? 'plan' : 'build'
}

// The selection effective for a phase: its own, falling back to build. Null = unassigned.
export function assignedAgent(a: AgentAssignment | null | undefined, phase: AgentPhase): AgentSelection | null {
  return a?.[phase] ?? a?.build ?? null
}

// The plan-side todo phases: a todo here (before the plan is confirmed) runs its plan agent and shows
// on the plan step; every later phase runs the build agent. Single source for this phase set, shared
// by the todo enrichment, the step meter, and revision routing.
export const PLAN_SIDE_TODO_PHASES: ReadonlySet<TodoPhase> = new Set(['queued', 'planning', 'confirm', 'plan_reviewing'])
export const isPlanSideTodoPhase = (phase: string | null | undefined): boolean =>
  !!phase && (PLAN_SIDE_TODO_PHASES as ReadonlySet<string>).has(phase)
// The agent slot effective for a todo in this phase (plan-side → plan, else build).
export const agentPhaseForTodo = (phase: TodoPhase): AgentPhase => (isPlanSideTodoPhase(phase) ? 'plan' : 'build')

// The default/primary agent (build). For non-phase-aware callers: notifications, sync/info,
// restore, recover.
export function primaryAgentId(a: AgentAssignment | null | undefined): string | null {
  return a?.build?.agentId ?? null
}

// Does the assignment involve this agent in any phase? Used by crash recovery.
export function assignmentHasAgent(a: AgentAssignment | null | undefined, agentId: string): boolean {
  return !!a && Object.values(a).some(e => e?.agentId === agentId)
}

// Call at every assignment write boundary: persist only user choices (never a stale runtime model),
// collapse a redundant plan===build selection, and null out an assignment with no build agent.
export function normalizeAssignment(a: AgentAssignment | null | undefined): AgentAssignment | null {
  if (!a?.build?.agentId) return null
  const selection = (e: AgentSelection): AgentSelection => ({
    agentId: e.agentId,
    ...(e.thinkingLevel != null && e.thinkingLevel !== '' ? { thinkingLevel: e.thinkingLevel } : {}),
  })
  const out: AgentAssignment = { build: selection(a.build) }
  // Same agent with no plan-specific override is just the build fallback. Keep the selection when its
  // thinking override is the reason the plan slot was materialized.
  if (a.plan && (a.plan.agentId !== a.build.agentId || (a.plan.thinkingLevel != null && a.plan.thinkingLevel !== ''))) out.plan = selection(a.plan)
  return out
}

export const TODO_SCHEDULE_KINDS = ['hourly', 'daily', 'weekly', 'once'] as const
export type TodoScheduleKind = (typeof TODO_SCHEDULE_KINDS)[number]

// Every way a due cycle can end — the only signal the UI has to explain "why didn't it run".
// 'skipped_busy' means a closed todo (shelved by the user — a schedule never revives it) or a
// phase race at trigger time; an unfinished build never skips a cycle, it is taken over.
// 'skipped_offline' means the team had no machine that could take the step: firing anyway would
// only write a turn that fails on the spot, in a thread nobody is sitting in front of.
export type TodoScheduleOutcome = 'started' | 'skipped_busy' | 'skipped_quota' | 'skipped_no_agent' | 'skipped_offline' | 'failed'

// The client-editable half. weekday follows Date#getDay()/cron: 0 = Sunday. The wall-clock
// fields drive the recurring kinds; a 'once' rule carries only its absolute instant.
export interface TodoSchedulePreset {
  kind: TodoScheduleKind
  minute?: number // 0-59; required for hourly/daily/weekly
  hour?: number // 0-23; required for daily/weekly
  weekday?: number // 0-6; required for weekly
  at?: number // epoch ms; required for once
  // IANA zone captured client-side at save time — occurrences follow the owner's wall clock.
  tz: string
  // Pin every build this schedule fires to one machine (strict binding — queues while it is
  // offline, never falls back). Null/absent = automatic selection.
  machineId?: string | null
  // Run every fired build as this team agent at this thinking level. Null/absent = the todo's own
  // assignment.
  agent?: AgentSelection | null
}

// An auto-rerun rule (tds_todo_schedules): each row independently fires a fresh build for its
// todo. Recurring kinds live forever; a 'once' rule is deleted the moment its run starts (until
// then it retries every sweep tick). A todo may carry several. teamId/projectId are denormalized at create time —
// teamId scopes the team list, projectId rides project-deletion cascades. Management is gated
// on the todo's CURRENT owner (resolved per request, never stored here). nextRunAt/lastFiredAt/
// lastOutcome are server-maintained; lastFiredAt stamps every claimed cycle, not just starts.
export interface TodoSchedule extends TodoSchedulePreset {
  id: string
  teamId: string
  projectId: string
  todoId: string
  nextRunAt: number
  lastFiredAt?: number
  lastOutcome?: TodoScheduleOutcome
  createdBy: string
  createdAt: number
  updatedAt: number
  // Response-only: the anchored todo's list summary (GET /api/schedules?team=...). Never persisted.
  todo?: { seqNum: number; title: string; phase: TodoPhase; projectName?: string; ownerId: string } | null
}

export interface Todo {
  id: string
  projectId: string
  tagIds: string[]
  title: string
  spec: string
  phase: TodoPhase
  // Phase before the last complete/close — consumed (and cleared) by uncomplete/reopen
  prevPhase?: TodoPhase | null
  orderIndex: number
  seqNum: number
  createdAt: number
  // Last content/phase mutation (tag-deletion cascades deliberately excluded).
  updatedAt: number
  // Last time the phase actually changed — stamped only by setTodoPhase on a real transition,
  // unlike updatedAt which also moves on pure content edits. Absent on legacy docs; readers
  // fall back to updatedAt. The watch-wake turn tier's due cursor.
  phaseAt?: number
  // Last time a turn started running (or queued) for this todo — stamped by setTodoPhase on
  // every transition into queued/planning/building. Absent until the todo first runs.
  lastRunAt?: number
  // Actor id of the creator: a user (typed it) or an agent (the agent created it as follow-up
  // work from a build it ran). Resolve the actor to tell which.
  createdBy: string
  // The human accountable for this todo — always a user actor, never an agent. Defaults to the
  // creator (or the human behind an agent-created todo); reassignable to any human team member.
  // All todo notifications go to the owner.
  ownerId: string
  // The todo whose build created this one as follow-up work — drives the "From #<seq>"
  // provenance in the detail view. Absent unless a build agent's create_todo made it.
  sourceTodoId?: string
  // Stable id of the agent source that created this todo — the chief's id, `mcp:<keyId>`, or the
  // creating build's id. Absent for human-created todos; also keys the 24h creation cap.
  sourceBuildId?: string
  // The todo's current build (drives the build tab: BuildView vs the NoBuild start view).
  // Persisted and maintained by setTodoPhase — set on createBuild, explicitly null when a
  // checkpoint restore rewinds the todo back to its un-started state.
  latestBuildId?: string | null
  // Whether the latest build has produced a plan / a changes doc — the todo cards badge these
  // without loading any build. Persisted; maintained by setTodoPhase's artifacts option
  // (advanceTodoAfterStep feeds it from the build's refs, a new build or a rewind to un-started
  // clears both). Absent on todos whose builds predate the fields — reads as "no badge" until the
  // next step (or the backfill script) stamps them.
  hasPlan?: boolean
  hasChanges?: boolean
  assignment?: AgentAssignment | null
  // Response-only: the source todo resolved from sourceTodoId (seqNum + title), so the detail
  // view can show provenance without loading the whole list. Set by GET /api/todos/[id].
  sourceTodo?: { seqNum: number; title: string } | null
  // Response-only: the todo's project name + effective agent, so an inline #<seq> reference's
  // hover card renders without extra lookups. Set by GET /api/todos/[id]; never persisted.
  projectName?: string
  agent?: { displayName: string; avatarUrl: string | null } | null
  // Response-only: past builds for this todo (reruns), newest first. Set by
  // GET /api/todos/[id]; never persisted in ES.
  buildHistory?: BuildHistoryEntry[]
  // Response-only: the ES _seq_no of the read/write that produced this doc — the LWW version
  // clients use to keep whichever copy (event snapshot or refetch) is newer. Never persisted.
  v?: number
}

// One row of a todo's run history — the fields the history list renders. A projection of
// Build (tds_builds), resolved per detail request; never persisted on the todo.
export interface BuildHistoryEntry {
  id: string
  createdAt: number
  withPlan: boolean
  // Present when this build produced a plan — lets a rerun offer "reuse the previous plan".
  planDocId?: string | null
  prUrl?: string | null
  errorMessage?: string | null
  // Summed model-call usage across this build; absent when no call was reported.
  usage?: RunUsage
}

// A lean todo row for the composer's `#` mention picker (GET /api/todos?teamId=<id>): enough to
// filter by seq/title and label a row. Never persisted.
export interface TeamTodoOption {
  id: string
  seqNum: number
  title: string
  projectId: string
  projectName: string
  phase: TodoPhase
  // Same instant the progress board card prints (boardCardAt).
  updatedAt: number
}

// An operation record for a todo — who did what, when. Stored in its own index
// (tds_todo_events), one doc per mutation, read on demand by the activity modals.
export type TodoEventAction = 'create' | 'close' | 'reopen' | 'complete' | 'uncomplete' | 'update' | 'update_agent' | 'owner' | 'phase' | 'reset'

export interface TodoEvent {
  id: string
  todoId: string
  projectId: string
  action: TodoEventAction
  // The actor that performed it (references tds_actors); actorType tells user vs agent apart.
  // Absent on pipeline-driven 'phase' events (no actor performed them) — the activity modals
  // filter by actorType, so those never surface there; the chief catch-up digest reads them.
  actorId?: string
  actorType?: 'user' | 'agent'
  // action-specific snapshot: {title} | {from,to} | {slot,fromAgentId,toAgentId} | {fields}
  payload?: Record<string, unknown>
  createdAt: number
}

// One runtime's transcript. A conversation holds at most one active session; a runtime handoff or
// a cross-session rewind REPLACES it (never mutates the id), so BuildRun.sessionId stays a stable key.
// The id names the native session on the machine and the mirror object under the conversation.
export interface ConversationSession {
  id: string
  runtime: AgentRuntime
  openedAt: number
}

// sessionId = the session the leaf belongs to; a leaf from another session cannot be applied, so a
// restore across sessions carries only the commit (code-only) and the conversation opens a fresh one.
export type RestoreCheckpoint = { commitSha?: string; sessionLeafEntryId?: string; sessionId?: string }
export type EnsureRestoreStatus = 'ready' | 'pending' | 'offline' | 'error'

// Which front started a build: the user route, the chief's run_builds, an external MCP caller
// (same tool path as the chief, but with nobody reporting back — so it keeps the user-facing
// notifications the chief suppresses), or the schedule sweep. Fixed at birth.
export type BuildTriggerSource = 'user' | 'chief' | 'schedule' | 'mcp'

// A build is a durable artifact, not a state machine: it records the conversation and
// the produced plan. "Is a step running / what phase is the work in" lives on Todo.phase
// (single source of truth) and build_run.status (per-step activity) — never here.
export interface Build {
  id: string
  todoId: string
  // false = direct build (straight to implement, no plan step). Fixed at birth.
  withPlan: boolean
  // The active session (see ConversationSession). Opened by the first persistent turn; replaced
  // when a turn runs on another runtime (handoff) or a rewind crosses into an older session. Null
  // between a cross-session rewind and the next turn.
  session?: ConversationSession | null
  // The todo phase this build was triggered from (a rerun starts from done/failed/review/todo).
  // Fixed at birth — unlike Todo.prevPhase, no later user action rewrites it — so doRestoreCleanup
  // can trust it when the whole conversation is rewound away. Absent on legacy builds.
  prevPhase?: TodoPhase | null
  // Chief-triggered builds send the owner no progress notifications (the chief watches and
  // reports instead — notifyBuildEvent). Absent on legacy builds = 'user' (always notify).
  triggerSource?: BuildTriggerSource
  // Strict machine binding, fixed at birth: every turn of this build runs on exactly this machine,
  // never falling back to another. A turn sent while it is off fails on the spot instead of
  // queueing (a sleeping hosted machine is woken rather than refused); a turn already enqueued when
  // it went quiet waits for it to come back. Null/absent = automatic selection (selectStepMachine's
  // affinity/load policy).
  pinnedMachineId?: string | null
  // Reference to the latest plan Document (tds_documents). Null until a plan lands / for
  // direct builds. The plan text lives only on the Document — implement prompts load it by id.
  planDocId: string | null
  // Reference to the latest changes Document (tds_documents, kind:'changes') — the anchor for
  // AI change-review findings. Null until an implement turn lands with code changes. The diff
  // itself is read from the git provider at the doc's (baseSha, headSha), not stored here.
  changesDocId?: string | null
  errorMessage: string | null
  createdAt: number
  // PR opened on completion (approve). Null until the build is approved with code changes.
  // GitHub projects only; platform-hosted repos have no PR concept.
  prUrl?: string | null
  prNumber?: number | null
  // Set true when the merge flow lands this build on the default branch (both providers).
  // The terminal marker for platform builds, which never carry prUrl.
  merged?: boolean
  // Machine-reported diff identity vs base: sha256 of `git diff --raw`; null/absent means no diff.
  // Drives Submit PR vs Done and dedupes changes documents.
  diffHash?: string | null
  // The end-of-turn checkpoint push's outcome, carried on /done (the push is synchronous on the
  // machine). branchPushedAt = last CONFIRMED successful push; pushError = last reported failure,
  // cleared on the next success. Both absent until a new-enough CLI reports (legacy builds) —
  // unknown, never assumed success.
  branchPushedAt?: number | null
  pushError?: string | null
  // Lazy rewind: a checkpoint-restore truncates ES immediately but defers the machine's physical
  // worktree/session rewind. While set, the worktree + conv branch still hold the rewound-away commits;
  // every worktree consumer gates through ensurePhysicalRestore, which lands it on this checkpoint via
  // a pure restore step, then clears it.
  pendingRestore?: RestoreCheckpoint | null
  // External-runtime rewind handoff: the checkpoint's session leaf, stamped when the restore step is
  // enqueued and consumed (cleared) by the next turn's assembler as step.resumeSessionAt. Separate
  // from pendingRestore, which clears at the restore step's own done — before that turn assembles.
  pendingSessionResumeAt?: string | null
  // Monotonic rewind counter, bumped by truncateBuildHistory AFTER the deletes land. The /messages
  // snapshot guard: within an epoch history only grows, so clients merge same-epoch snapshots
  // (absence = snapshot lag, never a deletion), replace on a bump, and discard older-epoch ones.
  historyEpoch?: number
  // Model-call usage across this build's runs, one row per provider/model, largest first —
  // rewritten from tds_build_runs whenever a run's telemetry lands (rewound and cancelled runs
  // included: spend only grows). Absent until a call reports usage; the total is sumUsage(rows).
  usageByModel?: ModelUsage[]
  // Response-only: the ES _seq_no of the read/write that produced this doc — the LWW version
  // clients use to keep whichever copy (event snapshot or refetch) is newer. Never persisted.
  v?: number
}

// A Document is a durable, reviewable artifact an agent produces during a build (the plan
// today; research/design later). Its markdown lives here as the single source of truth;
// conversation messages reference it with a `[label](doc:<id>)` marker, and implement
// prompts load the plan text from it by id.
// 'dispatch' belongs to the chief conversation (buildId = chief.id): it holds a dispatch
// JSON payload (stateless — the card derives live state from the todos).
// 'question' belongs to either a build or the chief conversation: an ask_user JSON payload
// (stateless like dispatch — the card derives answerability from the todo's live phase).
export type DocumentKind = 'plan' | 'changes' | 'dispatch' | 'question' | 'confirm' | 'input'
export interface ChangesSummary {
  files: Pick<DiffFile, 'path' | 'additions' | 'deletions'>[]
  additions: number
  deletions: number
}

export interface Document {
  id: string
  buildId: string
  kind: DocumentKind
  content: string
  version: number
  createdAt: number
  agentId?: string
  // For kind:'changes' (content stays empty; /documents/[id]/diff reads the git provider at
  // (baseSha, headSha)): stored +add −del (and per-file counts) so the version switcher does not
  // have to fetch every sibling diff. Written with the document (or with the first baseSha pin);
  // absent on plans.
  changesSummary?: ChangesSummary
  // For kind:'changes': sha256 of the captured cumulative diff.
  diffHash?: string
  // For kind:'changes': the turn's checkpoint commit — the head the diff is rebuilt from.
  headSha?: string
  // For kind:'changes': the merge-base the diff reads against, pinned when the doc is written, or
  // on the first successful pre-merge provider read if that missed (defaultBranch...headSha stops
  // straddling the change once the build merges; this keeps history readable forever).
  baseSha?: string
  // For kind:'question': the user's recorded card selections, index-aligned with the payload's
  // questions, plus the stamp of when they were submitted. Written once, after the turn the answer
  // sends is accepted; a rewind past that turn clears both so the card reopens.
  answer?: QuestionAnswer[]
  answeredAt?: number
  // For turn cards: the proposing turn, so acting on the card can cite the conversation that asked.
  runId?: string
}

// One question's recorded answer. `chosen` holds option labels, plus the OTHER_OPTION sentinel when
// the auto-appended free-text row was picked (its text lands in `other`) — a sentinel rather than the
// word so an agent option literally named "Other" can't collide. The card records its selections
// verbatim, so this shape is protocol, not a render detail.
export const OTHER_OPTION = '__other__'
export interface QuestionAnswer { chosen: string[]; other?: string }
// Ceilings on what one ask_user call may ask, shared by the tool's parameter schema and the answer
// it comes back as, so the two can't drift.
export const MAX_ASK_USER_QUESTIONS = 3
export const MAX_ASK_USER_OPTIONS = 4
// Ceiling on either side of one edit_plan replacement — a plan is a few KB, so anything near this
// is the whole plan pasted in, which the <plan> block is for.
export const PLAN_EDIT_MAX_CHARS = 40_000
export type StorageContainer = 'builds' | 'assets' | 'resources' | 'git'
// 'git' rows account for platform-hosted repos on the git host's disk; every other container is
// backed by the object store and can be addressed through the ObjectStorage adapter.
export type ObjectStoreContainer = Exclude<StorageContainer, 'git'>
export type StorageOwnerType = 'team' | 'user' | 'unowned'
export type StorageObjectCategory =
  | 'attachment' | 'build_session' | 'chief_session' | 'diff' | 'skill_file'
  | 'project_icon' | 'agent_avatar' | 'user_avatar' | 'git_repo' | 'unknown'
export type StorageObjectStatus = 'active' | 'missing'
export type AttachmentReferenceStatus = 'pending' | 'active' | 'orphaned'

// Provider-neutral directory entry for one physical object. container is a logical application name,
// mapped to an actual bucket by the active storage adapter. Category-specific fields live on this same
// row so there is exactly one source for both ownership and byte accounting.
export interface StorageObject {
  id: string
  container: StorageContainer
  key: string
  category: StorageObjectCategory
  ownerType: StorageOwnerType
  ownerId?: string
  sizeBytes: number
  objectStatus: StorageObjectStatus
  createdAt: number
  updatedAt: number
  lastVerifiedAt?: number
  referenceStatus?: AttachmentReferenceStatus
  lastReferencedAt?: number
}

// ── Chief (team-level orchestrator) ───────────────────────────────────────────
// One per (user, team): the orchestrator's CONFIG — agent, charter, machine pin — scoped to a
// single team like the team's machines and agents. Its conversations are ChiefThreads (several per
// chief). For a chief that had history before threads existed, its own id doubles as the id of its
// legacy thread, so that history never had to move; a chief created since has uuid threads only —
// the chief id is nanoid-tailed and pi may refuse it as a session id (see chiefThreadIdOf).

export interface Chief {
  id: string            // chiefIdOf(userId, teamId) — deterministic, so getOrCreate is conflict-safe
  userId: string
  teamId: string
  agent: AgentSelection | null
  // Strict machine binding for chief turns (same contract as Build.pinnedMachineId): every turn
  // queues on exactly this machine, never falling back. Null/absent = automatic selection.
  machineId?: string | null
  // User-authored standing instructions (routing rules, priorities); injected into every turn.
  // The chief has no write path to it — its own experience goes to the memory document instead.
  charter: string
  // The most recent finished turn across every thread — what the memory-tidy sweep reads to find
  // bound, active chiefs. The per-thread digest watermark is ChiefThread.lastTurnAt.
  lastTurnAt: number | null
  createdAt: number
  // Device timezone (IANA) piggybacked on the user's latest chief message; feeds the turn
  // prompt's current-time line. Absent until the first post-rollout message.
  tz?: string
  // Model for context-compaction summaries, any entry from the team catalog. Null/absent = the
  // chief's own model. A faster model here shortens the in-loop wait a compaction blocks on.
  compactionModel?: { provider: string; modelId: string } | null
  /** @deprecated moved to ChiefThread; read once when the legacy thread row is created lazily. */
  pendingRestore?: RestoreCheckpoint | null
  /** @deprecated moved to ChiefThread. */
  historyEpoch?: number
  /** @deprecated moved to ChiefThread. */
  toolDefHashes?: Record<string, string>
  /** @deprecated moved to ChiefThread. */
  convCursors?: Record<string, ConversationCursor>
  /** @deprecated moved to ChiefThread. */
  toolResultHashes?: Record<string, string>
}

// One chief conversation. The id is the conversation key everywhere a build id would go
// (tds_messages.buildId, build_run.buildId, the SSE channel) AND the pi session key, so threads
// run turns concurrently and rewind independently. Config (agent, charter, memory) is the chief's.
export interface ChiefThread {
  id: string            // chiefThreadIdOf(uuidv7) — doubles as the pi session id; a pre-split chief's legacy thread keeps its chief's id
  chiefId: string
  userId: string
  teamId: string
  // The active session; same contract as Build.session.
  session?: ConversationSession | null
  // Null until the first user message auto-titles it or the user renames it.
  title: string | null
  // The single emoji the user picked as the topic's icon; absent or null keeps the hash glyph.
  emoji?: string | null
  createdAt: number
  // Last activity (send, finished turn, rename) — the sidebar's sort key.
  updatedAt: number
  // Digest watermark: phase events after this feed the next turn's catch-up. Set to the run's
  // createdAt on finalize, so events during a turn belong to the next one — none lost or repeated.
  // A rewind rolls it back to the kept turn so the digest doesn't skip re-surfaced events.
  lastTurnAt: number | null
  // Lazy rewind marker, same mechanism as Build.pendingRestore: ES truncates now, the physical
  // session truncate is deferred to the next turn. A reset stamps an empty checkpoint ({}) to clear
  // the session; a mid-history rewind stamps the kept turn's sessionLeafEntryId.
  pendingRestore?: RestoreCheckpoint | null
  // External-runtime rewind handoff — same contract as Build.pendingSessionResumeAt.
  pendingSessionResumeAt?: string | null
  // Monotonic rewind counter — same contract as Build.historyEpoch.
  historyEpoch?: number
  // Per-tool hashes of the remote tool defs the last turn shipped (name → short sha256). A deploy
  // that changes a def makes the next turn's prompt carry a stale-conclusions notice — a long
  // conversation anchors on its own earlier statements about tool parameters otherwise. Updated
  // fire-and-forget at assembly (same tolerance as Chief.tz).
  toolDefHashes?: Record<string, string>
  // Incremental-read cursors for the conversation tool, keyed by todoId: the newest transcript
  // position already shown to this thread (see agent-tools/conversation.ts). Bounded to the most
  // recently active entries; _source only.
  convCursors?: Record<string, ConversationCursor>
  // Short hashes of the last render this thread saw of the full-roster tools (agents/machines),
  // keyed by tool name — an identical repeat read short-circuits to one line (dedupUnchanged).
  // Cleared with convCursors on compaction/rewind (clearChiefReadState); _source only.
  toolResultHashes?: Record<string, string>
}

export const CHIEF_THREADS_PER_CHIEF_MAX = 50
export const CHIEF_THREAD_TITLE_MAX_CHARS = 120
export { CHIEF_THREAD_EMOJI_MAX_CHARS, isSingleEmoji } from './emoji'

// Thread ids share the chief's prefix so isChiefConversationId keeps selecting the chief kind for
// every thread. The nonce is a uuidv7 minted server-side (newChiefThreadId; the generator stays
// out of this package): the id is also the pi session id, whose rule — start and end alphanumeric
// — a nanoid tail broke one time in 32.
export const chiefThreadIdOf = (nonce: string): string => `chief-${nonce}`

// The last (createdAt, id) transcript position a chief was shown of a todo's latest build —
// the tuple matches loadMessages' sort order. buildId scopes it: a re-dispatch resets the read.
export interface ConversationCursor {
  buildId: string
  at: number
  id: string
}

export const chiefIdOf = (userId: string, teamId: string): string => `chief-${userId}-${teamId}`

// The conversation-kind seam as a pure predicate — the `chief-` prefix is an implementation detail
// of chiefIdOf, so callers that must pick an index/branch by kind go through this, not a bare startsWith.
export const isChiefConversationId = (id: string): boolean => id.startsWith('chief-')

// ── Todo watches (chief todo subscriptions) ───────────────────────────────────
// One row per (userId, todoId): id = todoWatchId so watch/unwatch is idempotent. Created by an
// explicit watch_todos call, or automatically for every chief-dispatched build (the counterpart
// of chief builds suppressing owner notifications). A watch wakes the chief thread that armed it
// each time a turn parks the todo at a rest gate (confirm/review — where it waits on a human) and
// once when it settles; the settle wake consumes (deletes) the row unless a schedule rule runs the
// todo again — such a standing watch re-arms and hears every run until the rule is gone. Readiness
// is the watched todo's live phase, read at delivery time; armedAt is the one piece of delivery
// state.
export interface TodoWatch {
  id: string
  userId: string
  todoId: string
  // The thread the wake lands in. Absent on rows written before threads existed — those belong to
  // the user's legacy thread for the todo's team (chiefIdOf); a legacy thread the
  // migrate-chief-thread-ids script re-id'd stamps its rows with the new id.
  threadId?: string
  createdAt: number
  // Why the chief is watching — shown to the user and echoed into the wake prompt.
  reason?: string
  // Gate due cursor: a rest phase entered after armedAt is due; re-armed to the fire time on
  // each gate wake. Initial = createdAt; legacy rows fall back to createdAt.
  armedAt?: number
  // A review round on the watched todo died at its gate (reviewer turn failed, or the critique's
  // auto-revision never started) — no phase moves, so the failure is stamped here and the drain
  // delivers it as its own due category, clearing the stamp to null. Last failure wins between
  // drains; a stamp a newer turn superseded (busy phase / later park) clears without a wake.
  reviewFailedAt?: number | null
  reviewFailedError?: string | null
}

export const todoWatchId = (userId: string, todoId: string): string => `${userId}:${todoId}`

// A one-shot timed chief check-in (set_wake): at wakeAt the chief gets a wake-up turn carrying
// the note, then the row is deleted. Deliberately decoupled from todos — the note is
// self-contained (todo references ride as chips in its text), so the wake outlives any todo it
// mentions and a promise made about work running outside the platform survives that work's
// dispatch todo settling. Several may be pending per thread; id is a nanoid, never deterministic —
// overwriting a slot would silently drop an earlier promise.
export interface ChiefWake {
  id: string
  userId: string
  teamId: string
  // The thread the wake lands in; absent on pre-thread rows, which belong to the legacy thread
  // (stamped with the new id when migrate-chief-thread-ids re-ids that thread).
  threadId?: string
  wakeAt: number
  // What to check and report when it fires — echoed into the wake prompt verbatim.
  note: string
  createdAt: number
}

// ── User feedback ────────────────────────────────────────────────────────────
// One ticket per submission from /feedback: the body plus the reply thread it grew. `content` and
// every message embed attachment markers like a todo spec, so screenshots ride the existing team
// attachment pipeline. Status follows from who spoke last: a reply from the reporter puts the
// ticket back in the support queue (open), a reply from staff hands it back (answered), and either
// side can close it. A reply to a closed ticket reopens it by the same rule.
export type FeedbackKind = 'bug' | 'feature' | 'other'
export type FeedbackStatus = 'open' | 'answered' | 'closed'
export type FeedbackAuthorRole = 'user' | 'staff'

export interface FeedbackMessage {
  id: string
  authorId: string
  authorRole: FeedbackAuthorRole
  content: string
  createdAt: number
}

// Name and avatar of someone in a ticket thread. Deliberately not the full actor: a reporter must
// be able to see which staff member answered without seeing their email.
export interface FeedbackAuthor {
  name: string
  avatarUrl: string | null
}

export interface Feedback {
  id: string
  userId: string
  teamId: string
  kind: FeedbackKind
  content: string
  status: FeedbackStatus
  messages: FeedbackMessage[]
  context: FeedbackContext
  createdAt: number
  updatedAt: number
  closedAt?: number
  // Response-only, staff view only: signed URLs for the markers in `content` and every message,
  // for the web console, which has no preview client. The app resolves its own through
  // /api/attachments/preview, which admits staff.
  attachments?: { key: string; url: string }[]
  // Response-only: display refs for every authorId in the thread, keyed by id.
  authors?: Record<string, FeedbackAuthor>
  // Response-only, staff view only: who filed this, so support knows who they're answering.
  reporter?: { name: string; email: string }
}

export interface FeedbackContext {
  url: string
  userAgent: string
  locale?: string
}

export interface FeedbackReplyResult {
  feedback: Feedback
  // Whether the reporter's notification email went out. null when none was due — a reporter's own
  // reply notifies nobody. false is reported, not swallowed: the reply landed, the email didn't.
  emailSent: boolean | null
}

// A crash report as stored: the client's payload plus what only the server can know. userId is null
// for an anonymous report — the sign-in screen and the window before session restore are exactly
// where a crash is most likely to go unexplained, so the endpoint does not require a session.
export interface ClientError extends ClientErrorReport {
  id: string
  userId: string | null
  // Arrival time. Separate from occurredAt, which the device stamped; a queued report has both.
  createdAt: number
}

// Group dispatch items with identical run configs so each (project, withPlan, reusePlan, agent)
// batch goes through one builds trigger call. Shared by the run_builds route and the ProposalCard's
// Run button so the two batching semantics can't drift.
export interface DispatchGroup { projectId: string; withPlan: boolean; reusePlan: boolean; agent?: DispatchItem['agent']; machineId?: string; todoIds: string[] }
export function groupDispatchItems(items: DispatchItem[], projectIdOf: (todoId: string) => string): DispatchGroup[] {
  const groups = new Map<string, DispatchGroup>()
  for (const item of items) {
    const projectId = projectIdOf(item.todoId)
    const key = [projectId, !!item.withPlan, !!item.reusePlan, item.agent?.agentId ?? '', item.agent?.thinkingLevel ?? '', item.machineId ?? ''].join('|')
    const group = groups.get(key) ?? { projectId, withPlan: !!item.withPlan, reusePlan: !!item.reusePlan, agent: item.agent, machineId: item.machineId, todoIds: [] }
    group.todoIds.push(item.todoId)
    groups.set(key, group)
  }
  return [...groups.values()]
}

// A kind:'dispatch' Document's parsed payload (authored by the retired propose_builds tool,
// kept so old conversations still render): items + optional summary. Shared by
// the server's chip hydration (which pre-resolves the referenced todos) and the ProposalCard renderer
// so both agree on what counts as a valid proposal.
export interface Proposal { items: DispatchItem[]; summary?: string }
export function parseProposal(content: string): Proposal | null {
  try {
    const parsed = JSON.parse(content) as Proposal
    return Array.isArray(parsed?.items) ? parsed : null
  } catch {
    return null
  }
}

export const MAX_DISPATCH_ITEMS = 20

// A kind:'question' Document's parsed payload: the ask_user questions. todoId (build-scoped
// questions only) lets the card's submit-time phase fallback fetch the todo without a build->todo
// hop; the build/chief kind itself comes from the document's buildId (isChiefConversationId).
// Shared by the ask_user tool and QuestionCard. The user's answer is NOT in here — it lands on the
// document's own `answer` field, so the agent-authored payload stays immutable. Size ceilings and
// the answer shape live with Document (MAX_ASK_USER_QUESTIONS, QuestionAnswer).
export interface AskUserOption { label: string; description?: string }
export interface AskUserQuestion { question: string; header?: string; multiSelect?: boolean; options: AskUserOption[] }
export interface QuestionPayload { questions: AskUserQuestion[]; todoId?: string }
export function parseQuestionPayload(content: string): QuestionPayload | null {
  try {
    const parsed = JSON.parse(content) as QuestionPayload
    return Array.isArray(parsed?.questions) ? parsed : null
  } catch {
    return null
  }
}

// A kind:'confirm' Document's parsed payload: a destructive action a chief tool proposed, gated on
// the user's explicit click rather than the model's own judgment. `action` discriminates the handler
// in the decision endpoint; `items` is a uniform list the card renders without action-specific logic.
export interface ConfirmItem { id: string; label: string; subtitle?: string; detail?: string }
export interface ConfirmPayload { action: string; items: ConfirmItem[]; reason?: string }
export function parseConfirmPayload(content: string): ConfirmPayload | null {
  try {
    const parsed = JSON.parse(content) as ConfirmPayload
    return parsed && typeof parsed.action === 'string' && Array.isArray(parsed.items) ? parsed : null
  } catch {
    return null
  }
}

// A kind:'input' Document's parsed payload: a form card where the user fills in values that should
// not enter the conversation (secrets, credentials). `action` discriminates the handler in the input
// endpoint and the form the card renders; action-specific fields ride alongside.
export interface InputPayload { action: string; [key: string]: unknown }
export interface SetSecretInput extends InputPayload {
  action: 'set_secret'
  mode: 'create' | 'update'
  name: string
  description: string
  secretId?: string
  // A project-scoped secret; absent = team-level. The name is for the card to show.
  projectId?: string
  projectName?: string
}
// The chief's proposed connection; the card lets the user adjust it and fill the credential values,
// which never enter the conversation. credentialKeys are the header (http) / env (stdio) names.
export interface AddMcpServerInput extends InputPayload {
  action: 'add_mcp_server'
  transport: McpServerTransport
  label: string
  slug: string
  url?: string
  command?: string
  args?: string[]
  credentialKeys: string[]
}
// The chief's proposed edit to a stored connection. label/url/command/args are the form's starting
// values — the row as stored, with the proposed changes applied. The card is the settings edit
// form: storedKeys are the credential names already on the row (values are never fetched), which
// the user replaces or removes there; credentialKeys are new names proposed as blank rows.
// oauth: only the label is editable.
export interface UpdateMcpServerInput extends InputPayload {
  action: 'update_mcp_server'
  serverId: string
  transport: McpServerTransport
  slug: string
  oauth: boolean
  label: string
  url?: string
  command?: string
  args?: string[]
  storedKeys: string[]
  credentialKeys: string[]
}
export function parseInputPayload(content: string): InputPayload | null {
  try {
    const parsed = JSON.parse(content) as InputPayload
    return parsed && typeof parsed.action === 'string' ? parsed : null
  } catch {
    return null
  }
}

// ── Agent memory ──────────────────────────────────────────────────────────────
// Structured per-entry memory owned by an AgentActor. Stored as one file per entry in the team's
// `_agents` git repo (memories/<agentId>/<id>.md — not a tds_documents kind). Written only
// through save_memory/delete_memory on the agent's own turns;
// an admin can edit or delete entries from the agent's page, never author new ones. No projectId
// means the entry applies to every project the agent works in; set, it narrows to that project.
export const MEMORY_ENTRY_TITLE_MAX_CHARS = 80
// A few sentences an injected turn can act on, not a report — sized so two merged entries still
// fit, else the consolidation the cap below demands is physically impossible.
export const MEMORY_ENTRY_CONTENT_MAX_CHARS = 1200
// Hard cap per agent: at the cap save_memory refuses new entries and demands consolidation —
// the bounded size is the curation mechanism, same role CHIEF_MEMORY_MAX_CHARS used to play.
export const MAX_MEMORY_ENTRIES_PER_AGENT = 100
export const MAX_MEMORY_IDS_PER_CALL = 20
// Per-turn budget for the injected <memory> block; entries past it degrade to title-only index
// lines the agent can fetch with memories.
export const MEMORY_INJECT_BUDGET_CHARS = 10_000
// Pressure threshold against either cap above: at this percentage the save/delete usage hint and
// the proactive tidy sweep both start pushing for consolidation — one number, two surfaces.
export const MEMORY_PRESSURE_PCT = 80

export interface AgentMemoryEntry {
  id: string
  agentId: string
  teamId: string
  // Absent = applies everywhere this agent works; set = scoped to one project.
  projectId?: string
  title: string
  content: string
  // Best-effort provenance for the audit UI — where this was learned. Never required.
  sourceTodoId?: string
  sourceBuildId?: string
  // Legitimately short-lived state (an overnight authorization, a deploy pin) declares its own
  // end: past this instant the entry stops being injected and is purged on the agent's next save.
  expiresAt?: number
  createdAt: number
  updatedAt: number
}

// ── User prompts ──────────────────────────────────────────────────────────────
// The composer prompt library's editable half: what one person keeps saying to the chief, in their
// own words. Scoped to (userId, teamId) — the same pairing a Chief has, and for the same reason:
// what you keep asking is about the work in front of you, and that changes with the team. Nobody
// else in the team sees these. Flat by design — no folders, no tags, no manual order.
// The library's UI is retired; the routes, the index and the rows people already saved stay.
export const USER_PROMPT_TITLE_MAX_CHARS = 80
// A composer insert, not a document: long enough for a full task spec, short enough that the list
// stays a list of snippets.
export const USER_PROMPT_CONTENT_MAX_CHARS = 4000
// Per author, per team — not a shared team allowance. The list has no pagination, so this is also
// the search size.
export const MAX_USER_PROMPTS_PER_TEAM = 200

export interface UserPrompt {
  id: string
  userId: string
  teamId: string
  // Optional: the row falls back to content's first line. Saving one costs a single field — naming
  // it is a nicety, and demanding a name is what stops people from saving at all.
  title?: string
  content: string
  createdAt: number
  updatedAt: number
}

// Todos one create_todo source (a chief, an external MCP key, or a build) may create per rolling
// 24h (a lifetime cap does not fit a long-lived caller, which would hit it permanently).
export const ACCOUNT_TODO_DAILY_CAP = 100

// Open (non-terminal) todos a project may hold. Guards runaway backlog growth; terminal todos are
// history and stay uncounted — a healthy long-lived project accumulates them without limit.
export const MAX_OPEN_TODOS_PER_PROJECT = 400

export interface TriggerBuildResponse {
  buildIds: string[]
}

// One identity for the build composer's optimistic bubble and its persisted message. Keeping the
// scoping rule shared prevents the browser and route from silently drifting to different ids.
export const buildUserMessageId = (buildId: string, clientMessageId: string): string =>
  `${buildId}:${clientMessageId}`

export type BuildStepResponse = { ok: true; runId?: string }

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  patch: string
  // Standard-context (hunk) tier only: the full-context patch for this file can be fetched from
  // /api/documents/[id]/diff/file. Absent on full-context patches.
  canExpand?: boolean
}

export interface DiffResponse {
  isGit: boolean
  files: DiffFile[]
  // Provider-rebuilt responses: the merge-base commit the hunks diff against — the base ref for
  // per-file full-context expansion.
  mergeBaseSha?: string
  // The change set's head commit. Immutable, so raw reads keyed on it (image previews) may be
  // cached forever, unlike the conv branch the hosts otherwise pass.
  headSha?: string
  // 'unavailable': a diff the provider could not answer (no reachable commit, a merged change with
  // no pinned base, provider down) — unlike an empty `files`, which means the trees are identical.
  unavailableReason?: 'too_large' | 'unavailable'
  limitBytes?: number
  actualBytes?: number
}

// ── Skills ───────────────────────────────────────────────────────────────────

export interface SkillFile {
  name: string    // filename, e.g. "SKILL.md", "examples.md"; stored at skills/{skillId}/{name} in the team's agents repo
}

export interface Skill {
  id: string
  teamId: string
  name: string
  description: string
  files: SkillFile[]
  createdAt: number
  updatedAt: number
  source?: string // GitHub directory URL when imported from GitHub; absent for folder uploads
}

// A skill's versions: agents-repo commits that touched skills/<id>/, newest first. A commit's sha
// is the ?ref= that reads the skill and its files as of that version.
export interface SkillHistoryResponse {
  commits: ProjectCommit[]
  nextCursor: string | null
}

// ── Team secrets ──────────────────────────────────────────────────────────────
// Write-only team credentials injected as env vars into every build step's bash tool. The name
// doubles as the env var key; the value is AES-GCM-encrypted at rest and never returned after
// creation (overwrite or delete only). A secret is team-level (every project's tasks) or scoped
// to one project: that one reaches only its project's tasks, and shadows a team-level secret of
// the same name there. Names are unique per scope.

export const TEAM_SECRET_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
// Per scope: the team level, and each project on its own.
export const TEAM_SECRET_MAX_PER_TEAM = 50
export const TEAM_SECRET_MAX_VALUE_BYTES = 64 * 1024
export const TEAM_SECRET_MAX_DESCRIPTION_CHARS = 500

export interface TeamSecret {
  id: string
  teamId: string
  // Absent = team-level. Immutable like the name: moving a secret is a delete and a new one.
  projectId?: string
  name: string
  description: string
  encryptedValue: string // base64(iv|tag|ciphertext); server-only, excluded from every read route
  createdAt: number
  updatedAt: number
  createdBy: string
}

export type TeamSecretPublic = Omit<TeamSecret, 'encryptedValue'>

// ── Model providers ───────────────────────────────────────────────────────────
// Team-level LLM provider credentials, managed on the website and stored encrypted server-side.
// Credentials never reach a machine at rest: the server decrypts at claim time and rides the
// values on the claim response only (StepModelConfig), the same purity rule as team secrets.
// Deliberately its own index, not tds_team_secrets: an agent's secrets:['*'] grant injects the
// whole secrets library into bash env, which must never include provider keys.

export const MODEL_PROVIDER_API_TYPES = [
  'openai-completions',
  'openai-responses',
  'anthropic-messages',
  'google-generative-ai',
] as const
export type ModelProviderApi = (typeof MODEL_PROVIDER_API_TYPES)[number]

// Custom provider ids share a namespace with pi's builtin provider ids on the executor's registry.
export const MODEL_PROVIDER_ID_RE = /^[a-z][a-z0-9_-]*$/
export const MODEL_PROVIDER_MAX_PER_TEAM = 20

// Every credential here ends up in an HTTP header — an API key as `Authorization: Bearer <key>`,
// a custom header as its own value — and WHATWG Headers only accept Latin-1. A CJK character
// (U+8DEF = 36335) makes undici throw "Cannot convert argument to a ByteString" while *building*
// the request, so nothing is ever dialed and the failure surfaces at build time rather than at
// save time. Narrowed past Latin-1 to printable ASCII: no real key or header value needs more,
// and CR/LF in a header value is request splitting. Validated at every write path so a paste of
// the wrong thing (a gateway console's "线路…" label instead of the token) is refused up front.
export const HEADER_SAFE_VALUE_RE = /^[\x20-\x7E]*$/

// Managed inference: the providers a team does not configure. They have no row in
// tds_model_providers and never will — the credential a step gets for one is that machine's own
// token, minted per claim, which a stored row could not hold. The catalog synthesizes them for
// teams whose plan carries a credit pool, and resolveStepModelConfig points them at the server's
// own gateway. The platform's vendor keys stay server-side; reselling API access is not permitted,
// and the executor never sees them.
//
// Which vendors and models are actually offered, and what each costs, lives in one server-side
// registry (apps/server/src/lib/managedInference.ts). Only the naming rule is shared: a managed
// provider id is this prefix plus the vendor. Stored AgentActor.provider values are these strings,
// so 'todos-deepseek' is load-bearing and cannot be renamed.
export const MANAGED_PROVIDER_PREFIX = 'todos-'
export const MANAGED_PROVIDER_LABEL = 'Todos (included)'

// The prefix is a reserved namespace: CreateModelProviderRequestSchema refuses it for custom rows,
// so nothing a team can create is ever mistaken for managed inference here.
export const isManagedProvider = (providerId: string): boolean => providerId.startsWith(MANAGED_PROVIDER_PREFIX)

// One gateway route per vendor, so each keeps its own upstream base URL and platform key. The
// executor is handed the full URL at claim time and never persists it.
export const managedGatewayPath = (vendor: string): string => `/api/machine/gateway/${vendor}`

// OAuth-only builtins the website can connect via device flow. Everything else builtin is API key.
export const OAUTH_MODEL_PROVIDERS = ['github-copilot', 'openai-codex'] as const

// Builtins the OAuth login route accepts. xai is the first that takes both an API key and a
// subscription sign-in (SuperGrok / X Premium), so it is connectable there without being OAuth-only.
// A team still gets one row per providerId: connecting the subscription replaces an xAI API key.
export const OAUTH_CAPABLE_MODEL_PROVIDERS = [...OAUTH_MODEL_PROVIDERS, 'xai'] as const

export type ModelProviderKind = 'builtin_api_key' | 'builtin_oauth' | 'custom'

// pi ModelDefinition passthrough: only the fields the website edits are typed; server-derived
// builtin defs carry whatever pi ships (thinkingLevelMap, cost, …) untouched.
export interface ModelProviderModelDef {
  id: string
  name?: string
  reasoning?: boolean
  input?: ('text' | 'image')[]
  contextWindow?: number
  maxTokens?: number
  [k: string]: unknown
}

// Over openai-completions, reasoning and the answer share max_tokens, so pi's stock 16384 lets a
// deep thinking phase eat the whole response and end the turn on `length` with no tool call.
// Reasoning models default to the floor builtin catalogs use for such models instead.
export const defaultMaxTokens = (reasoning: boolean | undefined): number => (reasoning ? 64_000 : 16_384)

// pi's registerProvider requires the fields its models.json parser would default — mirror those
// defaults (model-registry.js parseModels) so server catalog and executor register identical defs.
export function fillModelDefDefaults(def: ModelProviderModelDef): ModelProviderModelDef {
  return {
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    ...def,
    name: def.name ?? def.id,
    reasoning: def.reasoning ?? false,
    input: def.input ?? ['text'],
    contextWindow: def.contextWindow ?? 128000,
    maxTokens: def.maxTokens ?? defaultMaxTokens(def.reasoning),
  }
}

// A custom row's model def as pi registers it: the row's compat, plus adaptive thinking for an
// anthropic-messages model that declares xhigh/max. Those levels exist only on adaptive-thinking
// Claudes, and without the flag pi sends a token budget instead of an effort level and folds
// xhigh/max into high — the relay sees no level and max behaves exactly like high.
export function customModelDef(row: { api?: string; compat?: ModelProvider['compat'] }, def: ModelProviderModelDef): ModelProviderModelDef {
  const adaptive = row.api === 'anthropic-messages' && def.thinkingLevelMap != null
  return { ...fillModelDefDefaults(def), compat: adaptive ? { ...row.compat, forceAdaptiveThinking: true } : row.compat }
}

// The decrypted content of ModelProvider.encryptedCredential. 'none' = keyless custom endpoint
// (local gateway); the executor injects a placeholder key to satisfy pi's registerProvider.
export type ModelProviderCredential =
  | { type: 'api_key'; key: string }
  | { type: 'oauth'; access: string; refresh: string; expires: number; [k: string]: unknown }
  | { type: 'none' }

export interface ModelProvider {
  id: string
  teamId: string
  kind: ModelProviderKind
  // builtin_*: pi's provider id (e.g. 'openai', 'github-copilot'). custom: user-chosen id.
  providerId: string
  label: string
  encryptedCredential: string // base64(iv|tag|ciphertext) of ModelProviderCredential JSON; server-only
  // Custom providers only: non-sensitive definition, stored in the clear.
  baseUrl?: string
  api?: ModelProviderApi
  authHeader?: boolean
  headers?: Record<string, string>
  compat?: { supportsDeveloperRole?: boolean }
  models?: ModelProviderModelDef[]
  // builtin_oauth only: display metadata readable without decrypting.
  oauthExpiresAt?: number
  // Set when a server-side refresh hit invalid_grant — the stored refresh token is dead and the
  // user must reconnect on the website. Cleared by a successful re-login.
  oauthBroken?: boolean
  createdAt: number
  updatedAt: number
  createdBy: string
}

export type ModelProviderPublic = Omit<ModelProvider, 'encryptedCredential'>

// ── MCP servers ───────────────────────────────────────────────────────────────
// Team-scoped MCP tool sources for agents (the opposite direction of /api/mcp, where todos itself
// is the server). Two transports: remote streamable HTTP (url + optional auth headers) and local
// stdio (a command the executor spawns per step). Same at-rest rules as tds_model_providers:
// credentials are AES-GCM ciphertext, excluded from every read route, decrypted at claim time and
// riding the claim response only — never the queued step, never an executor's disk.

export const MCP_SERVER_TRANSPORTS = ['http', 'stdio'] as const
export type McpServerTransport = (typeof MCP_SERVER_TRANSPORTS)[number]

// Also the tool-name prefix (mcp__<slug>__<tool>) — same charset as MODEL_PROVIDER_ID_RE so it
// stays a safe, short segment of a provider tool-call name. Unique per team.
export const MCP_SERVER_SLUG_RE = /^[a-z][a-z0-9_-]*$/
export const MCP_SERVER_MAX_PER_TEAM = 20
export const MAX_MCP_SERVERS_PER_AGENT = 10

// The credentials an executor can connect with. Either bag may be empty (a public HTTP endpoint, a
// keyless local tool).
export type McpServerStaticCredential =
  | { type: 'http'; headers: Record<string, string> }
  | { type: 'stdio'; env: Record<string, string> }

// A one-click connection (http only). Never leaves the server: it alone refreshes, and the claim
// hands the executor a plain `Authorization: Bearer` http credential. The rest is what a refresh
// needs, fixed at connect time — the client registration (a CIMD URL client_id, or a DCR result
// that may carry a secret), the authorization server with its metadata, the RFC 8707 resource.
export interface McpServerOAuthCredential {
  type: 'oauth'
  accessToken: string
  refreshToken?: string
  // epoch ms; absent = the vendor stated no expiry.
  expiresAt?: number
  scope?: string
  // The signed-in account's email, from the id_token of a login that asked for `openid email`.
  account?: string
  client: { client_id: string; client_secret?: string; [k: string]: unknown }
  authorizationServerUrl: string
  authorizationServerMetadata?: Record<string, unknown>
  resource?: string
}

// The decrypted content of McpServer.encryptedCredential.
export type McpServerCredential = McpServerStaticCredential | McpServerOAuthCredential

export interface McpServer {
  id: string
  teamId: string
  label: string
  // Stable slug (MCP_SERVER_SLUG_RE), unique per team — also the tool-name prefix. Immutable.
  slug: string
  transport: McpServerTransport
  // http only.
  url?: string
  // stdio only. Non-sensitive definition, stored in the clear (same split as ModelProvider.baseUrl
  // vs its credential) — secret values the process needs go in env, inside encryptedCredential.
  command?: string
  args?: string[]
  encryptedCredential: string // base64(iv|tag|ciphertext) of McpServerCredential JSON; server-only
  // UI hint only (answers "does this row carry any headers/env" without a decrypt).
  hasCredential: boolean
  // The credential bag's KEY names (header names / env var names), stored in the clear so the edit
  // form can show what exists — values stay ciphertext-only. Kept in lockstep with
  // encryptedCredential by the store's single write path. Absent on pre-field rows.
  credentialKeys?: string[]
  // 'oauth' marks a one-click connection; absent = the transport's own bag (pre-field rows too).
  credentialType?: 'oauth'
  // The connection-catalog entry this row was connected from (CONNECTION_CATALOG id). Absent on
  // custom connections — including one whose URL matches an entry, until it is upgraded.
  catalogId?: string
  // The stored refresh token is dead: the row is skipped at claim until an admin reconnects.
  oauthBroken?: boolean
  // An OAuth login's account and granted scope, in the clear for display — written with the
  // credential. Absent where the vendor names neither, and on rows connected before the fields.
  oauthAccount?: string
  oauthScope?: string
  createdAt: number
  updatedAt: number
  createdBy: string
}

export type McpServerPublic = Omit<McpServer, 'encryptedCredential'>

// Queued-step metadata for one granted server — no credential (BullMQ payload). The executor
// connects with this plus the claim-response-only credential below.
export interface StepMcpServerRef {
  id: string
  label: string
  slug: string
  transport: McpServerTransport
  url?: string
  command?: string
  args?: string[]
}

// Claim-time enrichment (secretEnv's sibling): decrypted per granted server, response-only, never
// queued, never logged. Best-effort — a server whose credential failed to decrypt is absent here
// and the executor skips connecting to it rather than running half-configured.
export interface StepMcpServerCredential {
  id: string
  credential: McpServerStaticCredential
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 'build_question' | 'build_reply' | 'plan_ready' | 'build_review' | 'build_failed' | 'merge_blocked' | 'agent_notice' | 'todo_assigned' | 'schedule_failed' | 'payment_failed' | 'subscription_cancelled' | 'chief_message'

export interface Notification {
  id: string
  teamId: string
  userId: string
  type: NotificationType
  // todoId for build notifications; the thread's id for chief_message
  entityId: string
  // Denormalized so clients render and deep-link without extra fetches.
  entityRef: { title: string; projectId?: string; seqNum?: number }
  agent: { name: string; avatarUrl: string | null } | null
  snippet: string | null
  readAt: number | null
  createdAt: number
  channels?: string[]
}

// Sentinel userText stored when a plan is confirmed; clients localize it at render.
export const CONFIRM_PLAN_TEXT = 'Confirm plan.'

// ── What's new ────────────────────────────────────────────────────────────────
// One curated feature announcement, authored as content/whats-new/<id>.<locale>.md on the server
// and already reduced to the reader's locale by the time it gets here. `paragraphs` is plain prose,
// not markdown: the client renders bare <Text> rather than carrying a parser for four sentences.
// `level` decides interruption — 'major' opens the dialog on the next visit, 'minor' only lights
// the menu's dot and waits to be opened.
export interface WhatsNewEntry {
  id: string
  // From frontmatter: YYYY-MM-DD, or a full ISO instant when a day carries more than one entry.
  // Unread is this against the reader's seen-at, so a back-dated entry published late stays read
  // for anyone who already dismissed past that point.
  date: string
  level: 'major' | 'minor'
  link?: string
  title: string
  paragraphs: string[]
  // Per-entry, so the panel can mark which ones are new. hasUnread/unreadMajor below still answer
  // for the whole archive, including entries past the panel's window.
  unread: boolean
}

export interface WhatsNewResponse {
  entries: WhatsNewEntry[]
  hasUnread: boolean
  // Computed over every entry, not just the ones listed — someone away for months still gets the
  // dot even when the unread one fell past the panel's window.
  unreadMajor: boolean
}

// ── Push subscriptions ────────────────────────────────────────────────────────
// One row per browser/device that opted into push. id = sha256 of whatever identifies the device
// (endpoint on web, `<platform>:<token>` on native) so a re-subscribe from the same device upserts;
// keyed by the owning user. Web rows go out through the web-push lib, iOS rows straight to APNs,
// Android rows straight to FCM; dead subscriptions (404/410, BadDeviceToken, UNREGISTERED) are
// pruned inline on send.
export interface PushSubscriptionRecord {
  id: string
  userId: string
  // Absent on rows written before the native app existed — readers treat that as 'web'.
  platform?: 'web' | 'ios' | 'android'
  // Web Push triple. Optional only because native rows have none of it; required on 'web' rows.
  endpoint?: string
  p256dh?: string
  auth?: string
  // Bare APNs device token ('ios' rows) or FCM registration token ('android' rows). Opaque, not a
  // URL — nothing to validate against SSRF.
  deviceToken?: string
  // Which APNs host to send to. A development build talks to sandbox; TestFlight and App Store
  // builds talk to production, and a token is only valid on the one it was minted for.
  apnsEnvironment?: 'sandbox' | 'production'
  ua: string | null
  createdAt: number
  // Refreshed on every (re)subscribe, i.e. each app open with permission granted. The age-based sweep
  // prunes rows not seen for a while — the only reliable way to drop uninstalled devices, since push
  // services report 404/410 lazily (Apple can take days).
  lastSeenAt: number
}

// The Android notification channel the app creates and every FCM payload names. Shared because the
// two have to agree to the letter: a payload naming a channel the device doesn't have lands in
// FCM's default-importance fallback channel, with no heads-up banner and no error anywhere.
export const ANDROID_NOTIFICATION_CHANNEL_ID = 'default'

// ── Message attachments ───────────────────────────────────────────────────────
// Attachments ride inside message text as `![name](attachment:<token>)` markers; this
// is the single home for the marker syntax and upload limits, shared by the
// server lib, the upload route, and the client input/rendering code.
//
// Two kinds, one pipeline. IMAGE_EXT is not "the image half of the whitelist" — it is the
// set a model can see *inline*, as a base64 vision block on the step (MachineStep.images).
// Everything in DOC_EXT reaches an agent the other way: the ref goes into the prompt and the
// agent calls the `attachment` tool for a presigned URL. Keeping the two tables apart is what
// stops a .xlsx from being handed to a provider as an image and failing the whole turn.

export const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

// Documents an agent fetches rather than sees. html is here and image/svg+xml is not, though both
// carry script: a document only ever leaves storage as a forced download or as sandboxed text/plain
// from the preview route, while an image is rendered inline straight from the storage origin.
//
// Where an extension has more than one MIME spelling, the canonical one is listed LAST: the
// extension → MIME reverse below is a last-one-wins fold, and that is the spelling every key,
// tool result and Content-Type ends up carrying.
const DOC_EXT: Record<string, string> = {
  'text/x-markdown':                                                           'md',
  'text/markdown':                                                             'md',
  'text/plain':                                                                'txt',
  'text/html':                                                                 'html',
  'text/csv':                                                                  'csv',
  'text/tab-separated-values':                                                 'tsv',
  'application/json':                                                          'json',
  'application/x-yaml':                                                        'yaml',
  'text/yaml':                                                                 'yaml',
  'text/xml':                                                                  'xml',
  'application/xml':                                                           'xml',
  'application/pdf':                                                           'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':         'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword':                                                        'doc',
  'application/vnd.ms-excel':                                                  'xls',
  'application/vnd.ms-powerpoint':                                             'ppt',
}

export const ATTACHMENT_EXT: Record<string, string> = { ...IMAGE_EXT, ...DOC_EXT }

// Every table lookup below goes through hasOwn. The keys are attacker-controlled — a multipart
// part declaring `Content-Type: constructor` would otherwise resolve to a truthy prototype member
// and walk straight past the whitelist.
function own<T>(table: Record<string, T>, key: string | undefined): T | undefined {
  return key && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined
}

export function isImageMime(mimeType: string | undefined): boolean {
  return own(IMAGE_EXT, mimeType) !== undefined
}

// The stored extension for a declared MIME, or undefined if it isn't on the whitelist.
export function extForMime(mimeType: string | undefined): string | undefined {
  return own(ATTACHMENT_EXT, mimeType)
}

// `accept` for a picker that only takes images (avatars, project icons, the support widget).
export const IMAGE_ACCEPT = Object.keys(IMAGE_EXT).join(',')
// Reverse of ATTACHMENT_EXT (extension → MIME): resolves a marker/key token back to its type. Plus
// the spellings a file arrives under but no stored key ever carries — a token is minted from
// extForMime, so `photo.jpeg` is stored as `.jpg`. Without these a `.jpeg` reads as a generic file
// until its upload lands, and is refused outright when the picker reports no type.
export const MIME_BY_EXT: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ATTACHMENT_EXT).map(([mime, ext]) => [ext, mime])),
  jpeg: 'image/jpeg',
  htm: 'text/html',
  yml: 'text/yaml',
}

// `accept` for the message/spec composer. Extensions ride alongside the MIME types because
// browsers and file managers routinely report `.md`/`.csv` as text/plain, application/octet-stream
// or nothing at all — a MIME-only accept list hides those files in the picker.
export const ATTACHMENT_ACCEPT = [
  ...Object.keys(ATTACHMENT_EXT),
  ...Object.keys(MIME_BY_EXT).map(ext => `.${ext}`),
].join(',')

// The MIME a name's trailing extension stands for, or undefined off-whitelist. Storage keys
// (`attachments/<team>/<token>.<ext>`) resolve through this too — only the last segment matters.
export function mimeByFileName(fileName: string): string | undefined {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? undefined : own(MIME_BY_EXT, fileName.slice(dot + 1).toLowerCase())
}

// The visual family an attachment belongs to — what a viewer needs to tell a spreadsheet from a
// slide deck at a glance, which the MIME string alone doesn't carry legibly. Keyed by extension
// like everything else here; an extension with no entry falls to 'file' and wears the generic
// glyph, so this table can lag the whitelist without breaking anything.
export type AttachmentKind = 'image' | 'pdf' | 'sheet' | 'slides' | 'text' | 'file'

const KIND_BY_EXT: Record<string, AttachmentKind> = {
  pdf: 'pdf',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet', tsv: 'sheet',
  ppt: 'slides', pptx: 'slides',
  doc: 'text', docx: 'text', md: 'text', txt: 'text', html: 'text', json: 'text', yaml: 'text', xml: 'text',
}

// Word and Markdown share the 'text' glyph on purpose: at chip size the only honest distinction is
// "a page of prose" versus "a grid" versus "a deck", and inventing a separate mark per office format
// would read as noise rather than information.
export function attachmentKind(fileName: string): AttachmentKind {
  const mimeType = mimeByFileName(fileName)
  if (!mimeType) return 'file'
  if (isImageMime(mimeType)) return 'image'
  return own(KIND_BY_EXT, extForMime(mimeType)) ?? 'file'
}

// How a viewer can render an attachment, which is a different question from which glyph it wears:
// KIND_BY_EXT groups a .csv with spreadsheets and a .docx with prose, but only one of those two can
// actually be painted. null means the browser has no renderer for it and the only honest offer is a
// download. The raw route serves every text kind as sandboxed text/plain, so an html file previews
// as its source, never as a page.
export type AttachmentPreview = 'image' | 'pdf' | 'markdown' | 'text' | null

const PREVIEW_BY_EXT: Record<string, Exclude<AttachmentPreview, 'image' | null>> = {
  pdf: 'pdf',
  md: 'markdown',
  txt: 'text', html: 'text', csv: 'text', tsv: 'text', json: 'text', yaml: 'text', xml: 'text',
}

export function attachmentPreview(fileName: string): AttachmentPreview {
  const mimeType = mimeByFileName(fileName)
  if (!mimeType) return null
  if (isImageMime(mimeType)) return 'image'
  return own(PREVIEW_BY_EXT, extForMime(mimeType)) ?? null
}

// What an upload should be stored as, from the two things a client tells us. Filename first,
// declared type second: `file.type` is guesswork on the client's side and is wrong in both
// directions for the formats users actually attach — pickers report `.md` as
// application/octet-stream, and Windows reports `.csv` as application/vnd.ms-excel, which would
// otherwise store a text file as `.xls` and then fail it on the OLE check. Either way the whitelist
// decides; this only chooses which of two claims to test against it.
//
// Both clients and the upload route resolve through here, so the precedence rule has one home.
export function resolveUploadMimeType(
  fileName: string | null | undefined,
  declaredType: string | undefined,
): string | undefined {
  return mimeByFileName(fileName ?? '') ?? (extForMime(declaredType) ? declaredType : undefined)
}

export const MAX_ATTACHMENTS_PER_MESSAGE = 5

// Two caps, because the two kinds arrive in very different shapes.
//
// An image is compressed on the client before it is sent (1568px long edge, JPEG @ 0.85 — a few
// hundred KB), so 5MB is not the working size, it is headroom for the paths that skip the
// compressor: an animated GIF kept whole, a small original shipped as-is, a decode that failed and
// fell back to the raw bytes.
//
// A document is uploaded untouched, and the formats people actually attach have a long tail — a deck
// with images or a scanned PDF clears 5MB routinely, which is the whole reason the old single cap
// was wrong for documents. What bounds it at 20MB is memory, not storage: the upload route holds the
// body twice (formData's copy, plus the Buffer the content check reads), so an in-flight upload
// costs ~2× its size on a pod whose whole limit is 700Mi. Team storage is nowhere near the binding
// constraint at 1GB even on free — checkStorageQuota is what handles volume, not this.
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

// The larger of the two, for the gates that have to fire before the type is known: the route's
// Content-Length pre-check (it runs before formData() is parsed) and nginx's proxy-body-size, which
// must stay above this or the ingress answers 413 with HTML the client can't read as an error.
export const MAX_UPLOAD_BYTES = MAX_DOCUMENT_BYTES

// The cap that applies to what is being stored as `ext`. An extension off the whitelist never gets
// this far — type resolution rejects it first — so falling to the document cap costs nothing.
export function maxBytesForExt(ext: string | undefined): number {
  return isImageMime(own(MIME_BY_EXT, ext)) ? MAX_ATTACHMENT_BYTES : MAX_DOCUMENT_BYTES
}

// Both caps are whole MB by construction, and every message that quotes one says "<n>MB".
export const megabytes = (bytes: number): number => Math.round(bytes / 1024 ** 2)

// Every local marker scheme that should render as a chip in editors/viewers. When adding a new
// chip scheme, add it here too: UI registries keyed by LocalMarkerScheme use `satisfies Record<...>`
// so TypeScript fails until the new scheme has an explicit renderer/parser.
export const LOCAL_MARKER_SCHEMES = ['attachment', 'doc', 'skill', 'todo', 'project', 'machine', 'agent', 'member'] as const
export type LocalMarkerScheme = typeof LOCAL_MARKER_SCHEMES[number]

// Capture 1 = display name, capture 2 = token.
export const ATTACHMENT_MARKER_RE = /!\[([^\]]*)\]\(attachment:([^)\s]+)\)/g

// A full storage key as it appears in a marker; capture 1 is the owning team. Bounded to the
// attachments/ namespace so a marker can't reference sessions/ or skills/ objects.
export const ATTACHMENT_KEY_RE = /^attachments\/([A-Za-z0-9_-]+)\/[A-Za-z0-9_-]+\.[a-z]+$/

// ── Uploads ───────────────────────────────────────────────────────────────────
// Every multipart upload is a grant first: the client asks the server where to put the bytes and
// gets back either the upload Worker (with a signed grant, see ./grant) or, while no Worker is
// configured, the same-origin route that has always taken the file. The wire contract of the
// upload itself is unchanged either way: a `file` field, `201 {key}`. Reads go the same way: the
// Worker serves an attachment's bytes under a signed read grant, so no client ever needs the
// storage provider's own hostname.
export type { UploadCategory, UploadGrant } from './grant'

export const UPLOAD_GRANT_TTL_SECONDS = 300
// Matches the raw-preview token, so a client cache sized for one is safe for both.
export const DOWNLOAD_GRANT_TTL_SECONDS = 600

export interface UploadTarget {
  uploadUrl: string
  // null on the legacy same-origin route, which authenticates with the session cookie instead.
  grant: string | null
  key: string
}

export type AvatarUploadTarget =
  | { kind: 'user_avatar' }
  | { kind: 'project_icon'; projectId: string }
  | { kind: 'agent_avatar'; teamId: string; agentId: string }

export type UploadRouteTarget = { kind: 'attachment'; teamId: string } | AvatarUploadTarget

// The same-origin route for a target: the legacy multipart POST, and the DELETE that clears an avatar.
export function uploadRoutePath(target: UploadRouteTarget): string {
  switch (target.kind) {
    case 'attachment': return `/api/teams/${target.teamId}/attachments`
    case 'user_avatar': return '/api/user/avatar'
    case 'project_icon': return `/api/projects/${target.projectId}/icon`
    case 'agent_avatar': return `/api/teams/${target.teamId}/agents/${target.agentId}/avatar`
  }
}

// Skill references ride inside spec/message text as `[<name>](skill:<skillId>)` markdown links —
// the same `[label](scheme:id)` shape every other chip uses. The skillId is the ES document id; the
// name is display only. The leading `@` is optional for text written while the marker still carried
// one: outside the link brackets markdown reads it as its own text node, so a sent message showed a
// stray `@` in front of the chip. Optional here keeps this scan swallowing those old ones whole.
export const SKILL_MARKER_RE = /@?\[([^\]]*)\]\(skill:([A-Za-z0-9_-]+)\)/g

// Todo references ride inside message/spec text as `[#<seq>](todo:<todoId>)` markdown links.
// Capture 1 = label (e.g. `#42`), 2 = todo id. Used by the spec-editor chip decorator.
export const TODO_MARKER_RE = /\[([^\]]*)\]\(todo:([A-Za-z0-9_-]+)\)/g

// Project references ride inside message/spec text as `[<name>](project:<projectId>)` markdown
// links (same `[label](scheme:id)` shape as todo:/doc:). Capture 1 = name, 2 = project id.
export const PROJECT_MARKER_RE = /\[([^\]]*)\]\(project:([A-Za-z0-9_-]+)\)/g

// Machine references ride inside message/spec text as `[<name>](machine:<machineId>)` markdown
// links (same `[label](scheme:id)` shape as project:/todo:). Capture 1 = name, 2 = machine id.
export const MACHINE_MARKER_RE = /\[([^\]]*)\]\(machine:([A-Za-z0-9_-]+)\)/g

// Agent and team-member references ride inside message/spec text as `[<name>](agent:<actorId>)` /
// `[<name>](member:<actorId>)` markdown links. The id is the *actor* id (what both detail screens
// resolve by), not the TeamMember row id. The `@` the user typed is not part of the marker: it is
// re-added by the renderers, the way `/skill` and `~project` chips wear their sigil — carrying it in
// the text would leave markdown a stray `@` outside the link.
export const AGENT_MARKER_RE = /\[([^\]]*)\]\(agent:([A-Za-z0-9_-]+)\)/g
export const MEMBER_MARKER_RE = /\[([^\]]*)\]\(member:([A-Za-z0-9_-]+)\)/g

// Document references ride inside message text as `[plan](doc:<docId>)` markdown links (same
// `[label](scheme:id)` shape as todo:/project:/skill:). Captures the Document id.
export const DOC_REF_RE = /\(doc:([A-Za-z0-9_-]+)\)/
// Global variant for scanning every doc ref in a body (capture 1 = label, 2 = doc id). Kept separate
// from DOC_REF_RE: that one is consumed with `.test()`, and a shared `g` regex's `lastIndex` would
// make the two usages interfere. Mirrors TODO_MARKER_RE / PROJECT_MARKER_RE.
export const DOC_MARKER_RE = /\[([^\]]*)\]\(doc:([A-Za-z0-9_-]+)\)/g

// Builder for the same marker — the single place plan/revision turns mint the reference they store in
// place of inline plan text. The link text is just a placeholder the renderer swaps for a DocumentChip
// (which shows the real "Plan vN" label), so a constant suffices.
export const docRefMarker = (id: string): string => `[plan](doc:${id})`
export const questionRefMarker = (id: string): string => `[Question](doc:${id})`

// Builders for the inline chip markers, one per scheme — the single source of truth for each marker's
// shape, shared by the Lexical chip nodes, the CodeMirror spec editor's insert, and the server's build
// trigger text. `todoRefMarker`'s label is `#<seq>` in the editors but the todo title in the build
// trigger; `projectRefMarker` is also the shape the chief is instructed to emit for a project.
export const projectRefMarker = (name: string, id: string): string => `[${name}](project:${id})`
export const skillRefMarker = (name: string, id: string): string => `[${name}](skill:${id})`
export const todoRefMarker = (label: string, id: string): string => `[${label}](todo:${id})`
export const machineRefMarker = (name: string, id: string): string => `[${name}](machine:${id})`
export const agentRefMarker = (name: string, id: string): string => `[${name}](agent:${id})`
export const memberRefMarker = (name: string, id: string): string => `[${name}](member:${id})`

// A model sometimes quotes a chip marker in backticks — markdown then parses a code span, the link
// never resolves, and the chip renders as literal monospace text. Both renderers (web ContentMarkdown
// and the native bubble) unwrap these before parsing; prompt wording alone can't fix messages
// already persisted with the backticks.
const CODE_WRAPPED_MARKER_RE = new RegExp(`\`(@?\\[[^\\]\`]*\\]\\((?:${LOCAL_MARKER_SCHEMES.join('|')}):[A-Za-z0-9_-]+\\))\``, 'g')
const unwrapCodeWrappedMarkers = (content: string): string => content.replace(CODE_WRAPPED_MARKER_RE, '$1')

// OpenAI models cite their web-search results as private-use-area spans (U+E200 `cite` U+E202
// `turn0search0` U+E201) referencing sources we never receive — rendered raw they read as tofu
// boxes around `turn0search0`. Drop whole spans, an unterminated one still streaming in, and any
// stray delimiter.
const MODEL_CITATION_RE = /[^]*(?:|$)|[-]/g
const stripModelCitations = (content: string): string => content.replace(MODEL_CITATION_RE, '')

// The single pre-parse pass both renderers run on assistant content. Math goes first so the fences
// it mints are already there when the table repair walks the lines: a display formula of `|x| = |y|`
// is a row of pipes that would otherwise be promoted into a table. Unwrapping then only rewrites
// inline spans, leaving that line structure intact.
export const normalizeContentMarkdown = (content: string): string => repairTables(repairEmphasis(unwrapCodeWrappedMarkers(protectMath(stripModelCitations(content)))))

// A plan turn's bubble = the agent's reply prose, with the `[plan](doc:id)` chip appended when this turn
// produced a plan version. When it didn't (a follow-up question answered without revising), the reply
// stands alone. Single source for that layout, shared by the server sink (persisted message) and the
// panel (live patch on turn end).
export const planMessageContent = (reply: string, planDocId?: string): string =>
  [reply.trim(), planDocId && docRefMarker(planDocId)].filter(Boolean).join('\n\n')

// A turn's bubble with a marker appended for every question card it created but never referenced.
// Nothing renders a card except its marker (parseDocMarkers → DocumentCard), so a reply that asks and
// then only writes "pick one" leaves the user a choice with no options (see ask_user). A reply that
// wrote its own markers comes back unchanged.
export const withQuestionRefs = (content: string, questionDocIds: string[]): string => {
  const referenced = new Set([...content.matchAll(DOC_MARKER_RE)].map(m => m[2]))
  const missing = questionDocIds.filter(id => !referenced.has(id))
  return missing.length ? [content.trim(), ...missing.map(questionRefMarker)].filter(Boolean).join('\n\n') : content
}
export const MAX_SKILLS_PER_BUILD = 10
export const MAX_FILES_PER_SKILL = 8

// System messages (role 'system') carry a JSON payload in `content`; clients
// localize at render. Levels/names are snapshotted at write time.
export type SystemMessagePayload =
  | { kind: 'agent_changed'; name: string; modelId?: string; thinkingLevel?: string }
  | { kind: 'thinking_changed'; thinkingLevel?: string }
  // byAgent marks a round an agent asked for (chief/MCP) — the review circuit breaker counts only
  // these; a human-clicked round (no byAgent) resets the streak like any other human action.
  // userRequested rides with byAgent when the agent relayed the user's explicit ask: that round
  // opens a fresh window and counts as its first round (agentReviewStreak counts it, then stops).
  | { kind: 'review_requested'; name: string; byAgent?: boolean; userRequested?: boolean }
  | { kind: 'merge_started'; name: string }
  // prNumber/prUrl present when the completion came from a merge (the notice links the merged PR).
  | { kind: 'todo_completed'; prNumber?: number; prUrl?: string }
  | { kind: 'todo_closed' }
  | { kind: 'todo_reopened' }
  // Context compaction ran. tokensBefore = occupancy before compaction; auto marks an in-loop
  // auto-compaction (mid-turn, executor-reported) vs the user's "release window" action.
  | { kind: 'compacted'; tokensBefore?: number; auto?: boolean }
  // The turn succeeded but its checkpoint commit failed on the machine — this turn's file changes
  // are not on the branch yet (the next turn's checkpoint retries cumulatively).
  | { kind: 'checkpoint_failed'; error?: string }
  // The turn's synchronous branch push failed — the branch is missing this turn's checkpoint.
  // The work is committed on the machine; the next turn's checkpoint push carries the tip up.
  | { kind: 'push_failed'; error?: string }
  // A turn's push succeeded after an earlier turn had reported push_failed.
  | { kind: 'push_recovered' }
  // The machine this turn queued on, written only when it differs from the previous turn's (so the
  // first turn always says it, and a reroute says it again). pinned = the user or a schedule chose
  // it (Build.pinnedMachineId); absent = automatic selection. machineId keeps the notice clickable
  // after a rename, which the snapshotted name would not survive.
  | { kind: 'machine_selected'; machineId: string; name: string; pinned?: boolean }
  // Everything a turn did to the agent's own memory, collapsed into one notice (summarizeMemoryOps).
  // A consolidation that rewrites one entry and drops three is one thing the agent did, not four
  // rows. Counts only, and the link opens the agent's memory tab — the list is newest-first, so
  // whatever this turn touched is already at the top for the reader to see.
  | { kind: 'memory_changed'; agentId: string; created: number; updated: number; deleted: number }
  // Anchors the turn that resumes a build on its own once the machine its last turn failed on as
  // offline is back (server: offlineResume) — in place of a user bubble, since nobody typed.
  | { kind: 'machine_back_online' }

// One turn's memory bookkeeping (BuildRun.memoryOps, `<op>:<memoryId>` in call order) collapsed to
// the three counts the notice states. Per entry the LAST op decides its fate, with two adjustments:
//   · an entry created earlier in the same turn stays "created" however often it is then rewritten
//     — the turn is what brought it into being;
//   · an entry created AND deleted inside the turn nets out to nothing and is dropped, because a
//     reader who follows the notice would find no trace of either half.
export function summarizeMemoryOps(ops: string[]): { created: number; updated: number; deleted: number } {
  const fate = new Map<string, { created: boolean; last: string }>()
  for (const op of ops) {
    const sep = op.indexOf(':')
    if (sep < 1) continue
    const kind = op.slice(0, sep)
    const id = op.slice(sep + 1)
    if (!id || (kind !== 'c' && kind !== 'u' && kind !== 'd')) continue
    fate.set(id, { created: fate.get(id)?.created || kind === 'c', last: kind })
  }
  let created = 0
  let updated = 0
  let deleted = 0
  for (const f of fate.values()) {
    if (f.last === 'd') {
      if (!f.created) deleted++
    } else if (f.created) created++
    else updated++
  }
  return { created, updated, deleted }
}

export function parseSystemMessage(content: string): SystemMessagePayload | null {
  try {
    const p = JSON.parse(content) as SystemMessagePayload
    if (p?.kind === 'agent_changed' && typeof p.name === 'string') return p
    if (p?.kind === 'thinking_changed') return p
    if ((p?.kind === 'review_requested' || p?.kind === 'merge_started') && typeof p.name === 'string') return p
    if (p?.kind === 'todo_completed' || p?.kind === 'todo_closed' || p?.kind === 'todo_reopened') return p
    if (p?.kind === 'compacted') return p
    if (p?.kind === 'checkpoint_failed') return p
    if (p?.kind === 'push_failed' || p?.kind === 'push_recovered') return p
    if (p?.kind === 'machine_back_online') return p
    if (p?.kind === 'machine_selected' && typeof p.machineId === 'string' && typeof p.name === 'string') return p
    // agentId is where the link goes — without it the notice has nothing to offer.
    if (p?.kind === 'memory_changed' && typeof p.agentId === 'string') return p
    return null
  } catch {
    return null
  }
}

// ── Run errors ──────────────────────────────────────────────────────────────────
// A failed turn's error reaches a user as whatever the failing layer said: an OpenAI-compatible
// gateway's HTTP body, git's stderr, the machine's own model-resolution message. Rendering that
// verbatim is how someone ends up staring at "404 404 page not found". Messages keep storing the
// raw error — the kind is derived from it, so classifying at render (not at write) means a sharper
// rule set immediately improves every error ever recorded, and nothing needs migrating. An error
// nothing matches is 'unknown' and shows its raw text: a confident wrong explanation is worse.
export type RunErrorKind =
  | 'machine_offline'
  | 'machine_removed'
  | 'machine_build_disabled'
  | 'machine_unclaimed'
  | 'step_lost'
  | 'machine_restarted'
  | 'agent_removed'
  | 'credits_exhausted'
  | 'credits_exhausted_trial'
  | 'agent_locked'
  | 'provider_endpoint_not_found'
  | 'provider_auth_invalid'
  | 'provider_rate_limited'
  | 'provider_quota_exceeded'
  | 'provider_subscription_ineligible'
  | 'provider_subscription_inactive'
  | 'provider_upstream_error'
  | 'provider_incompatible'
  | 'provider_no_developer_role'
  | 'provider_client_rejected'
  | 'provider_duplicate_tool_call'
  | 'provider_tool_call_mismatch'
  | 'provider_credential_not_ascii'
  | 'provider_unreachable'
  | 'provider_html_response'
  | 'model_unavailable'
  | 'model_not_found'
  | 'model_timeout'
  | 'stream_incomplete'
  | 'compact_overflow'
  | 'git_auth_failed'
  | 'git_unreachable'
  | 'workspace_conv_ref_missing'
  | 'workspace_failed'
  // Not a fault — the user stopped the turn. Carried here so the bubble can name it in their
  // language instead of echoing the English word the server stored.
  | 'cancelled'
  | 'unknown'

// Ordered: the first match wins. Machine- and git-originated errors come first because they can
// quote a provider's words ("Failed to connect…") and would otherwise be misread as provider faults.
// model_not_found precedes the 404 rule for the same reason: providers answer an unknown model id
// with a 404, and blaming the baseUrl for it would send the user to fix the one thing that's right.
const RUN_ERROR_RULES: ReadonlyArray<readonly [RunErrorKind, RegExp]> = [
  // Platform-authored settle reasons (machine-loss cascade, chief crash recovery) — phrases we
  // write ourselves, anchored exactly, so they can never be shadowed by the looser rules below.
  ['machine_offline',             /^Machine offline$|its machine went offline/i],
  ['machine_removed',             /^Machine removed$|its machine left the team/i],
  ['machine_build_disabled',      /^Machine stopped taking builds$|its machine stopped taking builds/i],
  // The stranded-run sweep's two settle reasons (staleRunSweep.ts). Both mean the step could never
  // be delivered again while the machine looked healthy — distinct remedies, so distinct kinds:
  // a wedged claim loop needs the daemon restarted, a lost job just needs the turn resent.
  ['machine_unclaimed',           /^The machine stopped picking up work$|its machine stopped picking up work/i],
  ['step_lost',                   /^Turn lost from the machine queue$|its step was lost from the machine queue/i],
  ['machine_restarted',           /by a machine restart/i],
  ['agent_removed',               /^Agent removed$/i],
  // creditsExhausted()'s wording (teamCreditLedger.ts), from the claim gate or the managed gateway's
  // 402 — whose insufficient_quota body would otherwise read as the provider's own quota.
  ['credits_exhausted_trial',     /This team has used up its trial credits/i],
  ['credits_exhausted',           /This team has used up its monthly credits/i],
  // AgentLockedError's wording (machineSelect.ts): the agent sits past the plan's agent cap.
  ['agent_locked',                /This agent is locked: the .+ allows \d+ agents/i],
  // What outcomeContent writes for a cancelled run. Anchored: a provider error that merely mentions
  // a cancellation is a fault and must keep its own words.
  ['cancelled',                   /^Cancelled$/i],
  // pi's compaction sends the whole uncompacted span to the model as ONE message, so once that span
  // outgrows the model's own window every compact attempt fails with the provider's overflow words
  // ("maximum prompt length is 500000 but the request contains 979585 tokens"). Anchored to pi's
  // summarization prefix: a mid-turn overflow has no compact-elsewhere remedy and keeps its raw text.
  ['compact_overflow',            /^Summarization failed:[\s\S]*?(?:maximum prompt length|prompt is too long|too many tokens|exceeds? the (?:maximum )?context|context (?:length|window))/i],
  // First alternative is the legacy machine-era wording, still present in stored build history.
  ['model_unavailable',           /is unavailable on this machine|is not configured for this team/i],
  ['git_auth_failed',             /Permission denied \(publickey\)|Authentication failed|could not read Username/i],
  // "Empty reply" and the HTTP2 framing error are curl's transport words, not a gateway's: git is
  // the only thing here that speaks over libcurl, and both are common where the hop to GitHub dies
  // mid-handshake. Without them these land in the generic workspace bucket and read as a repo fault.
  ['git_unreachable',             /Failed to connect to|Could not resolve host|Connection timed out|Empty reply from server|Error in the HTTP2 framing layer/i],
  // CLIs before 0.1.43 decided "the conversation branch isn't on the remote yet" — the ordinary state
  // of every first build — by matching git's ENGLISH stderr, so a machine whose locale translates git
  // (zh_CN, de_DE, …) failed every build it ever ran. Keyed on the ref path, the one part of that
  // message git does not translate, and placed before the generic bucket so the remedy shown is the
  // real one: upgrade the CLI. Fixed CLIs never emit it — they settle the ref by exit status.
  ['workspace_conv_ref_missing',  /^Workspace preparation failed[\s\S]*refs\/heads\/tds\/conv-/i],
  ['workspace_failed',            /^Workspace preparation failed/i],
  ['model_not_found',             /model not (found|exist)|no such model|unknown model|invalid model|unsupported model|model.{0,40}does not exist|is not available under provider/i],
  ['provider_endpoint_not_found', /^404\b|404 page not found/i],
  ['provider_auth_invalid',       /^401\b|\(401\)|invalid_api_key|Incorrect API key|Unauthorized/i],
  ['provider_rate_limited',       /^429\b|\(429\)|rate.?limit/i],
  // A subscription sign-in that authenticated fine but is not entitled to this model. xAI answers
  // SuperGrok OAuth with a 403 that conflates "out of resources" with "no subscription", and the
  // fix is not to top up — it is another model or an API key. Before the quota rule, whose hint
  // ("top up") would send the user the wrong way if xAI ever adds those words to the same body.
  ['provider_subscription_ineligible', /do not have an active [\w\s]{0,24}subscription|run out of available resources/i],
  // A plan bought with the key itself (OpenCode Go) that has lapsed. OpenCode wraps it as
  // "Upstream request failed", so it must precede the upstream rule, whose "try later" never helps.
  ['provider_subscription_inactive', /an active [\w\s]{0,24}subscription is required|subscription (?:has )?(?:expired|lapsed)/i],
  ['provider_quota_exceeded',     /usage limit|extra usage|insufficient.?(balance|quota)|quota exceeded/i],
  // A gateway's own hop to the provider behind it failed. It answers with a 5xx and words like
  // "forbidden" or "access denied" that read as a key problem, but the key already passed — the
  // gateway authenticated the caller before dialing out. Not a bare /upstream/: git's "no upstream
  // branch" would land here. After the rules above so a 503 that says "rate limit" stays rate limited.
  ['provider_upstream_error',     /^50[234]\b|\(50[234]\)|upstream_error|upstream (?:access|server|request|provider)|Bad Gateway|Service Unavailable|Gateway Time-?out/i],
  // Replaying one model's parallel tool calls to another. openai-responses providers (xAI, Codex,
  // Copilot) id a tool call `{call_id}|{item_id}`, and siblings in one turn differ only in a tail
  // that CLIs before 0.1.43 cut when shortening the id for Chat Completions' 40-char limit — two
  // calls collide, and the next provider rejects the whole request. Every later turn replays the
  // same history, so this repeats until the CLI is upgraded or the turn leaves the context. Before
  // the developer-role and generic rules: the remedy is an upgrade, not a provider setting.
  ['provider_duplicate_tool_call', /duplicat\w*[\s\S]{0,40}tool[_ ]?(?:call|use)|tool[_ ]?(?:call_id|use_id|use)[\s\S]{0,40}(?:must be unique|not unique|already (?:exists|used|present)|is duplicat)/i],
  // The history has an assistant message with tool_calls but the matching tool-response messages are
  // missing or out of order. Strict providers (vLLM, some litellm routes) reject the whole request;
  // more lenient ones silently skip the orphaned calls. After duplicate_tool_call: that rule's
  // "duplicate" anchor is disjoint from these phrases, and both need their own remedy.
  ['provider_tool_call_mismatch', /tool_calls['"]?\s*must be followed by tool|role\s*['"`]?tool['"`]?\s*must be a response|insufficient tool messages|tool_call_ids?\b[\s\S]{0,80}did not have response/i],
  // Marking a model as reasoning at `tds provider add` makes pi send the system prompt as role
  // 'developer' (openai-completions: model.reasoning && compat.supportsDeveloperRole). Gateways that
  // only accept system/user/assistant/tool reject it. Before the generic rule: the fix is specific
  // (re-answer "supports reasoning?" with no), and nothing else about the request is wrong.
  // Wording varies by gateway stack: OpenAI-style "invalid value: developer", and serde/Axum-style
  // "unknown variant `developer`" with an indexed messages[0].role — both mean the same reject.
  ['provider_no_developer_role',  /invalid value: ['"`]?developer|messages(?:\[\d+\])?\.role[\s\S]{0,120}['"`]?developer|unknown variant ['"`]?developer|['"`]?developer['"`]? is not (?:one of|a valid|supported)/i],
  // A gateway that fingerprints its caller (User-Agent, x-app, the claude-code beta, the Claude Code
  // system block) and only lets the official CLI through. The key and Base URL both passed to get
  // this far, so neither is the fix. After the 5xx rule: a gateway quoting these words while its own
  // hop dies is an upstream failure, not a verdict on the caller. Both languages, because the
  // wording is copied between gateways with edits.
  ['provider_client_rejected',    /detected an anomal\w* in your client|standard Claude Code client|检测到[^，。]{0,16}客户端[^，。]{0,8}异常|使用标准\s*Claude\s?Code\s*客户端|非标准(?:的)?客户端/i],
  ['provider_incompatible',       /InvalidParameter|unsupported_(parameter|value)/i],
  ['model_timeout',               /Request timed out|ETIMEDOUT/i],
  ['stream_incomplete',           /Stream ended without finish_reason/i],
  // A stored credential carries a character no HTTP header can hold (see HEADER_SAFE_VALUE_RE),
  // so undici rejects the request before it is sent. Rows saved before that rule existed still
  // carry these values, and the raw TypeError names a string index rather than the field — the
  // remedy is to re-enter the key, which no other rule here would suggest.
  ['provider_credential_not_ascii', /Cannot convert argument to a ByteString/i],
  // Undici's bare "fetch failed" and friends: the request never reached the provider. Last, so the
  // git rules above keep their own network failures ("Failed to connect to github.com").
  ['provider_unreachable',        /\bfetch failed\b|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|network error/i],
  // A whole web page as the error body (an expired relay domain's block page, a WAF challenge, a
  // gateway's login screen). Dead last: any status- or word-anchored rule above that recognizes the
  // page's contents gives a sharper remedy — this is only the verdict that what answered isn't an
  // API, sparing the chat bubble a raw HTML dump.
  ['provider_html_response',      /<!doctype\s+html|<html[\s>]/i],
]

export function classifyRunError(raw: string): RunErrorKind {
  return RUN_ERROR_RULES.find(([, re]) => re.test(raw))?.[0] ?? 'unknown'
}

// ── Merge-flow output tags ──────────────────────────────────────────────────────
// The merge turn ends its reply with <pr_description>…</pr_description> and
// <merge_status>clean|resolved</merge_status>. These are metadata for the PR/sink, not chat — the
// single source for parsing them (server, at /done) and hiding them (client, while streaming).
const PR_DESCRIPTION_RE = /<pr_description>([\s\S]*?)<\/pr_description>/
const MERGE_STATUS_RE = /<merge_status>\s*(clean|resolved)\s*<\/merge_status>/

// Server-side: pull the description + status out of the agent's complete reply and return the bubble
// text with both tag blocks removed.
export function parseMergeOutput(raw: string): { text: string; prBody?: string; mergeStatus?: MergeStatus } {
  const prBody = raw.match(PR_DESCRIPTION_RE)?.[1]?.trim() || undefined
  const status = raw.match(MERGE_STATUS_RE)?.[1] as MergeStatus | undefined
  const text = raw
    .replace(new RegExp(PR_DESCRIPTION_RE, 'g'), '')
    .replace(new RegExp(MERGE_STATUS_RE, 'g'), '')
    .trim()
  return { text, prBody, mergeStatus: status }
}

// Client-side: hide the tag tail from a (possibly mid-stream) assistant bubble. The closing tag may
// not have arrived yet, so cut from the first opener — or a dangling partial opener still streaming in.
// Only an opener starting a line counts: a reply that names the tag in prose (`<commit_message>`)
// would otherwise lose everything after the mention.
export function stripTurnTags(text: string): string {
  const cut = text.search(/^[ \t]*<(pr_description|merge_status|commit_message)/m)
  const shown = cut === -1 ? text : text.slice(0, cut)
  return shown.replace(/(^|\n)[ \t]*<\w*$/, '').trimEnd()
}

// ── Checkpoint commit message tag ─────────────────────────────────────────────────
// A producing turn that changed files ends its reply with <commit_message>…</commit_message>; the
// executor commits the worktree under it (Conventional Commits, validated here — anything else falls
// back to the bare `checkpoint <stepId>`). The last tag wins: a steer follow-up appends a second
// reply to the same turn, and the later one was written knowing the whole turn.
const COMMIT_MESSAGE_RE = /<commit_message>([\s\S]*?)<\/commit_message>/g
const CONVENTIONAL_SUBJECT_RE = /^(feat|fix|refactor|perf|docs|test|chore|build|ci|style|revert)(\([^)]*\))?!?: \S/

export function parseCommitMessageTag(raw: string): string | undefined {
  const tags = [...raw.matchAll(COMMIT_MESSAGE_RE)]
  const tagged = tags[tags.length - 1]?.[1].trim()
  return tagged && CONVENTIONAL_SUBJECT_RE.test(tagged) ? tagged : undefined
}

// Server-side, at /done: the tag is commit metadata, never chat.
export function stripCommitMessageTags(raw: string): string {
  return raw.replace(COMMIT_MESSAGE_RE, '').trim()
}

// ── Plan-turn output tag ──────────────────────────────────────────────────────────
// A plan/revision turn optionally wraps the plan body in <plan>…</plan>: text OUTSIDE the tag is the
// chat reply (a note above the plan chip, or — when the turn only answers a question — the whole
// bubble), text INSIDE becomes the plan Document. No <plan> block ⇒ no new plan version, so a follow-up
// question in the confirm phase doesn't mint a redundant plan. Parsed server-side at /done; no client
// stripper is needed — plan deltas don't stream into the bubble (BuildPanel drops them).
const PLAN_BLOCK_RE = /<plan>([\s\S]*?)<\/plan>/g

export function parsePlanOutput(raw: string): { reply: string; plan?: string } {
  let plan: string | undefined
  const reply = raw.replace(PLAN_BLOCK_RE, (_tag, body: string) => {
    plan ||= body.trim()
    return ''
  }).trim()
  return { reply, plan: plan || undefined }
}

// How a user message entered the conversation. Absent = typed in the composer at rest.
// 'steer' = injected mid-turn (not a restore anchor — no checkpoint of its own).
// 'synthetic' = machine-written on the user's behalf (confirm-plan / AI-review revision),
// so restore skips prefilling it back into the input.
// 'chief' = relayed by the user's chief (message_todo): a real turn anchor like a typed
// message, but restore prefill is skipped like synthetic — the user never typed it.
export type MessageOrigin = 'steer' | 'synthetic' | 'chief'

// The abnormal way a succeeded turn's final model frame ended — recorded on the run and the
// assistant message so a cut deliverable never reads as a clean finish. 'length': cut by a token
// limit (output cap reached, or a near-full context window clamping the reply allowance).
// 'error': the provider died terminally after the turn had already produced output (pi's retry
// budget spent). Absent = the model chose to end its turn.
export type TurnStopReason = 'length' | 'error'
export interface TurnCut {
  stopReason?: TurnStopReason
  // The provider's own words for an 'error' stop, verbatim from the final frame. Classified like a
  // failed run's error (classifyRunError) wherever it is shown, so "usage limit reached" reads as
  // quota exhaustion rather than a bare "model error".
  stopError?: string
}

// The cause a transcript reader gets for a cut turn.
export const turnCutCause = (cut: TurnCut): string =>
  cut.stopReason === 'length' ? 'token limit' : cut.stopError ?? 'provider error'

// TurnCut fields: assistant messages only; absent on cleanly finished turns.
export interface Message extends TurnCut {
  id: string
  buildId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  phase: StepKind
  // What this turn actually ran with (agentId + model + level), denormalized from the run.
  // Lets the UI attribute each turn to the real agent/model — independent of the todo's
  // current assignment. Absent on user/system messages and pre-snapshot history.
  agent?: AgentRunConfig
  createdAt: number
  // Turn work time, derived from the run's timing and attached by the /messages route — NOT persisted
  // (the BuildRun is the source of truth; see runDurationMs). Assistant messages only. Like `attachments`.
  durationMs?: number
  // Set on the assistant message that finalized a failed run — renders as an error bubble.
  isError?: boolean
  // User messages only — see MessageOrigin.
  origin?: MessageOrigin
  // Who set this turn going, when it wasn't the reader: the chief acting for them (run_builds,
  // confirm_builds) or a schedule's cycle. Orthogonal to `origin`, which says what the TEXT is —
  // a confirm bubble stays 'synthetic' because its sentinel must never reach a prompt as user
  // input, and that leaves nowhere to also record who pressed it. Sparse: absent = the user
  // themselves, so 'user' is never stored.
  triggerBy?: BuildTriggerSource
}

// The chip data referenced by a message list's markers (doc:/todo:/project:/skill:), resolved in one
// batch by the /messages route so the client seeds its per-entity caches and every chip paints on the
// first frame instead of fetching itself. Keyed by entity id. Todos carry the same response-only
// enrichment (projectName/agent) as GET /api/todos/[id].
export interface ChipRefs {
  docs: Record<string, Document>
  todos: Record<string, Todo>
  projects: Record<string, Project>
  skills: Record<string, Skill>
  machines: Record<string, MachinePublic>
}

export type BuildRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
// Statuses of an in-flight run — the shared half of the active-producing-run predicate.
export const ACTIVE_RUN_STATUSES: BuildRunStatus[] = ['queued', 'running']
// TurnCut fields: the deliverable is likely incomplete. Absent on clean finishes.
export interface BuildRun extends TurnCut {
  // The run's single identity: BullMQ job id + this index's _id, and doubles as the assistant Message id.
  id: string
  buildId: string
  userMessageId?: string
  runType: 'producing'
  agentId?: string
  // The run config this turn executed with (agentId + model + level). Denormalized onto the
  // assistant Message on finalize.
  agent: AgentRunConfig | null
  status: BuildRunStatus
  errorMessage?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  // Checkpoint captured by the machine at the end of this turn; restore reads the
  // prior turn's values to rewind code + session. commitSha is workspace turns only.
  commitSha?: string
  sessionLeafEntryId?: string
  // The conversation session this turn ran on (ConversationSession.id) — what the leaf belongs to.
  sessionId?: string
  // The checkpoint commit failed on the machine (e.g. a wedged index) — the turn's file changes
  // never reached the branch. Set only on workspace turns whose commit threw.
  checkpointError?: string
  // Context-window occupancy measured at this turn's end (pi session.getContextUsage()). The
  // conversation's "current usage" = its most recent run's values. tokens is null right after a
  // compaction (pi can't estimate until the next LLM response); contextWindow is the model's cap.
  contextTokens?: number | null
  contextWindow?: number
  // Ordered LLM calls made by this turn, including tool-use continuations and retries. Absent when the
  // turn made no model call or the machine predates usage reporting.
  modelCalls?: ModelCall[]
  // The machine whose queue this run's step was enqueued to — picked at enqueue time (agents carry
  // no machine binding). Server truth for the turn's lifecycle ops (steer nudge, job drop, crash
  // recovery) and for the machine-tool-relay caller check; also the conversation's machine-affinity
  // source (latest run wins). Absent on runs from before machine selection existed.
  machineId?: string
  // Enqueue-time snapshot of the conversation's team, and of who started that conversation —
  // build.triggerSource for a todo build, 'chief' for a chief thread. Monitoring-only (see the
  // staff build console): nothing in the product branches on them, and they are NOT the per-turn
  // provenance — that is Message.triggerBy, which is sparse by design. Absent on runs enqueued
  // before the console existed.
  teamId?: string
  triggerSource?: BuildTriggerSource
  // Stamped instead of deleting the run on a checkpoint rewind: the turn's spend still counts toward
  // build usage totals, but every live-timeline read (context, checkpoints) excludes stamped runs.
  rewoundAt?: number
  // The StepKind this run executed — the durable source of truth for /done sink dispatch (read off the
  // run, not Redis). Producing runs include both builder turns and read-only reviewer turns.
  phase: StepKind
  // Marks a compaction turn (session.compact(), no agent loop) — steer can't target it.
  compact?: boolean
  // The ask_user cards this turn created, in call order. Stamped by the tool handler; the message
  // write reads them back to append the marker for any the reply left unreferenced (withQuestionRefs).
  questionDocIds?: string[]
  // What this turn did to the agent's memory, `<op>:<memoryId>` with op c|u|d, in call order.
  // Stamped by save_memory/delete_memory; the message write collapses them into one notice
  // (summarizeMemoryOps). Appended without dedupe — order is what decides each entry's fate.
  memoryOps?: string[]
  // The build branch's fork point from the default branch, stamped by merge_branch just before
  // this turn merged the build's own branch into it. The turn's changes doc is written after that
  // merge, when the default branch no longer straddles the change — the sink pins this instead.
  // First merge of the turn wins, so the doc covers everything the turn landed.
  preMergeBaseSha?: string
  // A plan_revision turn's working copy of the plan, as edited by its edit_plan calls: seeded from
  // the saved plan Document on the first call, minted as the next plan version by the finalize
  // sink and removed once the turn settles — so it exists only while the turn is in flight. The
  // plan itself always lives on the Document.
  planDraft?: string
  // Crash marker for turn finalization: set atomically with the /done claim's terminal flip,
  // cleared once the route settled the turn (sink done, or its catch wrote the error bubble). A
  // terminal run still carrying it past a grace means the server died mid-finalization — the
  // sink-recovery sweep settles the turn as failed so nothing sits half-finalized forever.
  sinkPending?: boolean
}

// ── Staff build monitor ─────────────────────────────────────────────────────────
// Response shapes for the staff console at /admin/builds (apps/server). Nothing in the product
// reads them; they live here because the route and its view are in different bundles and must
// agree on the wire format, same as MachinePublic.

export type BuildMonitorWindow = '1h' | '24h' | '7d'
export const BUILD_MONITOR_WINDOWS: BuildMonitorWindow[] = ['1h', '24h', '7d']

export interface BuildMonitorPercentiles { p50: number | null; p90: number | null; p99: number | null }

// One bucket of the settled-outcome histogram. Bucketed by completedAt, not createdAt: a bucket of
// runs that merely STARTED in this slice is mostly still running, and its success rate reads as a
// crash that isn't happening.
export interface BuildMonitorOutcomePoint {
  at: number
  succeeded: number
  failed: number
  cancelled: number
  execP50: number | null
  execP90: number | null
}

// A row of any of the drill-down dimensions. `key` is the raw aggregation key (machine id, team id,
// phase, trigger) — what a click sends back as a filter; `label` is what it's called. Phase rows
// carry their trigger-source split as `children`.
export interface BuildMonitorDimensionRow {
  key: string
  label: string
  total: number
  succeeded: number
  failed: number
  execP90: number | null
  // Team rows only: latest createdAt in the window. Absent on machine and phase rows.
  lastActiveAt?: number | null
  // Team rows only: when the team's earliest-joined human signed up. Null when unresolvable.
  signedUpAt?: number | null
  // Team rows only. Null for the unattributed bucket and for a team doc that no longer exists.
  plan?: PlanBadge | null
  // Machine rows only: macOS / Linux / Windows (or the raw platform when it is none of those).
  // Null when the machine never reported process.platform.
  os?: string | null
  children?: BuildMonitorDimensionRow[]
}

// A failure kind's share of the window. `side` splits "our platform dropped the turn" from "the
// agent's own run failed" — the two lead to completely different investigations.
export interface BuildMonitorFailureRow {
  kind: RunErrorKind
  count: number
  side: 'platform' | 'agent' | 'other'
}

export interface BuildMonitorSummary {
  from: number
  to: number
  bucketMs: number
  // Arrival axis (createdAt): how much work entered, and what became of that cohort.
  enqueued: { total: number; byStatus: Partial<Record<BuildRunStatus, number>>; series: { at: number; count: number }[] }
  // Settlement axis (completedAt): what finished in this window, and how it went.
  settled: {
    total: number
    succeeded: number
    failed: number
    cancelled: number
    // succeeded / (succeeded + failed) — cancellations are a user's choice, not a fault, so they
    // are shown but never counted against the rate. null when nothing settled.
    successRate: number | null
    series: BuildMonitorOutcomePoint[]
  }
  latency: { queueWait: BuildMonitorPercentiles; exec: BuildMonitorPercentiles }
  failures: {
    rows: BuildMonitorFailureRow[]
    // How many failed runs were actually classified, and whether the scan hit its cap (the page
    // says so rather than quietly showing a partial distribution as if it were the whole).
    sampled: number
    truncated: boolean
  }
  // Runs that SUCCEEDED but whose checkpoint commit failed — the model did the work and the diff
  // never reached the branch. A quality signal, not a failure, so it is counted on its own.
  checkpointFailures: number
  stopReasons: { key: string; count: number }[]
  byMachine: BuildMonitorDimensionRow[]
  byTeam: BuildMonitorDimensionRow[]
  byPhase: BuildMonitorDimensionRow[]
}

// Why a run is on the stuck list. These are the three sweeps' own candidate sets, not a wait-time
// heuristic: a run queued for hours behind a full machine is healthy and appears on none of them.
export type StuckRunKind = 'offline' | 'stranded' | 'sink_pending'

export interface StuckRun {
  runId: string
  buildId: string
  kind: StuckRunKind
  // The specific evidence, already resolved server-side ('machine offline for 14m', 'job missing',
  // 'claim loop wedged') so the console never re-derives a judgement the sweep already made.
  detail: string
  phase: StepKind
  status: BuildRunStatus
  machineId: string | null
  machineName: string | null
  teamId: string | null
  teamName: string | null
  createdAt: number
  ageMs: number
}

export interface BuildRunListItem {
  id: string
  buildId: string
  status: BuildRunStatus
  phase: StepKind
  triggerSource?: BuildTriggerSource
  errorMessage?: string
  errorKind?: RunErrorKind
  stopReason?: TurnStopReason
  checkpointError?: boolean
  machineId: string | null
  machineName: string | null
  teamId: string | null
  teamName: string | null
  createdAt: number
  startedAt?: number
  completedAt?: number
  queueWaitMs: number | null
  execMs: number | null
}

// A conversation's context-window occupancy: the machine's session.getContextUsage() at a turn's end,
// persisted on the run and surfaced in the UI. tokens is null right after a compaction. Shared by the
// server (currentContextUsage / claimRun) and the client (ChiefData.context).
export interface ContextUsage {
  tokens: number | null
  contextWindow: number
}

// Token usage + estimated cost for one model call or a derived aggregate.
export interface RunUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  // USD from the provider's price table — an estimate; 0 when the model has no pricing data.
  costUsd: number
}

// One real LLM request within a run. Array order preserves retries, tool continuations and fallbacks.
export interface ModelCall {
  provider: string
  modelId: string
  thinkingLevel: string
  // Epoch ms when the call's response settled — places each call on the run's wall-clock timeline,
  // which is the only way to tell a continuously grinding turn from one that wedged mid-run.
  // Absent from calls reported by CLIs that predate the field.
  at?: number
  usage: RunUsage
}

// Response-only aggregate of ModelCall entries for one model.
export interface ModelUsage extends RunUsage {
  provider: string
  modelId: string
}

// A server-registered tool the executor exposes verbatim: metadata only, execution stays on the
// server (POST /api/machine/tool/[stepId] { name, params }). The executor is semantics-blind —
// adding or changing one of these never requires a CLI release.
export interface RemoteToolDef {
  name: string
  label: string
  description: string
  parameters: Record<string, unknown>   // JSON Schema, passed through to the SDK verbatim
  // Safe for the executor to re-issue after a transport failure or a server-marked transient
  // response: a side-effect-free read.
  // A timed-out call may already have run server-side, so this stays off anything that writes.
  // Server-decided (see REPLAY_SAFE_TOOLS) to keep the executor's proxy semantics-blind; a CLI that
  // predates the field just never retries.
  replaySafe?: boolean
}

// The conversation's git branch — the protocol constant shared by the executor (worktree branch,
// push) and the server (PR head). One template, derived from the conversation/build id.
export const convBranch = (conversationId: string): string => `tds/conv-${conversationId}`

// The reverse predicate — the prefix is an implementation detail of convBranch, so callers that
// must tell conv working branches from real repo branches go through this, not a bare startsWith.
export const isConvBranch = (branch: string): boolean => branch.startsWith('tds/conv-')

// The full reverse mapping: the conversation/build id a conv branch was derived from, or null for
// any other branch. Same reasoning — the prefix stays in this one place.
export const convBranchBuildId = (branch: string): string | null =>
  isConvBranch(branch) ? branch.slice('tds/conv-'.length) : null

// The one push failure the machine cannot resolve on its own: the remote conv branch holds commits
// the worktree does not, and merging them in hit conflicts. Every other lease failure self-heals
// (the executor re-reads the remote and pushes), so this prefix is what tells the server it is
// looking at an outside edit — GitHub's "Update branch", a Files-page write, a hand push — rather
// than at a stale record of its own. Executor writes it, server matches it; keep them in step.
export const REMOTE_BRANCH_DIVERGED = 'remote branch diverged'

// Older servers read a merge turn's push failure from checkpointError under this prefix. Current
// executors also send PushOutcome, but keep the prefix during rolling upgrades.
export const PUSH_FAILED_PREFIX = 'Branch push failed: '

// Credential failures shared by the executor's one-time refresh gate and push classification.
export const AUTH_GIT_ERROR_RE = /Authentication failed|Invalid username or (token|password)|authentication required|Bad credentials|could not read Username|Permission denied \(publickey\)/i

// Transient git transport failures (TLS/DNS/connection drops, 5xx, the executor's own timeout
// kill). One regex serves the executor's retry policy and push classification because two copies
// drifted apart once (GnuTLS).
export const TRANSIENT_GIT_ERROR_RE = /SSL_ERROR_SYSCALL|SSL_connect|SSL_read|schannel|gnutls_handshake|GnuTLS|HTTP2 framing layer|[Cc]ould(n't| not) connect to server|[Cc]ould not resolve host|Temporary failure in name resolution|Connection (timed out|reset|refused)|Operation timed out|Failed to connect|[Rr]ecv failure|[Ss]end failure|early EOF|RPC failed|unexpected disconnect|remote end hung up|The requested URL returned error: 5\d\d|was killed \(/

// git's word for "this machine's record of the remote branch is not what the remote holds" — the
// only rejection --force-with-lease produces (LC_ALL=C keeps the wording stable). Shared by the
// executor's lease-retry check and push classification, same drift doctrine as the two above.
export const STALE_LEASE_RE = /stale info/

export type PushErrorKind = 'auth' | 'stale_lease' | 'diverged' | 'network' | 'other'

export type PushOutcome =
  | { ok: true }
  | { ok: false; error: string; kind: PushErrorKind; staleLeaseRetried: boolean }

// Every consumer needs the same narrowing to the failed variant, so it lives next to the type.
export const failedPushOf = (outcome?: PushOutcome): Extract<PushOutcome, { ok: false }> | undefined =>
  outcome && !outcome.ok ? outcome : undefined

// What the machine reports after pushing a clean merge onto the default branch of an external
// repo (workspace.landOnClean) — the server cannot reach that remote, so this is the landing.
export type LandOutcome =
  | { ok: true }
  | { ok: false; reason: 'base_moved' | 'provider_rejected' | 'upstream'; error: string }

// The change review's hunk-tier diff of an external project's turn, computed on the machine after
// the checkpoint push (the server never reaches the user's git server) and posted to
// /api/machine/changes/<stepId>: `git diff -U3 <mergeBaseSha>..<headSha>` with lockfiles excluded,
// or only its file list when the patch would exceed CHANGES_DIFF_MAX_BYTES. The server files it by
// headSha, which is the commitSha the same turn's /done reports.
export const CHANGES_DIFF_MAX_BYTES = 1_000_000

export type MachineChangesReport = {
  headSha: string
  mergeBaseSha: string
  raw?: string
  tooLarge?: { actualBytes: number; files: { path: string; additions: number; deletions: number }[] }
}

export function classifyPushError(text: string): PushErrorKind {
  return text.includes(REMOTE_BRANCH_DIVERGED) ? 'diverged'
    : STALE_LEASE_RE.test(text) ? 'stale_lease'
    : AUTH_GIT_ERROR_RE.test(text) ? 'auth'
    : TRANSIENT_GIT_ERROR_RE.test(text) ? 'network'
    : 'other'
}

// Offer the "release window" (compaction) action only once the context window is at least this % full.
// A percentage, not a token count, by design: pi only summarizes conversation history older than its
// keep-recent budget (DEFAULT_COMPACTION_SETTINGS.keepRecentTokens = 20000), but our meter measures TOTAL
// occupancy — system prompt + tool schemas included — so a near-empty session can read ~20k tokens yet
// have nothing pi would compact (→ pi throws "Nothing to compact"). pi doesn't export the authoritative
// prepareCompaction() check, so we gate on a high fill level instead: by here the summarizable history
// necessarily dwarfs the fixed overhead + keep-recent budget. The UI hides the action below it, the
// server refuses it.
export const COMPACT_MIN_CONTEXT_PERCENT = 50

// In-loop auto-compaction trigger, delivered to the executor as a pi compaction override
// (StepModelConfig.compaction). pi's stock reserveTokens (16384) only trips at window - 16k — 98.4%
// of a 1M window, past the point where the summarization request itself outgrows the summary
// model (RunErrorKind 'compact_overflow'). A pure percent, no absolute cap: the executor's
// compaction-trim extension clips old tool results before summarization, so the summary request
// no longer tracks occupancy and a large window can actually be used before compacting. The
// remaining price of a high trigger point is per-turn prefill cost/latency near the threshold —
// a policy dial, tunable here without a CLI release.
export const AUTO_COMPACT_PERCENT = 80
export function autoCompactThreshold(contextWindow: number): number {
  return Math.floor((contextWindow * AUTO_COMPACT_PERCENT) / 100)
}

// The delivered override for one step's model — pi compacts when contextTokens > window - reserveTokens.
// keepRecentTokens scales with the threshold (pi's flat 20k is aggressive for a long-lived chief),
// capped so a large window doesn't keep back half of what compaction should free. pi spends the
// budget against its chars/4 estimate, which a production chief measured 2.3x low on CJK-heavy
// history (a 50k budget kept ~114k real tokens, so compaction landed at 51% of a 272k window) —
// the delivered number is therefore half the real-token target, so the overshoot lands near the
// target instead of double it. undefined for a window we can't reason about (misconfigured custom
// model): a non-positive reserveTokens would make shouldCompact always-true, compacting after
// every assistant message.
export function stepCompactionSettings(contextWindow: number | undefined): { reserveTokens: number; keepRecentTokens: number } | undefined {
  if (!contextWindow || contextWindow <= 0) return undefined
  const threshold = autoCompactThreshold(contextWindow)
  return { reserveTokens: contextWindow - threshold, keepRecentTokens: Math.min(Math.floor(threshold / 8), 25_000) }
}

// Server policy for the executor's compaction-trim extension, delivered per step as
// StepModelConfig.compactionTrim. The CLI bakes in NONE of these: a field the claim doesn't carry
// disables that trim (an old server leaves pi's stock compaction untouched), so every number stays
// tunable here without a CLI release. summaryMaxTokens caps the summary request — pi's own cap is
// min(0.8*reserveTokens, model.maxTokens), and reserveTokens runs to hundreds of thousands, so
// without this the model's output ceiling is what binds. toolResultKeepChars / textKeepChars clip
// old tool results / long text before summarization; textKeepChars also drops assistant thinking
// (unbounded by definition).
export const COMPACTION_TRIM = { toolResultKeepChars: 2_000, textKeepChars: 4_000, summaryMaxTokens: 5_000 }

// One in-loop auto-compaction the executor ran during a turn. usage/durationMs are absent from
// CLIs predating the fields — consumers treat them as optional.
export interface CompactionReport {
  tokensBefore?: number
  usage?: RunUsage
  durationMs?: number
}

// 'compact' rewrites the session in place via pi's native compaction (summarize older turns, keep
// recent verbatim) — no prompt, no workspace; the machine opens the session, calls session.compact(),
// backs up to object storage, and reports the freed context. Rides the producing-run lifecycle for the single
// in-flight gate + SSE, but the /done route settles it in a dedicated branch (like 'restore').
export type ModelStepMode = 'persistent_turn' | 'ephemeral_turn' | 'compact'
export type MachineStepMode = ModelStepMode | 'restore' | 'branch_sync'

// Agent/session steps; non-session queue jobs live in machineJob.ts. Machine is unaware of phase
// semantics — the server orchestrates via the build_run (durable truth) + a slim Redis step-meta cache.
// An attachment image reference as it travels to the executor: the storage key plus a short-lived
// presigned GET `url`, signed server-side (at claim for step prompts, at delivery for steers).
export type AttachmentImageRef = { key: string; url?: string; mimeType: string }

interface MachineStepBase {
  stepId: string                                  // /api/machine/done/<stepId>, /token/<stepId>
  conversationId: string                          // worktree dir, conv branch, attachments, deferred-work chain
  // Native session identity + mirror identity (ConversationSession.id): the local transcript and
  // the presigned session URLs are keyed by it, and it rotates on a runtime handoff, so a rotated
  // conversation never resumes another runtime's transcript. Absent only on a code-only restore.
  sessionId?: string
  // The runtime this step's session belongs to, when it is not pi: the turn runs on that CLI, and a
  // restore rewinds that CLI's session. Absent = pi.
  runtime?: ExternalAgentRuntime

  sessionRestoreUrl?: string
  sessionBackupUrl?: string

  // Present ⇒ machine ensures a git worktree at workspacesRoot()/<conversationId>
  // for the repo before running the prompt. freshBase forces a default-branch fetch even on a hot
  // worktree (merge turns must see the real base; a stale origin/<defaultBranch> hides conflicts).
  // The checkpoint push is synchronous before /done on every turn; syncPush (merge turns) keeps
  // the full retry profile — the sink merges the PR right after, so the head must land whatever
  // it costs. The name predates sync-everywhere; older CLIs read it as "await the push at all",
  // so renaming waits for their retirement.
  workspace?: {
    projectId: string
    repoFullName: string
    defaultBranch: string
    // Repo credential: GitHub installation token, or a platform git grant when gitHost is set.
    // Wire name kept for CLI compatibility.
    installationToken: string
    // Origin of the git remote, e.g. "https://git.todos.dev". Absent ⇒ github.com.
    gitHost?: string
    // External projects: the user's own remote, the only one the machine clones and pushes. The
    // three fields above are then empty — Todos hosts nothing for such a project. username and
    // token are filled at claim only — the queued job never carries them.
    remote?: { url: string; username?: string; token?: string }
    freshBase?: boolean
    syncPush?: boolean
    // Merge turns of an external project: a clean merge is pushed onto the default branch by the
    // machine itself, reported as LandOutcome.
    landOnClean?: boolean
  }

  prompt: string                                  // fully assembled by server
  // Images referenced by attachment: markers in the user's message. `url` is a
  // presigned GET injected at claim time (same lifecycle as sessionRestoreUrl).
  images?: AttachmentImageRef[]
  // Skills referenced by `[name](skill:id)` markers in the spec/message. Metadata only —
  // `name`/`description` go into the system prompt (progressive disclosure); the machine
  // fetches `files` lazily via the claim-signed `url` and caches them by (id, updatedAt).
  skills?: {
    id: string
    name: string
    description: string
    updatedAt: number                             // cache version: bumped when the skill is edited/re-synced
    files: { name: string; url?: string }[]       // SKILL.md first; url signed at claim
  }[]
  // Local tool whitelist: SDK built-ins plus executor-local custom tools (web_fetch, and
  // remote_shell when the assigned agent carries the grant). Server-executed tools ride in
  // remoteTools instead — present = exposed (to an external runtime over the executor's MCP bridge).
  tools: string[]
  remoteTools?: RemoteToolDef[]
  // A turn that must leave the worktree as it found it (plan track, review): the executor discards
  // its file changes before any checkpoint. pi's toolset already lacks write/edit there; an
  // external runtime brings its own editors, so this flag is the only signal it gets.
  readOnly?: boolean

  // The team's shell-enabled machines, present when the assigned agent carries the remote_shell
  // grant. remote_shell targets one of these by name/id; absent/empty ⇒ none reachable.
  remoteMachines?: RemoteMachine[]

  // Secret metadata — the team-level secrets and the step's own project's (never values — those
  // ride the claim response as secretEnv and go straight into bash's child-process env).
  secretNames?: { name: string; description: string }[]
}

// The provider definition a model step runs against, resolved server-side at claim time from the
// team's model catalog. For api_key/custom kinds this is authoritative — the executor registers it
// verbatim and never consults its local pi builtin table, so new models and catalog patches ship
// with a server deploy, no CLI release. builtin_oauth ships one too wherever it can, for the same
// reason; it falls back to credential-only (model defs resolved from the executor's own pi) for a
// provider with a filterModels hook registerProvider would bypass, or one whose api this shape
// cannot carry.
export interface StepModelProviderDef {
  name?: string
  baseUrl: string
  api: ModelProviderApi
  authHeader?: boolean
  headers?: Record<string, string>
  compat?: { supportsDeveloperRole?: boolean }
  models: ModelProviderModelDef[]
}

export interface StepModelConfig {
  kind: ModelProviderKind
  providerId: string
  // Decrypted at claim, present on the claim response only — never in the queue, never logged.
  // For rotating-refresh OAuth providers (openai-codex, anthropic) the server strips `refresh`
  // before sending: a local pi refresh would rotate the token and orphan the server's copy.
  credential: ModelProviderCredential
  // Present for api_key/custom kinds, absent for builtin_oauth (see StepModelProviderDef).
  provider?: StepModelProviderDef
  // Stream transport for this provider (today only pi's openai-codex adapter reads it). This is
  // server policy — absent leaves pi's own default in place; a machine's pi settings file that
  // names a transport outranks it.
  transport?: 'sse' | 'websocket' | 'websocket-cached' | 'auto'
  // pi in-loop auto-compaction override for this step's model (stepCompactionSettings). Same
  // delivery contract as transport: absent leaves pi's default; a settings file that names its
  // own compaction outranks it.
  compaction?: { reserveTokens: number; keepRecentTokens?: number }
  // Compaction-trim policy for this step (COMPACTION_TRIM), plus the model the summary runs on
  // (the chief's compactionModel, resolvable from this step's modelConfigs; absent = the step's
  // own model). Kept out of `compaction` — that object feeds pi's settings schema verbatim.
  // Every field is optional and an absent one disables that trim: the executor carries no
  // fallback numbers of its own.
  compactionTrim?: {
    provider?: string
    modelId?: string
    summaryMaxTokens?: number
    toolResultKeepChars?: number
    textKeepChars?: number
  }
}

// Every model-running step carries a complete config. The executor never guesses or falls back to a
// different model; Agent edits affect only steps assembled after the edit.
export interface ModelMachineStep extends MachineStepBase {
  mode: ModelStepMode
  sessionId: string
  agent: AgentRunConfig
  // External-runtime rewind: resume the conversation's session only up to this chain-entry UUID on
  // this turn (claude-code resumeSessionAt). One-shot — set by the assembler from the conversation's
  // pendingSessionResumeAt, never persisted on the queued job beyond this step.
  resumeSessionAt?: string
  // Replaces the executor-side pi base system prompt wholesale. pi then no longer generates the
  // Available-tools list or per-tool guidelines — the replacement owns all tool guidance; pi still
  // appends appendSystemPrompt, the skills section (requires 'read' in step.tools), and cwd after
  // it. No degradation path: claim strips this for CLIs below SYSTEM_PROMPT_MIN_CLI_VERSION (they
  // run pi's default prompt), so a load-bearing replacement must gate at enqueue instead.
  systemPrompt?: string
  // Platform guidance (delivery mechanics, branch policy, secrets, grants) appended once to the
  // system prompt (pi default or systemPrompt replacement alike) instead of riding every turn
  // prompt. Claim folds it into `prompt` for CLIs below SYSTEM_PROMPT_MIN_CLI_VERSION, so the
  // content must stay position-agnostic while that shim lives. Both fields are named after the
  // pi loader options they feed.
  appendSystemPrompt?: string
  // Claim-time enrichment (attachStepUrls' sibling): both are response-only fields, absent from the
  // queued job. Exactly one of modelConfigs/modelConfigError is set by claim; an unreadable provider
  // fails the step through the executor's normal done({error}) path. The array holds every provider
  // the step may use — today always exactly the one for agent.provider; executors select by
  // providerId, so future entries (e.g. fallback models) degrade gracefully on older CLIs.
  modelConfigs?: StepModelConfig[]
  modelConfigError?: string
  // Decrypted team secret values (name → value) for steps whose secretNames grant them.
  secretEnv?: Record<string, string>
  // Team MCP servers granted to the acting agent, metadata only (queued job — no credentials).
  // Rides every phase including review (MCP tools aren't bash-gated the way secrets are). The
  // executor connects, discovers tool names via tools/list, and folds them into its runtime tool
  // allow-list — the server can't precompute those names (dynamic discovery, sometimes over a
  // stdio transport only that machine can reach).
  mcpServers?: StepMcpServerRef[]
  // Claim-time enrichment (secretEnv's sibling): decrypted headers/env per granted server,
  // response-only. A server absent here (decrypt failed) is skipped outright by the executor.
  mcpServerCredentials?: StepMcpServerCredential[]
  // Wait this long once the session is ready, before the first model call, folding steers that
  // land meanwhile into the prompt — the chief's gate-park wakes gather siblings that park seconds
  // apart. Absent = start at once, which is also what CLIs predating the field do.
  gatherMs?: number
}

// Pure restore/rebuild does no model call; it needs only the routing agent id. A checkpoint is absent
// for a cold worktree rebuild and present for an actual conversation rewind. Without sessionId the
// step rewinds code only — the conversation's session was reset server-side.
export interface RestoreMachineStep extends MachineStepBase {
  mode: 'restore'
  agent: Pick<AgentSelection, 'agentId'>
  restore?: RestoreCheckpoint
}

export type MachineStep = ModelMachineStep | RestoreMachineStep

// A mid-turn steer message as delivered to the executor in /token and /heartbeat responses.
// `images` carry presigned GET urls signed at consume time (same lifecycle as MachineStep.images).
// Delivery consumes the queued entry, so the executor asks for steers only while a prompt runs to
// take them: a poll whose body carries `steer: false` gets none, and entries arriving after the
// last prompt stay queued for the server's leftover resume (the next turn) instead of being lost.
export interface SteerPayload {
  text: string
  images?: AttachmentImageRef[]
  // Explicit request to kill the bash command in flight so this steer lands now instead of at a
  // tool boundary that may never come. Executors that predate the field queue the steer as usual.
  interrupt?: boolean
}

export function isModelMachineStep(step: MachineStep): step is ModelMachineStep {
  return step.mode !== 'restore'
}

// A machine the agent can run commands on via remote_shell.
export interface RemoteMachine {
  machineId: string
  name: string
  // Presence at the last step-heartbeat refresh (absent on the claim-time snapshot). Lets the tool
  // tell "machine offline" apart from "machine up, tunnel down" — same truth the web UI shows.
  online?: boolean
}

export const DEFAULT_MAX_CONCURRENT_TASKS = 6
// The presence lease behind isOnline: the daemon renews it every 20s, so any death (signal, crash,
// kill -9, a closed lid) reads as offline within this window. Shared because the client mirrors the
// same lease — a machine that stops beating has no event to announce it, so the client expires its
// own copy on this clock rather than waiting for a refetch.
export const MACHINE_PRESENCE_TTL_MS = 60_000

export interface MachinePublic extends Machine {
  isOnline: boolean
  // Latest published @todos-dev/cli version, attached by the team machines route (null when the
  // registry lookup fails — consumers hide the update hint rather than guess).
  latestCliVersion?: string | null
}

// The per-machine ceiling on tasks run at once, the same on every plan — parallelism is bought as
// machines, not as a plan number. It bounds what one machine can cost the server (every active step
// heartbeats and streams), and the hosted sizes' defaults all sit under it. Shared with
// UpdateMachineRequestSchema's ConcurrencySchema so the form field and the route agree on the range.
export const CONCURRENCY_MIN = 1
export const CONCURRENCY_MAX = 10

// Validate a concurrency cap from arbitrary input (form field / query); null if invalid. Hand-rolled
// rather than reusing the zod schema: this runs in the client, which must not load zod (./schemas).
export function normalizeConcurrency(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= CONCURRENCY_MIN && n <= CONCURRENCY_MAX ? n : null
}

// An explicit cap always wins, clamped to CONCURRENCY_MAX: a machine doc written before the ceiling
// dropped may hold a larger number, and the executor drops an out-of-range cap and runs at 1. Without
// one, a hosted machine's default follows the size it is actually running at (awakeSize, not the
// size a pending resize has chosen) — dispatching eight tasks to a container that is still 1 vCPU
// would overload it, and the conservative direction is the safe one because the next wake updates it.
// Takes the sandbox fields structurally rather than as Pick<Machine, 'sandbox'>, so the trimmed
// sandbox the machines list ships to clients (MachineRow) satisfies it as readily as a full Machine.
export function effectiveMaxConcurrentTasks(
  machine: Pick<Machine, 'maxConcurrentTasks' | 'kind'> & { sandbox?: Pick<SandboxState, 'size' | 'awakeSize'> },
): number {
  if (machine.maxConcurrentTasks != null) return Math.min(machine.maxConcurrentTasks, CONCURRENCY_MAX)
  if (!isHostedMachine(machine)) return DEFAULT_MAX_CONCURRENT_TASKS
  return SANDBOX_SIZE_SPECS[sandboxAwakeSizeOf(machine.sandbox)].defaultConcurrentTasks
}

// Heartbeat cadence of /api/machine/stream. Shared because the executor's black-hole watchdog
// derives its threshold from it — the two sides must not drift apart.
export const MACHINE_STREAM_PING_MS = 3_000

// The CLI stamps every machine request with its own version; verifyMachineToken records it.
export const TDS_VERSION_HEADER = 'x-tds-version'

// Strict major.minor.patch; null for anything else ('unknown', dev builds, garbage).
function parseCliVersion(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

// Whether a machine's reported tds version is behind `latest`. Missing/unparseable current counts
// as outdated (old CLIs never report); an unparseable `latest` disables the hint instead.
// CLI version the provider-migration notices point at. Server-managed providers work from 0.1.34,
// but the notices name the current npm latest so the number matches what `npm install -g` delivers.
export const PROVIDER_MIN_CLI_VERSION = '0.1.35'

// First CLI that understands MachineStep.workspace.gitHost (any non-github.com git origin).
// Builds whose workspace carries gitHost are refused at enqueue for machines below this — an
// older CLI would silently clone the repo path from github.com and fail with a misleading 404.
export const GIT_HOST_MIN_CLI_VERSION = '0.1.37'

// First CLI that pushes an external project's work to the user's server alone and reports the
// change diff itself (MachineChangesReport). 0.1.58, the first with workspace.remote, still
// force-pushed every turn to a mirror on the Todos git host and counted the push as failed when
// that mirror refused — which it always does now that none is created.
export const EXTERNAL_GIT_MIN_CLI_VERSION = '0.1.59'

// The CLI floor a repo puts on the machine that builds it; undefined for github.com. One answer
// from the project (before a step exists) and one from a queued step's workspace.
export function projectGitCliFloor(p: { provider?: ProjectProvider | null }): string | undefined {
  return isExternalProject(p) ? EXTERNAL_GIT_MIN_CLI_VERSION : isPlatformProject(p) ? GIT_HOST_MIN_CLI_VERSION : undefined
}

export function workspaceGitCliFloor(workspace?: { gitHost?: string; remote?: unknown }): string | undefined {
  return workspace?.remote ? EXTERNAL_GIT_MIN_CLI_VERSION : workspace?.gitHost ? GIT_HOST_MIN_CLI_VERSION : undefined
}

export type MachineBuildUnavailableReason = 'build_disabled' | 'cli_outdated' | 'git_host_unsupported'

export function machineCliBelowFloor(machine: Pick<Machine, 'kind' | 'cliVersion'>, min: string): boolean {
  return !(isHostedMachine(machine) && !machine.cliVersion) && isCliVersionOutdated(machine.cliVersion, min)
}

export function machineBuildUnavailableReason(
  machine: Pick<Machine, 'buildEnabled' | 'kind' | 'cliVersion'>,
  gitFloor?: string,
): MachineBuildUnavailableReason | null {
  if (!machine.buildEnabled) return 'build_disabled'
  if (machineCliBelowFloor(machine, PROVIDER_MIN_CLI_VERSION)) return 'cli_outdated'
  if (gitFloor && machineCliBelowFloor(machine, gitFloor)) return 'git_host_unsupported'
  return null
}

// First CLI that applies ModelMachineStep.systemPrompt (replace) and appendSystemPrompt (append)
// to the pi system prompt. Claim degrades both for older CLIs: the append folds into the turn
// prompt, a replacement is stripped (it has no fold equivalent).
export const SYSTEM_PROMPT_MIN_CLI_VERSION = '0.1.39'

// First CLI that connects to step.mcpServers and exposes their tools. No enqueue/claim gate —
// an older CLI ignores the field and the turn just runs without MCP tools — so this only feeds
// the UI hint on the MCP-servers page.
export const MCP_MIN_CLI_VERSION = '0.1.45'

// First CLI that consumes branch_sync jobs from the shared machine queue.
export const BRANCH_SYNC_MIN_CLI_VERSION = '0.1.50'

// First CLI that keys external-runtime sessions by step.sessionId (claude-code, codex, grok-build
// on a handoff-capable conversation). Machines below this are filtered out by machineSelect when
// dispatching external-runtime steps.
export const EXTERNAL_RUNTIME_MIN_CLI_VERSION = '0.1.53'

// First CLI that serves step.remoteTools to an external runtime over `tds mcp-bridge`.
export const EXTERNAL_TOOLS_BRIDGE_MIN_CLI_VERSION = '0.1.54'

// First CLI with `tds upgrade`, which upgrades the install it runs from and restarts the daemon.
// A machine below it is still handed `npm install -g` plus `tds restart`.
export const UPGRADE_COMMAND_MIN_CLI_VERSION = '0.1.57'

export const machineHasUpgradeCommand = (m: Pick<Machine, 'cliVersion'>): boolean =>
  !isCliVersionOutdated(m.cliVersion, UPGRADE_COMMAND_MIN_CLI_VERSION)

export const machineRuntimeDisabled = (m: Pick<Machine, 'disabledRuntimes'>, runtime: ExternalAgentRuntime): boolean =>
  !!m.disabledRuntimes?.includes(runtime)

// The machine's last presence beat found the runtime installed and no admin switched it off there —
// what the providers page and the runtime picker call "available" (dispatch adds the CLI floor).
export const machineOffersRuntime = (m: Pick<Machine, 'runtimes' | 'disabledRuntimes'>, runtime: ExternalAgentRuntime): boolean =>
  !!m.runtimes?.includes(runtime) && !machineRuntimeDisabled(m, runtime)

// Whether the machine's last probe of the runtime found a sign-in. No probe yet, or one that
// failed, is no evidence either way — only a reported `signed_out` is.
export const machineRuntimeSignedIn = (m: Pick<Machine, 'runtimeUsage'>, runtime: ExternalAgentRuntime): boolean =>
  m.runtimeUsage?.[runtime]?.status !== 'signed_out'

// Where a turn on the runtime can actually run: offered by the machine and signed in there.
export const machineCanRunRuntime = (m: Pick<Machine, 'runtimes' | 'disabledRuntimes' | 'runtimeUsage'>, runtime: ExternalAgentRuntime): boolean =>
  machineOffersRuntime(m, runtime) && machineRuntimeSignedIn(m, runtime)

// What a machine picker lists: build-capable, and offering the agent's runtime when it runs on one.
export const pickableMachines = <M extends Pick<Machine, 'buildEnabled' | 'kind' | 'cliVersion' | 'runtimes' | 'disabledRuntimes'>>(
  machines: M[],
  { gitFloor, runtime }: { gitFloor?: string; runtime?: ExternalAgentRuntime },
): M[] => machines.filter((m) => !machineBuildUnavailableReason(m, gitFloor) && (!runtime || machineOffersRuntime(m, runtime)))

export function isCliVersionOutdated(current: string | null | undefined, latest: string): boolean {
  const l = parseCliVersion(latest)
  if (!l) return false
  const c = current ? parseCliVersion(current) : null
  if (!c) return true
  for (let i = 0; i < 3; i++) {
    if (c[i] !== l[i]) return c[i] < l[i]
  }
  return false
}

// Shared provenance for persisted actions and analytics.
export type ActionVia = 'web' | 'chief' | 'build_agent' | 'mcp'

// A granted build reachable through remote_shell. machineId names its builder machine;
// the remote machine holds one multiplexed connection per builder.
export interface ExecTarget {
  buildId: string
  machineId: string
}

// One remote_shell exec connection's health, reported by the shell-enabled machine in its presence
// heartbeat while it holds exec targets — per builder machine it should be reachable for. Fills the
// gap presence can't: connected=false with no error is the connecting/first-time-setup window
// (tailnet join can take minutes on a machine that just enabled shell access); error is the last
// transport failure, cleared by the next successful connect.
export interface ExecSyncStatus {
  builderMachineId: string
  connected: boolean
  error?: string
}
