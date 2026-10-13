#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/nodeCheck.ts
var MIN = [22, 19, 0];
var rank = ([major, minor, patch]) => major * 1e6 + minor * 1e3 + patch;
var found = process.versions.node.split(".").map((part) => parseInt(part, 10) || 0);
if (rank(found) < rank(MIN)) {
  console.error(`tds requires Node.js >= ${MIN.join(".")} (found ${process.versions.node}).`);
  console.error("Upgrade Node, e.g. `nvm install 22 && nvm alias default 22`, then reinstall: npm i -g @todos-dev/cli@latest");
  process.exit(1);
}

// src/commands/start.ts
var import_fs7 = require("fs");
var import_path4 = require("path");

// src/lib/piRuntime.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/lib/machineConfig.ts
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");
function tdsDir() {
  return process.env.TDS_HOME || (0, import_path.join)((0, import_os.homedir)(), ".tds");
}
function tdsPath(...segments) {
  return (0, import_path.join)(tdsDir(), ...segments);
}
function configPath() {
  return tdsPath("machine.json");
}
function loadConfig() {
  const p = configPath();
  if (!(0, import_fs.existsSync)(p)) return null;
  try {
    const cfg = JSON.parse((0, import_fs.readFileSync)(p, "utf-8"));
    if (cfg.token && cfg.machineId) return cfg;
  } catch {
  }
  return null;
}
function saveConfig(config) {
  (0, import_fs.mkdirSync)(tdsDir(), { recursive: true });
  (0, import_fs.writeFileSync)(configPath(), JSON.stringify(config, null, 2), { mode: 384 });
}
function clearConfig() {
  const p = configPath();
  try {
    if ((0, import_fs.existsSync)(p)) (0, import_fs.rmSync)(p);
  } catch {
  }
}

// src/lib/piRuntime.ts
var cached = null;
async function getPiRuntime() {
  if (cached) return cached;
  const agentDir2 = tdsPath("agent-runtime");
  (0, import_node_fs.mkdirSync)(agentDir2, { recursive: true });
  for (const legacy of ["auth.json", "models.json"]) {
    try {
      (0, import_node_fs.rmSync)((0, import_node_path.join)(agentDir2, legacy), { force: true });
    } catch {
    }
  }
  const sdk = await import("@earendil-works/pi-coding-agent");
  cached = { agentDir: agentDir2, sdk };
  return cached;
}

// src/lib/workspace.ts
var import_node_child_process2 = require("node:child_process");
var import_node_fs3 = require("node:fs");
var import_promises2 = require("node:fs/promises");
var import_node_path3 = require("node:path");

// ../../packages/types/src/branchSync.ts
var BRANCH_SYNC_HEARTBEAT_MS = 2e4;

// ../../packages/types/src/machineJob.ts
var MACHINE_JOB_LOCK_MS = 3 * 60 * 1e3;
var isBranchSyncJob = (job) => job.mode === "branch_sync";
var branchSyncRequestId = (stepId) => /^branch-sync-([a-zA-Z0-9_-]{8,100})$/.exec(stepId)?.[1] ?? null;

// ../../packages/types/src/syncPath.ts
function normalizeDir(dir) {
  return dir.trim().replace(/[/\\]+$/, "");
}
var SYSTEM_ROOTS = ["/etc", "/usr", "/bin", "/sbin", "/lib", "/boot", "/dev", "/proc", "/sys", "/var", "/system", "/library", "/applications"];
var WINDOWS_SYSTEM_ROOTS = /* @__PURE__ */ new Set(["windows", "winnt", "program files", "program files (x86)", "programdata"]);
var CONTAINER_ROOTS = /* @__PURE__ */ new Set(["volumes", "mnt", "media", "users", "home"]);
function destDirProblem(dir) {
  if (!dir.trim()) return "is empty";
  if (/[\x00-\x1f]/.test(dir)) return "contains control characters";
  const p = normalizeDir(dir);
  if (!p) return "is the root of a whole drive or filesystem";
  if (p.startsWith("~") && p !== "~" && !p.startsWith("~/") && !p.startsWith("~\\")) {
    return 'starts with "~" followed by a name \u2014 only "~/" is expanded to the home directory, so this would be taken literally';
  }
  const winDrive = /^[a-zA-Z]:([/\\]|$)/.test(p);
  const isUnc = p.startsWith("\\\\");
  const isPosix = p.startsWith("/");
  const isHome = p === "~" || p.startsWith("~/") || p.startsWith("~\\");
  if (!isHome && !isPosix && !winDrive && !isUnc) return 'is a relative path \u2014 it must be absolute, or start with "~/" for a folder under the home directory';
  const segments = p.split(/[/\\]+/).filter((s) => s && s !== "~" && !/^[a-zA-Z]:$/.test(s));
  if (segments.includes("..")) return 'contains ".."';
  const lower = p.toLowerCase();
  if (isPosix && SYSTEM_ROOTS.some((r) => lower === r || lower.startsWith(`${r}/`))) return "is inside a system directory";
  if (winDrive && segments.length && WINDOWS_SYSTEM_ROOTS.has(segments[0].toLowerCase())) return "is inside a system directory";
  if (isHome) return segments.length ? null : "is the home directory itself";
  if (isUnc) return segments.length >= 2 ? null : "names a whole network share rather than a folder inside it";
  if (!segments.length) return "is the root of a whole drive or filesystem";
  if (CONTAINER_ROOTS.has(segments[0].toLowerCase()) && segments.length < 3) return "names a whole home directory or volume rather than a folder inside it";
  return null;
}

// ../../packages/types/src/latex.ts
var SPACE = {
  ",": 3 / 18,
  ":": 4 / 18,
  ";": 5 / 18,
  "!": -3 / 18,
  " ": 6 / 18,
  quad: 1,
  qquad: 2,
  thinspace: 3 / 18,
  enspace: 0.5
};
var SUP_UNIFORM = new Set("0123456789+\u2212-=()ni\u2032\u2026,.");
var SUB_UNIFORM = new Set("0123456789+\u2212-=()aeoxhklmnpst\u2026,");

// ../../packages/types/src/tex-markdown.ts
var P = String.fromCharCode(57345);

// ../../packages/types/src/emoji.ts
var PICTO = "\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})*";
var EMOJI_SRC = `^(?:\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3|${PICTO}(?:\\u200D${PICTO})*|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]+\\u{E007F})$`;
var emojiRe = null;
try {
  emojiRe = new RegExp(EMOJI_SRC, "u");
} catch {
}
var segmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;

// ../../packages/types/src/index.ts
var EXTERNAL_AGENT_RUNTIMES = ["claude-code", "codex", "grok-build", "cursor", "antigravity", "devin", "copilot", "gemini-cli", "omp", "opencode", "qwen-code", "droid", "cline", "dsh"];
var AGENT_RUNTIMES = ["pi", ...EXTERNAL_AGENT_RUNTIMES];
var RUNTIME_MODELS_MAX = 256;
var PLAN_LIMITS = {
  free: {
    maxMembers: 1,
    maxAgents: 5,
    maxMachines: 1,
    maxHostedMachines: 0,
    maxProjects: 6,
    maxStorageBytes: 1024 ** 3,
    monthlyCreditUsd: 0
  },
  pro: {
    maxMembers: 3,
    maxAgents: 15,
    maxMachines: 4,
    maxHostedMachines: 1,
    maxProjects: 20,
    maxStorageBytes: 20 * 1024 ** 3,
    monthlyCreditUsd: 7
  }
};
var PRO_PRICE_CENTS = { monthly: 1900, yearly: 18240 };
var PRO_YEARLY_SAVING_PCT = Math.round(
  (1 - PRO_PRICE_CENTS.yearly / 12 / PRO_PRICE_CENTS.monthly) * 100
);
var SETUP_TOKEN_TTL_MS = 30 * 60 * 1e3;
var STEP_DEF = {
  plan: { track: "plan", sink: "chat", phase: { busy: "planning", rest: "confirm" } },
  plan_revision: { track: "plan", sink: "chat", phase: { busy: "planning", rest: "confirm" } },
  implement: { track: "implement", sink: "chat", phase: { busy: "building", rest: "review" } },
  implement_revision: { track: "implement", sink: "chat", phase: { busy: "building", rest: "review" } },
  merge: { track: "implement", sink: "chat", phase: { busy: "building", rest: "review" } },
  plan_review: { track: "plan", sink: "review" },
  implement_review: { track: "implement", sink: "review" },
  chief: { sink: "chief" }
};
var isReviewStep = (k) => STEP_DEF[k].sink === "review";
var REVIEW_STEP_KINDS = Object.keys(STEP_DEF).filter(isReviewStep);
var BUSY_PHASES = ["planning", "building", "plan_reviewing", "implement_reviewing"];
var ACTIVE_BUILD_PHASES = ["queued", ...BUSY_PHASES];
var UNBUILDABLE_TODO_PHASES = /* @__PURE__ */ new Set([...ACTIVE_BUILD_PHASES, "confirm"]);
function parseExternalRepoUrl(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
  const path = url.pathname.replace(/\/+$/, "");
  return path ? `${url.origin}${path}` : null;
}
var TEAM_SECRET_MAX_VALUE_BYTES = 64 * 1024;
var OAUTH_MODEL_PROVIDERS = ["github-copilot", "openai-codex"];
var OAUTH_CAPABLE_MODEL_PROVIDERS = [...OAUTH_MODEL_PROVIDERS, "xai"];
var defaultMaxTokens = (reasoning) => reasoning ? 64e3 : 16384;
function fillModelDefDefaults(def) {
  return {
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    ...def,
    name: def.name ?? def.id,
    reasoning: def.reasoning ?? false,
    input: def.input ?? ["text"],
    contextWindow: def.contextWindow ?? 128e3,
    maxTokens: def.maxTokens ?? defaultMaxTokens(def.reasoning)
  };
}
var IMAGE_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
var DOC_EXT = {
  "text/x-markdown": "md",
  "text/markdown": "md",
  "text/plain": "txt",
  "text/html": "html",
  "text/csv": "csv",
  "text/tab-separated-values": "tsv",
  "application/json": "json",
  "application/x-yaml": "yaml",
  "text/yaml": "yaml",
  "text/xml": "xml",
  "application/xml": "xml",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/msword": "doc",
  "application/vnd.ms-excel": "xls",
  "application/vnd.ms-powerpoint": "ppt"
};
var ATTACHMENT_EXT = { ...IMAGE_EXT, ...DOC_EXT };
var IMAGE_ACCEPT = Object.keys(IMAGE_EXT).join(",");
var MIME_BY_EXT = {
  ...Object.fromEntries(Object.entries(ATTACHMENT_EXT).map(([mime, ext]) => [ext, mime])),
  jpeg: "image/jpeg",
  htm: "text/html",
  yml: "text/yaml"
};
var ATTACHMENT_ACCEPT = [
  ...Object.keys(ATTACHMENT_EXT),
  ...Object.keys(MIME_BY_EXT).map((ext) => `.${ext}`)
].join(",");
var MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
var MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
var LOCAL_MARKER_SCHEMES = ["attachment", "doc", "skill", "todo", "project", "machine", "agent", "member"];
var CODE_WRAPPED_MARKER_RE = new RegExp(`\`(@?\\[[^\\]\`]*\\]\\((?:${LOCAL_MARKER_SCHEMES.join("|")}):[A-Za-z0-9_-]+\\))\``, "g");
var PR_DESCRIPTION_RE = /<pr_description>([\s\S]*?)<\/pr_description>/;
var MERGE_STATUS_RE = /<merge_status>\s*(clean|resolved)\s*<\/merge_status>/;
function parseMergeOutput(raw) {
  const prBody = raw.match(PR_DESCRIPTION_RE)?.[1]?.trim() || void 0;
  const status = raw.match(MERGE_STATUS_RE)?.[1];
  const text3 = raw.replace(new RegExp(PR_DESCRIPTION_RE, "g"), "").replace(new RegExp(MERGE_STATUS_RE, "g"), "").trim();
  return { text: text3, prBody, mergeStatus: status };
}
var COMMIT_MESSAGE_RE = /<commit_message>([\s\S]*?)<\/commit_message>/g;
var CONVENTIONAL_SUBJECT_RE = /^(feat|fix|refactor|perf|docs|test|chore|build|ci|style|revert)(\([^)]*\))?!?: \S/;
function parseCommitMessageTag(raw) {
  const tags = [...raw.matchAll(COMMIT_MESSAGE_RE)];
  const tagged = tags[tags.length - 1]?.[1].trim();
  return tagged && CONVENTIONAL_SUBJECT_RE.test(tagged) ? tagged : void 0;
}
var convBranch = (conversationId) => `tds/conv-${conversationId}`;
var REMOTE_BRANCH_DIVERGED = "remote branch diverged";
var PUSH_FAILED_PREFIX = "Branch push failed: ";
var AUTH_GIT_ERROR_RE = /Authentication failed|Invalid username or (token|password)|authentication required|Bad credentials|could not read Username|Permission denied \(publickey\)/i;
var TRANSIENT_GIT_ERROR_RE = /SSL_ERROR_SYSCALL|SSL_connect|SSL_read|schannel|gnutls_handshake|GnuTLS|HTTP2 framing layer|[Cc]ould(n't| not) connect to server|[Cc]ould not resolve host|Temporary failure in name resolution|Connection (timed out|reset|refused)|Operation timed out|Failed to connect|[Rr]ecv failure|[Ss]end failure|early EOF|RPC failed|unexpected disconnect|remote end hung up|The requested URL returned error: 5\d\d|was killed \(/;
var STALE_LEASE_RE = /stale info/;
var failedPushOf = (outcome) => outcome && !outcome.ok ? outcome : void 0;
var CHANGES_DIFF_MAX_BYTES = 1e6;
function classifyPushError(text3) {
  return text3.includes(REMOTE_BRANCH_DIVERGED) ? "diverged" : STALE_LEASE_RE.test(text3) ? "stale_lease" : AUTH_GIT_ERROR_RE.test(text3) ? "auth" : TRANSIENT_GIT_ERROR_RE.test(text3) ? "network" : "other";
}
var CONCURRENCY_MIN = 1;
var CONCURRENCY_MAX = 10;
function normalizeConcurrency(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= CONCURRENCY_MIN && n <= CONCURRENCY_MAX ? n : null;
}
var MACHINE_STREAM_PING_MS = 3e3;
var TDS_VERSION_HEADER = "x-tds-version";

// src/lib/childProcess.ts
var import_node_child_process = require("node:child_process");
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var EXIT_STDIO_GRACE_MS = 100;
var EXIT_STDIO_LINGER_MAX_MS = 5e3;
function waitForExit(child) {
  return new Promise((resolve6, reject) => {
    let settled = false;
    let exited = false;
    let result = { code: null, signal: null };
    let idle;
    let lingerDeadline = 0;
    let stdoutEnded = !child.stdout;
    let stderrEnded = !child.stderr;
    const cleanup = () => {
      if (idle) clearTimeout(idle);
      child.off("error", onError);
      child.off("exit", onExit);
      child.off("close", onClose);
      child.stdout?.off("end", onStdoutEnd);
      child.stderr?.off("end", onStderrEnd);
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
    };
    const finalize = () => {
      if (settled) return;
      settled = true;
      cleanup();
      child.stdout?.destroy();
      child.stderr?.destroy();
      resolve6(result);
    };
    const armIdle = () => {
      if (idle) clearTimeout(idle);
      lingerDeadline ||= Date.now() + EXIT_STDIO_LINGER_MAX_MS;
      idle = setTimeout(finalize, Math.min(EXIT_STDIO_GRACE_MS, Math.max(lingerDeadline - Date.now(), 0)));
    };
    const onData = () => {
      if (exited) armIdle();
    };
    const onStdoutEnd = () => {
      stdoutEnded = true;
      if (exited && stderrEnded) finalize();
    };
    const onStderrEnd = () => {
      stderrEnded = true;
      if (exited && stdoutEnded) finalize();
    };
    const onExit = (code, signal) => {
      exited = true;
      result = { code, signal };
      if (stdoutEnded && stderrEnded) finalize();
      else armIdle();
    };
    const onClose = () => finalize();
    const onError = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    child.stdout?.on("error", () => {
    });
    child.stderr?.on("error", () => {
    });
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.stdout?.once("end", onStdoutEnd);
    child.stderr?.once("end", onStderrEnd);
    child.once("error", onError);
    child.once("exit", onExit);
    child.once("close", onClose);
  });
}
var KILL_ESCALATE_MS = 5e3;
function killTree(child) {
  const pid = child.pid;
  if (pid === void 0) return;
  if (process.platform === "win32") {
    try {
      (0, import_node_child_process.spawn)("taskkill", ["/F", "/T", "/PID", String(pid)], { stdio: "ignore", windowsHide: true });
    } catch {
    }
    return;
  }
  const send = (signal) => {
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        process.kill(pid, signal);
      } catch {
      }
    }
  };
  send("SIGTERM");
  setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) send("SIGKILL");
  }, KILL_ESCALATE_MS).unref();
}
var COMPLAINT = /^(?:\w[\w-]*:\s+)?(?:error|fatal|panic|unknown|unrecognized|unexpected|invalid|无法|错误)/i;
var LINE_MAX = 300;
function errorLine(text3) {
  const lines = text3.split("\n").map((l) => l.trim()).filter(Boolean);
  const line = [...lines].reverse().find((l) => COMPLAINT.test(l)) ?? lines[lines.length - 1] ?? "";
  return line.slice(0, LINE_MAX);
}
var LSOF_TIMEOUT_MS = 1e4;
async function reapWorkspaceStrays(workspaceDir, label) {
  if (process.platform === "win32") return;
  let pids;
  let dir;
  try {
    dir = (0, import_node_fs2.realpathSync)(workspaceDir);
    pids = process.platform === "linux" ? straysFromProc(dir) : await straysFromLsof(dir);
  } catch (err) {
    console.error(`[reap] ${label} could not list workspace processes:`, err.message);
    return;
  }
  if (!pids.length) return;
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
    }
  }
  console.warn(`[reap] ${label} killed ${pids.length} stray process(es) under ${dir}`);
}
function ownsCwd(cwd, dir) {
  return cwd === dir || cwd.startsWith(dir + import_node_path2.sep);
}
function straysFromProc(dir) {
  const pids = [];
  for (const entry of (0, import_node_fs2.readdirSync)("/proc")) {
    const pid = Number(entry);
    if (!Number.isInteger(pid) || pid === process.pid) continue;
    let cwd;
    try {
      cwd = (0, import_node_fs2.readlinkSync)(`/proc/${entry}/cwd`);
    } catch {
      continue;
    }
    if (ownsCwd(cwd, dir)) pids.push(pid);
  }
  return pids;
}
async function straysFromLsof(dir) {
  const child = (0, import_node_child_process.spawn)("lsof", ["-d", "cwd", "-F", "pn"], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => {
    out += d;
  });
  child.stderr.resume();
  const timer = setTimeout(() => killTree(child), LSOF_TIMEOUT_MS);
  try {
    await waitForExit(child);
  } finally {
    clearTimeout(timer);
  }
  const pids = [];
  let pid = 0;
  for (const line of out.split("\n")) {
    if (line[0] === "p") pid = Number(line.slice(1));
    else if (line[0] === "n" && pid && pid !== process.pid && ownsCwd(line.slice(1), dir)) pids.push(pid);
  }
  return pids;
}

// src/lib/errors.ts
function formatError(err) {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause;
  if (cause instanceof Error && cause.message && !err.message.includes(cause.message)) {
    return `${err.message}: ${formatError(cause)}`;
  }
  return err.message;
}

// src/lib/retry.ts
var import_promises = require("node:timers/promises");
var DEFAULT_RETRY_DELAYS_MS = [2e3, 4e3, 8e3];
function isRetryableHttpError(err) {
  const status = err.httpStatus;
  return status === void 0 || status >= 500;
}
async function withRetry(fn, shouldRetry, label, delays = DEFAULT_RETRY_DELAYS_MS, signal, onRetry) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      const result = await fn();
      if (attempt > 0) onRetry?.(0, 0);
      return result;
    } catch (err) {
      if (signal?.aborted) throw signal.reason ?? err;
      if (attempt >= delays.length || !shouldRetry(err)) throw err;
      const delayMs = delays[attempt];
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`${label} transient failure (retry ${attempt + 1}/${delays.length}), waiting ${delayMs / 1e3}s: ${msg}`);
      onRetry?.(attempt + 1, delays.length);
      await (0, import_promises.setTimeout)(delayMs, void 0, { signal });
    }
  }
}

// src/lib/settings.ts
var import_fs2 = require("fs");
function settingsPath() {
  return tdsPath("settings.json");
}
var cached2 = null;
function loadSettings() {
  if (cached2) return cached2;
  const p = settingsPath();
  if ((0, import_fs2.existsSync)(p)) {
    try {
      const parsed = JSON.parse((0, import_fs2.readFileSync)(p, "utf-8"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) cached2 = parsed;
    } catch {
    }
  }
  return cached2 ??= {};
}
function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch };
  (0, import_fs2.mkdirSync)(tdsDir(), { recursive: true });
  (0, import_fs2.writeFileSync)(settingsPath(), JSON.stringify(next, null, 2));
  cached2 = next;
}

// src/lib/timeouts.ts
var TIMEOUTS_MS = {
  // ── tds server (serverRequest) ──────────────────────────────────────────
  // Must exceed the server's long-poll window (29s hold, maxDuration 35): the bound only exists
  // to cut a dead connection, never a healthy hold.
  claim: 6e4,
  // token / heartbeat / done. Must stay under the 60s heartbeat interval so a timed-out beat
  // can't wedge the next tick behind the inFlight guard; one hung token POST stalls the serial
  // pump for at most this long.
  stepPost: 3e4,
  recover: 15e3,
  // Must stay under the 20s beat cadence so a slow beat never queues behind the next. Sized for a
  // lossy path, not a healthy one: at 5s a single slow handshake failed the beat, and three of those
  // in a row expire the server's 60s presence lease and flip a working machine offline.
  presence: 15e3,
  // Graceful-shutdown beat: best-effort, don't hold the exit.
  presenceOffline: 2e3,
  // One-shot probes: `tds status`, `tds start` preflight.
  statusProbe: 8e3,
  enroll: 15e3,
  enrollPoll: 1e4,
  // One server-executed tool call. The agent is waiting, so keep it tight; replay-safe read tools
  // get a bounded re-issue on top rather than a longer single wait.
  remoteTool: 1e4,
  // open_repo: the git tool's credential fetch, blocking the whole call before any git runs. It is
  // a metadata read (repo name, default branch, token) with no bearing on repo size, but it sat on
  // the 10s tool bound and turned every slow beat into a "git timed out" the agent couldn't act on.
  openRepo: 3e4,
  // ── R2 presigned blobs ──────────────────────────────────────────────────
  // Downloads feed the turn (session hydrate, images, skills): a drop degrades the turn, so allow
  // a slow link room. Session backup likewise: a long turn's jsonl is multi-MB gzipped, and for a
  // cancelled run this upload is the only copy the server will ever see.
  r2UploadSession: 6e4,
  r2Download: 3e4,
  // An external project's change diff, posted to the server after the checkpoint push: up to
  // CHANGES_DIFF_MAX_BYTES of JSON, so the session backup's allowance rather than a tool call's.
  changesUpload: 6e4,
  // ── git subprocesses ────────────────────────────────────────────────────
  // Default for push/fetch/ls-remote (runGit). Generous so a large but live push never trips
  // it; a wedged CONNECT otherwise hangs the syncPush /done.
  gitNetwork: 3e5,
  // Per-attempt bound for the synchronous end-of-turn checkpoint push of an ordinary turn (quick
  // profile: 2 attempts per lease-seeding hop, 4 on the push itself so a git-host redeploy's 5xx
  // window doesn't strand the turn; a cold worktree adds the ls-remote + fetch, so ~2 min typical,
  // ~8 min worst on /done's path). Merge turns stay on gitNetwork —
  // the sink lands the PR right after, so the head must be up whatever it costs.
  gitPushInline: 6e4,
  // Draining a conversation's deferred wrap-up (previous turn's session backup + stray reap)
  // before the next step of that conversation may start. Above the chain's own worst case (backup
  // is bounded by r2UploadSession × 2, the reap by its lsof bound) — so this fires only on a chain
  // that escaped every inner bound. An unbounded wait here meant every later step of the
  // conversation parked inside it holding a concurrency slot, and five of those took the whole
  // machine out of the claim loop.
  deferredTurnWork: 6e5,
  // chief's interactive repo git tool — user-facing latency, bound tighter.
  gitNetworkInteractive: 12e4,
  gitLocalInteractive: 3e4,
  // A full clone, not a delta.
  gitClone: 18e5,
  // ── model stream watchdog (streamWatchdog) ──────────────────────────────
  // Gateways can buffer entire tool arguments after a text delta. Spend the silence budget
  // on that request; hitting it is terminal. The socket backstop must outlast the watchdog.
  streamFirstEvent: 3e5,
  streamIdle: 48e4,
  streamBodyTimeout: 54e4,
  streamUsageTail: 1e3,
  // ── agent-facing tools ──────────────────────────────────────────────────
  // Default for a bash command the model gave no timeout: the SDK's own default is none, and a
  // command that never exits (foreground server, watch mode, waiting on stdin) then wedges the
  // turn until someone cancels it — the tool call never returns, so queued steers never reach the
  // model. The model can always pass a larger explicit timeout or background the process.
  bashDefault: 18e5,
  webFetch: 1e4,
  // MCP handshake + tools/list, per configured server, off the turn's critical path only once at
  // session build. A dead server must not stall the step start for long — it degrades to "no
  // tools from that server this turn".
  mcpConnect: 15e3,
  // One MCP tool call. Looser than remoteTool: the tool's semantics are unknown (searches, ticket
  // lookups, browsers), and unlike the todos server there is no replay-safe retry layer under it.
  mcpToolCall: 6e4,
  // ── codex app-server (JSON-RPC over stdio) ──────────────────────────────
  // A plain request/response; thread/resume replays the rollout first, so it gets more room.
  codexRpc: 6e4,
  codexResume: 3e5,
  // After stdin closes the server finishes writing its rollout and exits; past this it is killed.
  codexExit: 1e4,
  // ── grok agent stdio (ACP JSON-RPC over stdio) ──────────────────────────
  grokRpc: 6e4,
  // session/load replays the whole updates.jsonl as notifications before it answers.
  grokLoad: 3e5,
  grokExit: 1e4,
  // ── cursor-agent acp (ACP JSON-RPC over stdio) ──────────────────────────
  // session/new signs the services in and loads the MCP servers before it answers.
  cursorRpc: 6e4,
  // session/load replays the whole conversation as notifications before it answers.
  cursorLoad: 3e5,
  // The agent has no exit of its own on a closed stdin, so every turn may pay this in full: long
  // enough for the store's pending writes, no longer.
  cursorExit: 5e3,
  // ── agy stream-json (one JSON line per message over stdio) ──────────────
  // To the init event: the conversation is open, the MCP servers are still connecting.
  antigravityStart: 6e4,
  // agy stays about five seconds after stdin closes, then exits by itself; killed sooner it
  // could lose the turn's last writes to the conversation.
  antigravityExit: 15e3,
  // ── devin acp (ACP JSON-RPC over stdio) ─────────────────────────────────
  // session/new fetches the account's settings and starts the MCP servers before it answers.
  devinRpc: 6e4,
  // session/load replays the whole conversation as notifications before it answers.
  devinLoad: 3e5,
  // The server exits by itself within a second of stdin closing; past this it is killed.
  devinExit: 1e4,
  // ── copilot --headless (JSON-RPC over stdio, Content-Length framed) ─────
  copilotRpc: 6e4,
  // session.resume reads the whole event log back and reconnects the MCP servers.
  copilotResume: 3e5,
  // The server exits within a second of stdin closing, the session's shutdown event written.
  copilotExit: 1e4,
  // ── gemini --acp (ACP JSON-RPC over stdio) ──────────────────────────────
  // initialize waits on the CLI's own start, which signs in first; session/new connects the MCP
  // servers before it answers.
  geminiRpc: 6e4,
  // session/load reads the whole session back and starts replaying it.
  geminiLoad: 3e5,
  // session/load answers while that replay is still streaming: the turn starts once the updates
  // have stopped for this long.
  geminiReplayQuiet: 300,
  // The CLI does not always exit on a closed stdin, so a turn may pay this in full. Its session
  // log is appended synchronously, so there is nothing to wait for but stragglers.
  geminiExit: 2e3,
  // ── omp --mode rpc (one JSON command per line over stdio) ────────────────
  // To the ready frame: settings, credentials and extensions are loaded by then.
  ompStart: 6e4,
  // A plain command and its answer; set_model may first wait on a provider's model discovery.
  ompRpc: 6e4,
  // After stdin closes omp drains what it accepted, records the exit in the session and leaves.
  ompExit: 1e4,
  // ── opencode acp (ACP JSON-RPC over stdio) ──────────────────────────────
  // session/new starts the directory's services and waits on the model catalog before it answers.
  opencodeRpc: 6e4,
  // session/load replays the whole session as notifications before it answers.
  opencodeLoad: 3e5,
  // The agent exits within a second of stdin closing; past this it is killed.
  opencodeExit: 1e4,
  // `opencode session export` and `import`, each on a server of its own that it starts and stops.
  opencodeSession: 12e4,
  // The platform bridge listing its tools once the session is open, and OpenCode then taking
  // them in: a prompt sent sooner reaches the model without them.
  opencodeBridgeListed: 15e3,
  opencodeToolsSettle: 300,
  // ── qwen --acp (ACP JSON-RPC over stdio) ────────────────────────────────
  // session/new signs in and connects the MCP servers before it answers.
  qwenRpc: 6e4,
  // session/resume reads the whole session log back first.
  qwenResume: 3e5,
  // The CLI exits by itself once stdin closes; past this it is killed.
  qwenExit: 1e4,
  // ── droid exec stream-jsonrpc (JSON-RPC over stdio) ─────────────────────
  // initialize_session connects the turn's MCP servers before it answers.
  droidRpc: 6e4,
  // load_session reads the whole session back and connects them again.
  droidLoad: 3e5,
  // Droid exits within a second of stdin closing, the session written; past this it is killed.
  droidExit: 1e4,
  // ── cline --acp (ACP JSON-RPC over stdio) ───────────────────────────────
  // session/new restores the sign-in and asks Cline's API about the account before it answers.
  clineRpc: 6e4,
  // session/load reads the whole session back and replays it as notifications before it answers.
  clineLoad: 3e5,
  // The CLI exits by itself once stdin closes; past this it is killed.
  clineExit: 1e4,
  // ── dsh --profile acp (ACP JSON-RPC over stdio) ─────────────────────────
  // session/new fetches the sign-in's model list and connects the turn's MCP servers before it answers.
  dshRpc: 6e4,
  // session/resume reads the whole compressed session log back first.
  dshResume: 3e5,
  // The CLI exits by itself once stdin closes; past this it is killed.
  dshExit: 1e4
};

// src/lib/workspace.ts
function configuredWorkspacesDir() {
  return process.env.TDS_WORKSPACES_DIR || loadSettings().workspacesDir;
}
function workspacesRoot() {
  return configuredWorkspacesDir() ?? tdsPath("workspaces");
}
function assertWorkspacesRootReady() {
  const dir = configuredWorkspacesDir();
  if (dir && !(0, import_node_fs3.existsSync)(dir)) {
    throw new Error(`workspaces dir not found: ${dir} \u2014 is the external drive mounted?`);
  }
}
function baseRepoDir(projectId) {
  return (0, import_node_path3.join)(workspacesRoot(), projectId, "repo");
}
function gitEnv(config) {
  const entries = Object.entries({ "credential.helper": "", ...config });
  const env = { ...process.env, LC_ALL: "C", GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_COUNT: String(entries.length) };
  entries.forEach(([key, value], i) => {
    env[`GIT_CONFIG_KEY_${i}`] = key;
    env[`GIT_CONFIG_VALUE_${i}`] = value;
  });
  return env;
}
var GITHUB_HOST = "https://github.com";
function platformRemote(repoFullName, gitHost) {
  const host = (gitHost ? process.env.TDS_GIT_HOST ?? gitHost : GITHUB_HOST).replace(/\/$/, "");
  return { url: `${host}/${repoFullName}.git`, username: "x-access-token" };
}
function remotesOf(repo) {
  if (!repo.remote) return { origin: platformRemote(repo.repoFullName, repo.gitHost), originToken: repo.installationToken };
  const { url, username, token } = repo.remote;
  if (!username || !token) throw new Error("This project's git credential is missing \u2014 an admin can set it again in the project settings");
  return { origin: { url, username }, originToken: token };
}
function authConfig(token, remote) {
  const [, scheme, host] = /^(https?:\/\/)([^/]+)\//.exec(remote.url) ?? [];
  if (!host) return {};
  return { [`url.${scheme}${encodeURIComponent(remote.username)}:${encodeURIComponent(token)}@${host}/.insteadOf`]: `${scheme}${host}/` };
}
async function spawnGit(args2, cwd, config = {}, timeoutMs, opts) {
  opts?.signal?.throwIfAborted();
  const child = (0, import_node_child_process2.spawn)("git", args2, {
    cwd,
    env: gitEnv(config),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32"
  });
  const abort = () => killTree(child);
  opts?.signal?.addEventListener("abort", abort, { once: true });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (d) => {
    stdout += d;
  });
  child.stderr.on("data", (d) => {
    stderr += d;
  });
  let timedOut = false;
  const timer = timeoutMs ? setTimeout(() => {
    timedOut = true;
    killTree(child);
  }, timeoutMs) : void 0;
  try {
    const { code, signal } = await waitForExit(child);
    opts?.signal?.throwIfAborted();
    if (code === 0) return opts?.rawOutput ? stdout : stdout.trim();
    if (signal || timedOut) throw new Error(`git ${args2[0]} was killed (${signal ?? "timeout"})${timeoutMs ? ` after ${timeoutMs}ms` : ""}`);
    throw Object.assign(new Error(`git ${args2[0]} failed (exit ${code}): ${redactToken(stderr.trim())}`), { exitCode: code });
  } finally {
    if (timer) clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", abort);
  }
}
var RETRYABLE_GIT_OPS = /* @__PURE__ */ new Set(["fetch", "push", "ls-remote"]);
function isTransientGitError(err) {
  return TRANSIENT_GIT_ERROR_RE.test(err instanceof Error ? err.message : String(err));
}
function runGit(args2, cwd, config, opts) {
  if (!RETRYABLE_GIT_OPS.has(args2[0])) return spawnGit(args2, cwd, config, opts?.timeoutMs, opts);
  const bounded = opts?.timeoutMs ?? TIMEOUTS_MS.gitNetwork;
  return withRetry(() => spawnGit(args2, cwd, config, bounded, opts), isTransientGitError, `[workspace] git ${args2[0]}`, opts?.retryDelays, opts?.signal, opts?.onRetry);
}
async function assertGitUsable() {
  let out;
  try {
    out = await runGit(["--version"]);
  } catch {
    throw new Error("git not found on PATH \u2014 install git \u2265 2.31 to run builds");
  }
  const m = out.match(/git version (\d+)\.(\d+)/);
  if (!m) return;
  const [major, minor] = [Number(m[1]), Number(m[2])];
  if (major < 2 || major === 2 && minor < 31) {
    throw new Error(`${out} is too old \u2014 token injection needs git \u2265 2.31 (GIT_CONFIG_* env support)`);
  }
}
var CHECKPOINT_IDENTITY = { "user.email": "noreply@todos.dev", "user.name": "Todos" };
async function stageAll(cwd, defaultBranch) {
  await runGit(["add", "-A"], cwd);
  await pruneIgnoredFromIndex(cwd, defaultBranch);
}
async function commitWork(cwd, defaultBranch, message) {
  await stageAll(cwd, defaultBranch);
  if (!await runGit(["status", "--porcelain"], cwd)) return false;
  await runGit(["commit", "--no-verify", "-m", message], cwd, CHECKPOINT_IDENTITY);
  return true;
}
async function commitCheckpoint(cwd, defaultBranch, stepId, message) {
  const commit = async () => {
    await commitWork(cwd, defaultBranch, message ?? `chore: checkpoint ${stepId}`);
    return await runGit(["rev-parse", "HEAD"], cwd);
  };
  try {
    return { sha: await commit() };
  } catch (err) {
    let msg = err.message;
    if (/index\.lock/.test(msg) && await removeStaleIndexLock(cwd)) {
      try {
        return { sha: await commit() };
      } catch (retryErr) {
        msg = retryErr.message;
      }
    }
    console.warn(`[step] ${stepId} checkpoint commit failed:`, msg);
    return { error: msg.slice(0, 500) };
  }
}
var INDEX_LOCK_STALE_MS = 5 * 60 * 1e3;
async function removeStaleIndexLock(cwd) {
  try {
    const gitDir = await runGit(["rev-parse", "--absolute-git-dir"], cwd);
    const lock = (0, import_node_path3.join)(gitDir, "index.lock");
    if (Date.now() - (0, import_node_fs3.statSync)(lock).mtimeMs < INDEX_LOCK_STALE_MS) return false;
    (0, import_node_fs3.rmSync)(lock, { force: true });
    console.warn(`[workspace] removed stale index.lock: ${lock}`);
    return true;
  } catch {
    return false;
  }
}
async function commitAndPushWork(cwd, workspace, credential, branch, message) {
  const committed = await commitWork(cwd, workspace.defaultBranch, message);
  const tip = await pushBranch(cwd, credential, branch, remotesOf(workspace).origin);
  return { sha: committed ? tip : null };
}
async function pruneIgnoredFromIndex(cwd, defaultBranch) {
  try {
    const ignored = splitNul(await runGit(["ls-files", "-z", "-i", "-c", "--exclude-standard"], cwd));
    if (!ignored.length) return;
    const base = await runGit(["merge-base", `origin/${defaultBranch}`, "HEAD"], cwd);
    const inBase = new Set(splitNul(await runGit(["ls-tree", "-r", "-z", "--name-only", base], cwd)));
    const paths2 = ignored.filter((p) => !inBase.has(p));
    for (let i = 0; i < paths2.length; i += 500) {
      await runGit(["rm", "-r", "--cached", "--quiet", "--", ...paths2.slice(i, i + 500)], cwd);
    }
  } catch (err) {
    console.warn(`[workspace] prune ignored from index failed:`, err.message);
  }
}
function splitNul(out) {
  return out.split("\0").filter(Boolean);
}
function redactToken(text3) {
  return text3.replace(/(https?:\/\/[^/\s:@]+):[^/\s@]+@/g, "$1:***@");
}
var PushFailure = class extends Error {
  cause;
  kind;
  staleLeaseRetried;
  constructor(cause, staleLeaseRetried) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(message);
    this.name = "PushFailure";
    this.cause = cause;
    this.kind = classifyPushError(message);
    this.staleLeaseRetried = staleLeaseRetried;
  }
};
var fixedCredential = (token) => ({ current: () => token });
async function pushBranch(cwd, input, branch, remote, opts) {
  const credential = typeof input === "string" ? fixedCredential(input) : input;
  const profile = opts?.quick ? { timeoutMs: TIMEOUTS_MS.gitPushInline, retryDelays: [2e3] } : void 0;
  const pushProfile = profile && { ...profile, retryDelays: [2e3, 5e3, 1e4] };
  const absorb = opts?.rewind ? async () => {
  } : absorbRemoteCommits;
  let retriedAfterStaleLease = false;
  let synced = false;
  const attempt = async (tok) => {
    const push = () => runGit(["push", "--no-verify", "--force-with-lease", "-u", "origin", branch], cwd, authConfig(tok, remote), pushProfile);
    if (!synced) {
      if (!await hasRemoteRef(cwd, branch)) await fetchRef(cwd, tok, branch, remote, profile);
      await absorb(cwd, branch);
      synced = true;
    }
    try {
      await push();
    } catch (err) {
      if (!isStaleLease(err)) throw err;
      retriedAfterStaleLease = true;
      await fetchRef(cwd, tok, branch, remote, profile);
      await absorb(cwd, branch);
      await push();
    }
  };
  try {
    try {
      await attempt(credential.current());
    } catch (err) {
      if (!credential.refresh || !isAuthGitError(err)) throw err;
      try {
        await credential.refresh();
      } catch (refreshErr) {
        throw new Error(`${formatError(err)} (credential refresh also failed: ${formatError(refreshErr)})`);
      }
      await attempt(credential.current());
    }
  } catch (err) {
    throw new PushFailure(err, retriedAfterStaleLease);
  }
  return runGit(["rev-parse", `refs/heads/${branch}`], cwd);
}
var remoteRefOf = (branch) => `refs/remotes/origin/${branch}`;
var NON_FAST_FORWARD_RE = /\(non-fast-forward\)|\(fetch first\)/;
async function landBranch(cwd, token, branch, remote, baseBranch) {
  try {
    await runGit(["push", "--no-verify", "origin", `refs/heads/${branch}:refs/heads/${baseBranch}`], cwd, authConfig(token, remote));
  } catch (err) {
    const error = formatError(err);
    const reason2 = NON_FAST_FORWARD_RE.test(error) ? "base_moved" : isTransientGitError(err) ? "upstream" : "provider_rejected";
    return { ok: false, reason: reason2, error: error.slice(0, 500) };
  }
  return { ok: true };
}
var hasRemoteRef = (cwd, branch) => runGit(["rev-parse", "--verify", "--quiet", remoteRefOf(branch)], cwd).then(() => true, () => false);
var isStaleLease = (err) => STALE_LEASE_RE.test(err instanceof Error ? err.message : String(err));
function isAuthGitError(err) {
  if (err?.exitCode !== 128) return false;
  return AUTH_GIT_ERROR_RE.test(err instanceof Error ? err.message : String(err));
}
var MERGE_CONFIG = { ...CHECKPOINT_IDENTITY, "core.hooksPath": tdsPath("no-hooks") };
async function absorbRemoteCommits(cwd, branch) {
  if (!await hasRemoteRef(cwd, branch)) return;
  const ref = remoteRefOf(branch);
  if (await runGit(["merge-base", "--is-ancestor", ref, `refs/heads/${branch}`], cwd).then(() => true, () => false)) return;
  if (await runGit(["symbolic-ref", "--quiet", "--short", "HEAD"], cwd).catch(() => null) !== branch) {
    throw new Error(`${REMOTE_BRANCH_DIVERGED}: origin/${branch} has commits this machine does not, and the worktree is not on ${branch} to merge them in`);
  }
  try {
    await runGit(["merge", "--no-edit", ref], cwd, MERGE_CONFIG);
    console.log(`[workspace] merged outside commits from origin/${branch}`);
  } catch (err) {
    await runGit(["merge", "--abort"], cwd).catch(() => {
    });
    throw new Error(`${REMOTE_BRANCH_DIVERGED}: origin/${branch} has commits this machine does not, and merging them in failed: ${err.message}`);
  }
}
async function fetchRef(dir, token, ref, remote, opts) {
  const auth = authConfig(token, remote);
  const exists = await runGit(["ls-remote", "--exit-code", "--heads", "origin", `refs/heads/${ref}`], dir, auth, opts).then(() => true, (err) => {
    if (err?.exitCode === 2) return false;
    throw err;
  });
  if (!exists) {
    await runGit(["update-ref", "-d", remoteRefOf(ref)], dir).catch(() => {
    });
    return false;
  }
  await fetchHealingBadRefs(["fetch", "origin", `+refs/heads/${ref}:refs/remotes/origin/${ref}`], dir, auth, opts);
  return true;
}
var badRefOf = (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  return /bad object (refs\/[^\s'"]+)/.exec(msg)?.[1] ?? /(refs\/[^\s'"]+) does not point to a valid object/.exec(msg)?.[1] ?? null;
};
var MAX_REF_HEALS = 10;
async function fetchHealingBadRefs(args2, dir, auth, opts) {
  for (let heals = 0; ; heals++) {
    try {
      return await runGit(args2, dir, auth, opts);
    } catch (err) {
      const ref = heals < MAX_REF_HEALS ? badRefOf(err) : null;
      if (!ref) throw err;
      console.warn(`[workspace] dropping corrupt ref ${ref}, retrying fetch`);
      await runGit(["update-ref", "-d", ref], dir).catch(() => {
        throw err;
      });
    }
  }
}
var projectLocks = /* @__PURE__ */ new Map();
function withProjectLock(projectId, fn) {
  const prev = projectLocks.get(projectId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  projectLocks.set(projectId, next.catch(() => {
  }));
  return next;
}
var CONV_FETCH_REFSPEC = `+refs/heads/${convBranch("*")}:refs/remotes/origin/${convBranch("*")}`;
async function ensureConvRefspec(baseDir) {
  const refspecs = await runGit(["config", "--get-all", "remote.origin.fetch"], baseDir);
  if (!refspecs.split("\n").includes(CONV_FETCH_REFSPEC)) {
    await runGit(["config", "--add", "remote.origin.fetch", CONV_FETCH_REFSPEC], baseDir);
  }
}
async function ensureBaseRepo(baseDir, remote, defaultBranch, token, opts = {}) {
  assertWorkspacesRootReady();
  const { onRetry } = opts;
  const auth = authConfig(token, remote);
  const tagsRefspec = "+refs/tags/*:refs/tags/*";
  if (!(0, import_node_fs3.existsSync)((0, import_node_path3.join)(baseDir, ".git"))) {
    console.log(`[workspace] Cloning ${remote.url} (branch: ${defaultBranch})\u2026`);
    await withRetry(
      () => {
        (0, import_node_fs3.rmSync)(baseDir, { recursive: true, force: true });
        (0, import_node_fs3.mkdirSync)(baseDir, { recursive: true });
        return spawnGit(["clone", "--branch", defaultBranch, "--single-branch", remote.url, baseDir], void 0, auth, TIMEOUTS_MS.gitClone);
      },
      isTransientGitError,
      "[workspace] git clone",
      void 0,
      void 0,
      onRetry
    );
    await ensureConvRefspec(baseDir);
    if (opts.readCheckout) await fetchHealingBadRefs(["fetch", "origin", tagsRefspec], baseDir, auth, { onRetry });
    return;
  }
  await runGit(["remote", "set-url", "origin", remote.url], baseDir);
  await ensureConvRefspec(baseDir);
  if (opts.skipFetch) return;
  console.log(`[workspace] Fetching ${remote.url} (branch: ${defaultBranch})\u2026`);
  await fetchHealingBadRefs(
    ["fetch", "origin", `+refs/heads/${defaultBranch}:refs/remotes/origin/${defaultBranch}`, ...opts.readCheckout ? [tagsRefspec] : []],
    baseDir,
    auth,
    { onRetry }
  );
  if (opts.readCheckout) await runGit(["reset", "--hard", `origin/${defaultBranch}`], baseDir);
}
async function prepareConversationWorkspace(conversationId, workspace, opts = {}) {
  const { projectId, defaultBranch, freshBase } = workspace;
  return withProjectLock(projectId, async () => {
    const { origin, originToken: token } = remotesOf(workspace);
    const baseDir = baseRepoDir(projectId);
    const worktreeDir = (0, import_node_path3.join)(workspacesRoot(), conversationId);
    const branchName = convBranch(conversationId);
    const { restoreTo, onRetry } = opts;
    const worktreeExists = (0, import_node_fs3.existsSync)((0, import_node_path3.join)(worktreeDir, ".git"));
    const skipFetch = worktreeExists && restoreTo === void 0 && !freshBase;
    await ensureBaseRepo(baseDir, origin, defaultBranch, token, { skipFetch, onRetry });
    const restoringToCommit = restoreTo !== void 0 && !restoreTo.startsWith("origin/");
    let convBranchFetched = false;
    if (restoringToCommit || !worktreeExists || freshBase) {
      convBranchFetched = await fetchRef(baseDir, token, branchName, origin, { onRetry });
    }
    if (restoringToCommit) {
      await runGit(["cat-file", "-e", `${restoreTo}^{commit}`], baseDir).catch(() => {
        throw new Error("checkpoint commit no longer available \u2014 cannot restore code");
      });
    }
    if (worktreeExists) {
      if (restoreTo !== void 0) {
        await runGit(["reset", "--hard", restoreTo], worktreeDir);
        await runGit(["clean", "-fd"], worktreeDir);
        console.log(`[workspace] Worktree restored: ${worktreeDir} \u2192 ${restoreTo}`);
      } else {
        console.log(`[workspace] Worktree reused: ${worktreeDir} (${branchName})`);
      }
      return worktreeDir;
    }
    if ((0, import_node_fs3.existsSync)(worktreeDir)) {
      await runGit(["worktree", "remove", "--force", worktreeDir], baseDir).catch(() => {
        (0, import_node_fs3.rmSync)(worktreeDir, { recursive: true, force: true });
      });
    }
    await runGit(["worktree", "prune"], baseDir);
    await runGit(["branch", "-D", branchName], baseDir).catch(() => {
    });
    const base = restoreTo ?? (convBranchFetched ? `origin/${branchName}` : `origin/${defaultBranch}`);
    await runGit(["worktree", "add", "-b", branchName, worktreeDir, base], baseDir);
    console.log(`[workspace] Worktree ready: ${worktreeDir} (${branchName}) from ${base}`);
    return worktreeDir;
  });
}
async function cleanupOrphanWorktrees(ttlMs = 7 * 24 * 3600 * 1e3) {
  const root = workspacesRoot();
  let entries;
  try {
    entries = await (0, import_promises2.readdir)(root);
  } catch {
    return;
  }
  const cutoff = Date.now() - ttlMs;
  const removed = [];
  for (const name of entries) {
    const dir = (0, import_node_path3.join)(root, name);
    try {
      if (!(await (0, import_promises2.stat)((0, import_node_path3.join)(dir, ".git"))).isFile()) continue;
      if ((await (0, import_promises2.stat)(dir)).mtimeMs >= cutoff) continue;
      await (0, import_promises2.rm)(dir, { recursive: true, force: true });
      removed.push(name);
    } catch {
    }
  }
  if (removed.length === 0) return;
  for (const name of entries) {
    const repoDir = (0, import_node_path3.join)(root, name, "repo");
    if ((0, import_node_fs3.existsSync)((0, import_node_path3.join)(repoDir, ".git"))) void runGit(["worktree", "prune"], repoDir).catch(() => {
    });
  }
  console.log(`[workspace] Reaped ${removed.length} orphan worktree(s)`);
}

// src/lib/expandHome.ts
var import_node_os = require("node:os");
var import_node_path4 = require("node:path");
function expandHome(p) {
  if (p === "~") return (0, import_node_os.homedir)();
  if (p.startsWith("~/") || p.startsWith("~\\")) return (0, import_node_path4.join)((0, import_node_os.homedir)(), p.slice(2));
  return p;
}

// src/lib/windowsShell.ts
var import_node_fs4 = require("node:fs");
var import_node_child_process3 = require("node:child_process");
var import_node_path5 = require("node:path");
var WSL_BASH_LAUNCHER = /^[a-z]:\\windows\\(?:system32|sysnative|syswow64)\\bash\.exe$/;
function isWslBashLauncher(path) {
  return WSL_BASH_LAUNCHER.test(path.replace(/\//g, "\\").toLowerCase());
}
function pickAgentBash(probe) {
  const git = probe.lookPath("git");
  if (git) {
    const bash = import_node_path5.win32.join(import_node_path5.win32.dirname(import_node_path5.win32.dirname(git)), "bin", "bash.exe");
    if (probe.isFile(bash)) return bash;
  }
  for (const root of [probe.getenv("ProgramFiles"), probe.getenv("ProgramFiles(x86)")]) {
    if (!root) continue;
    const bash = import_node_path5.win32.join(root, "Git", "bin", "bash.exe");
    if (probe.isFile(bash)) return bash;
  }
  const onPath = probe.lookPath("bash.exe");
  return onPath && !isWslBashLauncher(onPath) ? onPath : null;
}
function whereExe(cmd2) {
  const res = (0, import_node_child_process3.spawnSync)("where", [cmd2], { encoding: "utf-8", timeout: 5e3, windowsHide: true });
  if (res.status !== 0 || !res.stdout) return null;
  const first2 = res.stdout.trim().split(/\r?\n/)[0];
  return first2 && (0, import_node_fs4.existsSync)(first2) ? first2 : null;
}
var resolved;
function agentShellPath() {
  if (process.platform !== "win32") return void 0;
  if (resolved != null && !(0, import_node_fs4.existsSync)(resolved)) resolved = void 0;
  if (resolved === void 0) {
    resolved = pickAgentBash({ lookPath: whereExe, isFile: import_node_fs4.existsSync, getenv: (k) => process.env[k] });
  }
  return resolved ?? void 0;
}
function logAgentShell() {
  if (process.platform !== "win32") return;
  const shell = agentShellPath();
  if (shell) {
    console.log(`[machine] Agent shell: ${shell}`);
    return;
  }
  console.warn(
    "[machine] No Git Bash found \u2014 the agent's shell will fall back to whatever bash.exe is on PATH. If that is C:\\Windows\\System32\\bash.exe (Windows' WSL launcher), every shell command in a build will fail. Install Git for Windows, or put a real bash ahead of System32 on PATH."
  );
}

// src/machine.ts
var import_promises9 = require("node:timers/promises");

// ../../packages/types/src/providerHeaders.ts
function openCodeHeaders(model, sessionId) {
  let isOpenCode = model.provider === "opencode" || model.provider === "opencode-go";
  try {
    isOpenCode ||= new URL(model.baseUrl).hostname === "opencode.ai";
  } catch {
  }
  if (!isOpenCode) return void 0;
  return { "x-opencode-session": sessionId, "user-agent": "todos" };
}

// src/lib/emptyFrameRetry.ts
function isEmptyAssistantFrame(message) {
  if (message.stopReason !== "stop" && message.stopReason !== "toolUse") return false;
  return !message.content.some((c) => c.type === "text" && c.text.trim() !== "" || c.type === "toolCall");
}
var EMPTY_FRAME_ERROR_MESSAGE = "empty response: provider stream ended without content (no text, no tool call)";
function retryableErrorFor(message) {
  if (isEmptyAssistantFrame(message)) return EMPTY_FRAME_ERROR_MESSAGE;
  if (message.stopReason === "error" && message.errorMessage?.includes("malformed server-sent event")) {
    return `${message.errorMessage} (provider stream ended without valid JSON)`;
  }
}
function wrapEmptyFrameAsError(source, label) {
  let errorFrame;
  const toErrorFrame = (message) => {
    const errorMessage = retryableErrorFor(message);
    if (!errorMessage) return message;
    if (!errorFrame) {
      console.warn(`[${label}] ${errorMessage} \u2014 rewriting as retryable provider error`);
      errorFrame = { ...message, stopReason: "error", errorMessage };
    }
    return errorFrame;
  };
  const proxy = {
    async *[Symbol.asyncIterator]() {
      for await (const ev of source) {
        const message = ev.type === "done" ? ev.message : ev.type === "error" ? ev.error : void 0;
        const rewritten = message && toErrorFrame(message);
        yield rewritten && rewritten !== message ? { type: "error", reason: "error", error: rewritten } : ev;
      }
    },
    result: async () => toErrorFrame(await source.result())
  };
  return proxy;
}

// src/lib/providerRefusal.ts
var REFUSAL_STATUSES = /* @__PURE__ */ new Set([401, 402, 403]);
var THROTTLE_WORDS = /rate.?limit|too many requests|overloaded|high demand/i;
function isProviderRefusal(message, status) {
  if (message.stopReason !== "error" || !message.errorMessage || status === void 0) return false;
  return REFUSAL_STATUSES.has(status) && !THROTTLE_WORDS.test(message.errorMessage);
}
function observeStatus(fetch2) {
  let last;
  return {
    fetch: fetch2 && (async (input, init) => {
      const response = await fetch2(input, init);
      last = response.status;
      return response;
    }),
    status: () => last
  };
}
var REFUSAL_SUFFIX = " (not retried: the provider refused this account's access or billing)";
function wrapProviderRefusal(source, label, status) {
  let refusalFrame;
  const refused = (message) => isProviderRefusal(message, status());
  const toRefusalFrame = (message) => {
    if (!refusalFrame) {
      console.warn(`[${label}] provider refused the request (HTTP ${status()}) \u2014 failing without retry: ${message.errorMessage}`);
      refusalFrame = { ...message, errorMessage: `${message.errorMessage}${REFUSAL_SUFFIX}` };
    }
    return refusalFrame;
  };
  const proxy = {
    async *[Symbol.asyncIterator]() {
      for await (const ev of source) {
        yield ev.type === "error" && refused(ev.error) ? { ...ev, error: toRefusalFrame(ev.error) } : ev;
      }
    },
    result: async () => {
      const message = await source.result();
      return refused(message) ? toRefusalFrame(message) : message;
    }
  };
  return proxy;
}

// src/lib/boundedFetch.ts
var pinnedSignals = /* @__PURE__ */ new Set();
function pinAbortSignals(...signals) {
  for (const s of signals) {
    if (s.aborted) continue;
    pinnedSignals.add(s);
    s.addEventListener("abort", () => pinnedSignals.delete(s), { once: true });
  }
}
function boundedFetch(url, timeoutMs, init = {}) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  pinAbortSignals(timeoutSignal);
  return fetch(url, { ...init, signal: timeoutSignal });
}

// src/lib/interruptibleBash.ts
function createInterruptibleBash(base, defaultTimeoutSec) {
  const running = /* @__PURE__ */ new Set();
  return {
    exec: async (command2, cwd, opts) => {
      const entry = { ctl: new AbortController(), onData: opts.onData };
      running.add(entry);
      const signal = opts.signal ? AbortSignal.any([opts.signal, entry.ctl.signal]) : entry.ctl.signal;
      pinAbortSignals(signal);
      try {
        return await base.exec(command2, cwd, { ...opts, signal, timeout: opts.timeout ?? defaultTimeoutSec });
      } finally {
        running.delete(entry);
        entry.ctl.abort();
      }
    },
    // Kill every command in flight; false = nothing running (the flag degrades to a plain steer).
    // The note goes out through each command's own output stream so the model sees why it died.
    interrupt: (note) => {
      if (!running.size) return false;
      for (const { ctl, onData } of running) {
        try {
          onData(Buffer.from(note));
        } catch {
        }
        ctl.abort();
      }
      return true;
    }
  };
}

// src/lib/editArguments.ts
function escapeBareQuotes(text3) {
  const closer = /\s*(?:[,}\]:]|$)/y;
  let out = "";
  let inString = false;
  for (let i = 0; i < text3.length; i++) {
    const ch = text3[i];
    if (!inString) {
      inString = ch === '"';
      out += ch;
    } else if (ch === "\\") {
      out += ch + (text3[++i] ?? "");
    } else if (ch !== '"') {
      out += ch;
    } else {
      closer.lastIndex = i + 1;
      inString = !closer.test(text3);
      out += inString ? '\\"' : ch;
    }
  }
  return out;
}
function parseLenient(text3) {
  try {
    return JSON.parse(text3);
  } catch {
  }
  try {
    return JSON.parse(escapeBareQuotes(text3));
  } catch {
    return void 0;
  }
}
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function withEditArguments(tool) {
  return {
    ...tool,
    prepareArguments(input) {
      const args2 = structuredClone(input);
      if (args2 && typeof args2.edits === "string") args2.edits = parseLenient(args2.edits) ?? args2.edits;
      const prepared = tool.prepareArguments(args2);
      if (prepared && Array.isArray(prepared.edits)) {
        prepared.edits = prepared.edits.map((edit) => {
          const parsed = typeof edit === "string" ? parseLenient(edit) : edit;
          return isObject(parsed) ? parsed : edit;
        });
      }
      return prepared;
    }
  };
}

// src/lib/streamWatchdog.ts
var streamStalledMessage = (idleMs, beforeFirstEvent) => `stream stalled: no provider progress for ${Math.round(idleMs / 1e3)}s ${beforeFirstEvent ? "waiting for first event" : "while generating"}`;
function wrapStreamWatchdog(source, label, model, { firstEventMs = TIMEOUTS_MS.streamFirstEvent, idleMs = TIMEOUTS_MS.streamIdle, onTimeout } = {}) {
  let timeoutFrame;
  let lastPartial;
  let settleTimedOut;
  const timedOutResult = new Promise((resolve6) => {
    settleTimedOut = resolve6;
  });
  const toTimeoutFrame = (beforeFirstEvent) => {
    const errorMessage = streamStalledMessage(beforeFirstEvent ? firstEventMs : idleMs, beforeFirstEvent);
    console.warn(`[${label}] ${errorMessage} \u2014 cancelling without replay`);
    timeoutFrame = lastPartial ? { ...structuredClone(lastPartial), stopReason: "error", errorMessage } : {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
      },
      stopReason: "error",
      errorMessage,
      timestamp: Date.now()
    };
    settleTimedOut(timeoutFrame);
    return timeoutFrame;
  };
  const proxy = {
    async *[Symbol.asyncIterator]() {
      const it = source[Symbol.asyncIterator]();
      let beforeFirstEvent = true;
      let remainingMs = firstEventMs;
      for (; ; ) {
        const started2 = performance.now();
        let timer;
        const outcome = await new Promise((resolve6) => {
          if (remainingMs <= 0) {
            resolve6({ kind: "timeout" });
            return;
          }
          timer = setTimeout(() => resolve6({ kind: "timeout" }), remainingMs);
          it.next().then(
            (r) => resolve6({ kind: "next", r }),
            (err) => resolve6({ kind: "threw", err })
          );
        }).finally(() => clearTimeout(timer));
        remainingMs -= performance.now() - started2;
        if (outcome.kind === "timeout") {
          const frame = toTimeoutFrame(beforeFirstEvent);
          onTimeout?.();
          void Promise.resolve(it.return?.()).catch(() => {
          });
          yield { type: "error", reason: "error", error: frame };
          return;
        }
        if (outcome.kind === "threw") throw outcome.err;
        if (outcome.r.done) return;
        const ev = outcome.r.value;
        if (beforeFirstEvent || ev.type.endsWith("_end") || "delta" in ev && ev.delta.length > 0) {
          remainingMs = idleMs;
        }
        beforeFirstEvent = false;
        if ("partial" in ev) lastPartial = ev.partial;
        yield ev;
        if (ev.type === "done" || ev.type === "error") return;
      }
    },
    // The hung source's result() never settles, so a fired watchdog resolves it; once fired, the
    // frame wins even if the source limps in later — event and result must carry the same message.
    result: async () => {
      const message = await Promise.race([source.result(), timedOutResult]);
      return timeoutFrame ?? message;
    }
  };
  return proxy;
}

// src/lib/proxy.ts
var import_child_process = require("child_process");
function parseScutilProxy(output) {
  const vars = {};
  const httpEnabled = /HTTPEnable\s*:\s*1/.test(output);
  const httpsEnabled = /HTTPSEnable\s*:\s*1/.test(output);
  const httpHost = output.match(/HTTPProxy\s*:\s*(\S+)/)?.[1];
  const httpPort = output.match(/HTTPPort\s*:\s*(\d+)/)?.[1];
  const httpsHost = output.match(/HTTPSProxy\s*:\s*(\S+)/)?.[1];
  const httpsPort = output.match(/HTTPSPort\s*:\s*(\d+)/)?.[1];
  if (httpEnabled && httpHost && httpPort) {
    const url = `http://${httpHost}:${httpPort}`;
    vars.HTTP_PROXY = url;
    vars.http_proxy = url;
  }
  if (httpsEnabled && httpsHost && httpsPort) {
    const url = `http://${httpsHost}:${httpsPort}`;
    vars.HTTPS_PROXY = url;
    vars.https_proxy = url;
  }
  if (Object.keys(vars).length === 0) return vars;
  const exceptions = output.match(/ExceptionsList\s*:\s*<array>\s*\{([^}]*)\}/)?.[1] ?? "";
  const entries = [...exceptions.matchAll(/\d+\s*:\s*(\S+)/g)].map((m) => m[1]);
  const noProxy = [.../* @__PURE__ */ new Set([...entries, "localhost", "127.0.0.1", "::1"])].join(",");
  vars.NO_PROXY = noProxy;
  vars.no_proxy = noProxy;
  return vars;
}
function proxyUrlFromEnv() {
  return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || void 0;
}
function readSystemProxy() {
  return new Promise((resolve6) => {
    (0, import_child_process.execFile)("scutil", ["--proxy"], { encoding: "utf8" }, (err, stdout) => resolve6(err || !stdout ? null : parseScutilProxy(stdout)));
  });
}
var applied = null;
async function injectSystemProxy() {
  if (proxyUrlFromEnv()) return;
  const vars = await readSystemProxy();
  if (vars === null) return;
  applied = vars;
  if (Object.keys(vars).length === 0) return;
  Object.assign(process.env, vars);
  console.log(`[machine] System proxy: ${vars.HTTPS_PROXY ?? vars.HTTP_PROXY}`);
}
var installed = false;
var agent;
async function installProxyFetch(logPrefix) {
  if (installed) return true;
  const proxyUrl = proxyUrlFromEnv();
  if (!proxyUrl) return false;
  const undici = await import("undici");
  await rebuildAgent();
  const proxied = (input, init) => undici.fetch(input, { ...init, dispatcher: agent });
  globalThis.fetch = proxied;
  installed = true;
  if (logPrefix) console.log(`${logPrefix} Proxy: ${proxyUrl}`);
  return true;
}
var modelFetch = async (input, init) => {
  const undici = await import("undici");
  agent ??= new undici.EnvHttpProxyAgent();
  const dispatcher = agent.compose((dispatch) => (options, handler) => dispatch({ ...options, bodyTimeout: TIMEOUTS_MS.streamBodyTimeout }, handler));
  return undici.fetch(input, {
    ...init,
    dispatcher
  });
};
async function rebuildAgent() {
  const undici = await import("undici");
  const stale = agent;
  agent = new undici.EnvHttpProxyAgent();
  void stale?.close().catch(() => {
  });
}
function applyProxyVars(prev, next, env) {
  const keys = Object.keys(prev);
  if (keys.length === Object.keys(next).length && keys.every((k) => prev[k] === next[k])) return false;
  for (const key of keys) delete env[key];
  Object.assign(env, next);
  return true;
}
var refreshing = null;
function refreshSystemProxy() {
  refreshing ??= adoptSystemProxy().catch((err) => {
    console.warn(`[machine] system proxy refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}
async function adoptSystemProxy() {
  if (applied === null) return false;
  const next = await readSystemProxy();
  if (next === null || !applyProxyVars(applied, next, process.env)) return false;
  applied = next;
  if (installed) await rebuildAgent();
  else await installProxyFetch();
  console.log(`[machine] System proxy moved: ${proxyUrlFromEnv() ?? "none"}`);
  return true;
}
async function ensureProxy(logPrefix = "[tds]") {
  await injectSystemProxy();
  await installProxyFetch(logPrefix);
}

// src/lib/providerFetch.ts
var SUPPORTED_APIS = /* @__PURE__ */ new Set([
  "openai-completions",
  "openai-responses",
  "azure-openai-responses",
  "openai-codex-responses",
  "anthropic-messages"
]);
function providerFetch(api, fetch2, tailMs = TIMEOUTS_MS.streamUsageTail) {
  if (!SUPPORTED_APIS.has(api)) return fetch2;
  return async (input, init) => {
    const response = await (fetch2 ?? modelFetch)(input, init);
    if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("text/event-stream")) return response;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let data = [];
    let finished = false;
    let closed = false;
    let timer;
    let controller;
    const cancel = () => {
      closed = true;
      clearTimeout(timer);
      void reader.cancel().catch(() => {
      }).finally(() => reader.releaseLock());
    };
    const close = () => {
      if (closed) return;
      controller.close();
      cancel();
    };
    const event = (raw) => {
      if (raw === "[DONE]") return true;
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        return false;
      }
      if (!value || typeof value !== "object") return false;
      if (api === "openai-completions") {
        if (value.choices?.[0]?.finish_reason) {
          finished = true;
          timer ??= setTimeout(close, tailMs);
        }
        return finished && (value.usage != null || value.choices?.[0]?.usage != null);
      }
      return api === "anthropic-messages" ? value.type === "message_stop" : ["response.completed", "response.done", "response.incomplete", "response.failed"].includes(value.type);
    };
    const observe = (bytes) => {
      buffer += decoder.decode(bytes, { stream: true });
      for (; ; ) {
        const match = /\r\n|\r|\n/.exec(buffer);
        if (!match || match[0] === "\r" && match.index === buffer.length - 1) return false;
        const line = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        if (line === "") {
          const raw = data.join("\n");
          data = [];
          if (raw && event(raw)) return true;
        } else if (line === "data" || line.startsWith("data:")) {
          data.push(line.slice(5).replace(/^ /, ""));
        }
      }
    };
    const body = new ReadableStream({
      start(c) {
        controller = c;
      },
      async pull() {
        try {
          const next = await reader.read();
          if (closed) return;
          if (next.done) {
            closed = true;
            clearTimeout(timer);
            controller.close();
            reader.releaseLock();
          } else {
            controller.enqueue(next.value);
            if (observe(next.value)) close();
          }
        } catch (error) {
          if (closed) return;
          controller.error(error);
          cancel();
        }
      },
      cancel
    });
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  };
}

// src/lib/diff.ts
var import_node_crypto = require("node:crypto");

// src/lib/version.ts
var import_fs3 = require("fs");
var import_path2 = require("path");
var cached3 = null;
function getVersion() {
  if (cached3) return cached3;
  return cached3 = resolveVersion();
}
function resolveVersion() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const p = (0, import_path2.join)(dir, "package.json");
    if ((0, import_fs3.existsSync)(p)) {
      try {
        const pkg = JSON.parse((0, import_fs3.readFileSync)(p, "utf-8"));
        if (pkg.version) return pkg.version;
      } catch {
      }
    }
    const parent = (0, import_path2.dirname)(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "unknown";
}

// src/lib/serverRequest.ts
function httpError(res, detail2) {
  return Object.assign(new Error(`HTTP ${res.status}${detail2 ? ` ${detail2}` : ""}`), { httpStatus: res.status });
}
function machineHeaders(token) {
  const h = { [TDS_VERSION_HEADER]: getVersion() };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
function serverRequest(serverUrl, path, opts) {
  const { token, body, timeoutMs, signal } = opts;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const composed = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  pinAbortSignals(composed, timeoutSignal);
  return fetch(`${serverUrl}${path}`, {
    method: opts.method ?? (body !== void 0 ? "POST" : "GET"),
    headers: body !== void 0 ? { "Content-Type": "application/json", ...machineHeaders(token) } : machineHeaders(token),
    body: body !== void 0 ? JSON.stringify(body) : void 0,
    signal: composed
  });
}

// src/lib/remoteTools.ts
var RETRY_DELAYS_MS = [500, 2e3];
function isTimeout(err) {
  const name = err?.name;
  return name === "TimeoutError" || name === "AbortError";
}
async function request(serverUrl, path, token, body, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? TIMEOUTS_MS.remoteTool;
  const once = async () => {
    const res = await serverRequest(serverUrl, path, { token, body, timeoutMs, signal: opts.signal });
    const json = await res.json().catch(() => null);
    const reply = { ok: res.ok, status: res.status, body: json };
    const transient = json?.transient;
    const shouldRetryResponse = transient === true || transient === void 0 && res.status >= 500;
    if (opts.replaySafe && !res.ok && shouldRetryResponse) {
      throw Object.assign(
        httpError(res, typeof json?.error === "string" ? json.error : void 0),
        { reply }
      );
    }
    return reply;
  };
  if (!opts.replaySafe) return once();
  try {
    return await withRetry(
      once,
      (err) => !!err?.reply || isRetryableHttpError(err),
      `[tool] ${opts.label ?? path}`,
      RETRY_DELAYS_MS,
      opts.signal
    );
  } catch (err) {
    const reply = err?.reply;
    if (reply) return reply;
    throw err;
  }
}
function parseJsonReply(reply, label) {
  if (!reply.ok) throw new Error(typeof reply.body?.error === "string" ? reply.body.error : `${label} failed (HTTP ${reply.status})`);
  return JSON.parse(typeof reply.body?.text === "string" ? reply.body.text : "");
}
function text(s) {
  return { content: [{ type: "text", text: s }], details: {} };
}
async function callRemoteTool(serverUrl, token, stepId, def, params, signal) {
  const startedAt = Date.now();
  try {
    const reply = await request(serverUrl, `/api/machine/tool/${stepId}`, token, { name: def.name, params }, {
      replaySafe: def.replaySafe,
      label: def.name,
      signal
    });
    if (!reply.ok) {
      console.warn(`[tool] ${def.name} rejected: HTTP ${reply.status} in ${Date.now() - startedAt}ms`);
      const msg = reply.body?.error;
      return typeof msg === "string" ? msg : `${def.name} failed (HTTP ${reply.status}).`;
    }
    return typeof reply.body?.text === "string" ? reply.body.text : "";
  } catch (err) {
    if (signal?.aborted) throw err;
    const elapsed = Date.now() - startedAt;
    const how = isTimeout(err) ? `timed out after ${elapsed}ms` : `failed after ${elapsed}ms: ${formatError(err)}`;
    console.warn(`[tool] ${def.name} transport failure: ${how}`);
    return `${def.name} returned no result: the call to the Todos server ${how}. This is a connection problem, not a rejection \u2014 this machine's own network or proxy is as likely at fault as the server. ` + (def.replaySafe ? "This is a read, so calling it again is safe." : "It may or may not have taken effect server-side \u2014 check the current state before calling it again.");
  }
}
function makeRemoteTools(serverUrl, token, step) {
  return (step.remoteTools ?? []).map((def) => ({
    name: def.name,
    label: def.label,
    description: def.description,
    parameters: def.parameters,
    async execute(_id, params, signal) {
      return text(await callRemoteTool(serverUrl, token, step.stepId, def, params, signal));
    }
  }));
}

// src/lib/diff.ts
async function computeDiffHash(cwd, defaultBranch, stepId) {
  try {
    const raw = await runGit(["diff", "--raw", `origin/${defaultBranch}...HEAD`], cwd);
    if (!raw.trim()) return null;
    return (0, import_node_crypto.createHash)("sha256").update(raw).digest("hex");
  } catch (err) {
    console.error(`[step] ${stepId} diffHash diff failed:`, err.message);
    return void 0;
  }
}
var DIFF_EXCLUDES = [":(exclude)*.lock", ":(exclude)package-lock.json", ":(exclude)pnpm-lock.yaml", ":(exclude)yarn.lock"];
var byteLength = (s) => Buffer.byteLength(s, "utf8");
async function computeChanges(cwd, defaultBranch, stepId) {
  try {
    const mergeBaseSha = await runGit(["merge-base", `origin/${defaultBranch}`, "HEAD"], cwd);
    const headSha = await runGit(["rev-parse", "HEAD"], cwd);
    const range = `${mergeBaseSha}..${headSha}`;
    const raw = await runGit(["diff", "-U3", range, "--", ...DIFF_EXCLUDES], cwd);
    if (!raw.trim()) return void 0;
    const actualBytes = byteLength(raw);
    if (actualBytes <= CHANGES_DIFF_MAX_BYTES) return { headSha, mergeBaseSha, raw };
    const numstat = await runGit(["diff", "--numstat", "-z", "--no-renames", range, "--", ...DIFF_EXCLUDES], cwd);
    const files = numstat.split("\0").filter(Boolean).flatMap((line) => {
      const [additions, deletions, path] = line.split("	");
      return path ? [{ path, additions: Number(additions) || 0, deletions: Number(deletions) || 0 }] : [];
    });
    return { headSha, mergeBaseSha, tooLarge: { actualBytes, files } };
  } catch (err) {
    console.error(`[step] ${stepId} changes diff failed:`, err.message);
    return void 0;
  }
}
function makeChangesUpload(serverUrl, token, stepId) {
  return async (report) => {
    try {
      const reply = await request(serverUrl, `/api/machine/changes/${stepId}`, token, report, {
        timeoutMs: TIMEOUTS_MS.changesUpload,
        replaySafe: true,
        label: "changes upload"
      });
      if (!reply.ok) console.error(`[step] ${stepId} changes upload refused: HTTP ${reply.status}`);
    } catch (err) {
      console.error(`[step] ${stepId} changes upload failed:`, formatError(err));
    }
  };
}

// src/lib/webTools.ts
function makeWebSearchExtension() {
  const handler = async (...args2) => {
    const event = args2[0];
    const p = event.payload;
    if (!p || !Array.isArray(p.input)) return void 0;
    return { ...p, tools: [{ type: "web_search" }, ...p.tools ?? []] };
  };
  const handlers = /* @__PURE__ */ new Map();
  handlers.set("before_provider_request", [handler]);
  const sourceInfo = {
    path: __filename,
    source: "local",
    scope: "temporary",
    origin: "top-level"
  };
  return {
    path: __filename,
    resolvedPath: __filename,
    sourceInfo,
    handlers,
    tools: /* @__PURE__ */ new Map(),
    messageRenderers: /* @__PURE__ */ new Map(),
    commands: /* @__PURE__ */ new Map(),
    flags: /* @__PURE__ */ new Map(),
    shortcuts: /* @__PURE__ */ new Map()
  };
}
function withWebSearch(opts) {
  return {
    ...opts,
    extensionsOverride: (base) => ({
      ...base,
      extensions: [...base.extensions, makeWebSearchExtension()]
    })
  };
}
var FETCH_CAP = 8e3;
function invalidUrlText(url) {
  return `"${url}" is not a valid URL \u2014 include the scheme, e.g. "https://example.com/page".`;
}
function fetchErrorText(url, err, timeoutMs) {
  const reason2 = isTimeout(err) ? `timed out after ${Math.round(timeoutMs / 1e3)}s` : formatError(err);
  return `Could not fetch ${url} \u2014 ${reason2}. Check the URL is reachable, or retry if this may be transient.`;
}
function formatFetchBody(res, body, cap2 = FETCH_CAP) {
  const prefix = res.ok ? "" : `[HTTP ${res.status} ${res.statusText}] `;
  return { text: `${prefix}${body.slice(0, cap2)}`, truncated: body.length > cap2 };
}
var webFetchTool = {
  name: "web_fetch",
  label: "Web Fetch",
  description: "Fetch the text content of a URL. Returns up to 8000 characters of the response body.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL to fetch" }
    },
    required: ["url"],
    additionalProperties: false
  },
  async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
    const { url } = params;
    try {
      new URL(url);
    } catch {
      return { content: [{ type: "text", text: invalidUrlText(url) }], details: { truncated: false } };
    }
    let res;
    let body;
    try {
      res = await boundedFetch(url, TIMEOUTS_MS.webFetch, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      body = await res.text();
    } catch (err) {
      return { content: [{ type: "text", text: fetchErrorText(url, err, TIMEOUTS_MS.webFetch) }], details: { truncated: false } };
    }
    const { text: text3, truncated } = formatFetchBody(res, body);
    return {
      content: [{ type: "text", text: text3 }],
      details: { truncated }
    };
  }
};

// src/lib/remoteShellTool.ts
var DEFAULT_TIMEOUT_MS = 15e3;
var MAX_TIMEOUT_MS = 12e4;
var IDLE_MS = 800;
var OPEN_TIMEOUT_MS = 5e3;
var OPEN_RETRY_MS = 2e3;
var PROMPT_WAIT_MS = 2500;
var PROMPT_QUIET_MS = 300;
var READ_FLOOR_MS = 1e3;
var OUTPUT_CAP = 6e4;
var NO_MACHINE_MSG = 'No remote machine is available for this build. Your remote_shell grant is fine \u2014 the tool would not be in your toolset otherwise \u2014 so do not report this as a missing permission on your side. What is missing is the machine half: the team needs a machine that is online (`tds start`) AND has the "Remote shell" toggle turned on (separate from your grant). The user can flip that toggle on the machine\'s own page in the web app, or just ask the Chief to turn it on for that machine. Tell the user exactly that.';
var RECONNECT_NOTE = "[shell reconnected \u2014 the previous shell session was lost: cwd, env vars and background processes were reset]";
function disconnectedMsg(machine, everOpened) {
  const prefix = `Machine "${machine.name}" is listed, but `;
  if (machine.online === false) {
    return prefix + "it is offline (no presence heartbeat \u2014 `tds start` may have stopped, or the machine is asleep/disconnected). Wait a moment and retry; if this persists, ask the user to check that machine.";
  }
  if (!everOpened) {
    return prefix + "its remote_shell channel has not come up yet. When shell access was only just enabled on that machine, its tunnel does a first-time setup (registering a network node) that can take several minutes; the channel then connects on its own. Be patient: keep retrying with a generous timeout_ms and waits in between for up to ~10 minutes before treating this as stuck \u2014 do not report failure or ask the user to intervene early. If it never comes up, the machine may be running an older CLI without remote_shell support.";
  }
  return prefix + "its remote_shell channel dropped and is being redialed (network blip, or the machine's CLI restarted). Wait a moment and retry; if this persists for several minutes, ask the user to check that machine.";
}
function builderDownMsg(err) {
  const prefix = "This build machine has no tunnel node yet, so no remote machine can reach it: ";
  return err ? prefix + `its tunnel sidecar keeps failing with "${err}". Retrying will not help \u2014 report this to the user as a problem on the BUILD machine, not on the remote one.` : prefix + "its tunnel is still joining the network. Wait a moment and retry.";
}
function makeRemoteShellTool(tunnel, build, machinesRef) {
  const machineList = machinesRef.current.length ? `Available machines: ${machinesRef.current.map((r) => r.name).join(", ")}.` : "No machines are currently available \u2014 the team has no machine with shell access enabled on its machine page, which is a machine-side switch, not your grant. The set can change mid-conversation, so calling this tool still reports the current state.";
  return {
    name: "remote_shell",
    label: "Remote Shell",
    description: "Run a command in a persistent interactive shell on a REMOTE MACHINE \u2014 a separate host on the team (typically the user's own machine). Use this (not bash) to run tests, start dev servers, or drive an environment that only exists there. The shell starts in that machine's home directory. Build files are not copied there automatically; use an existing checkout and cd into it before working on the code. The shell is stateful: cwd, environment variables, and background processes persist across calls \u2014 but only while the connection holds. If it drops, the shell (and anything running in it) dies; a reconnect opens a fresh shell and the next result says so. Send a command with `input`; call again with empty input to read more output from a long-running command; set `interrupt` to send Ctrl-C. When a shell stops responding to input at all \u2014 Ctrl-C does not bring back a usable prompt, or a program left the terminal's line editing wedged \u2014 set `restart` to kill it and start a new one instead of trying more keystrokes. When several machines are available, pass `machine` to pick one. " + machineList,
    parameters: {
      type: "object",
      properties: {
        machine: { type: "string", description: "Which machine to run on (its name or id). Optional when exactly one is available." },
        input: { type: "string", description: "Text to type into the shell (a command line, or keystrokes). Omit to just read pending output." },
        enter: { type: "boolean", description: "Append Enter after input to submit it. Default true; set false to send keystrokes without submitting." },
        interrupt: { type: "boolean", description: "Send Ctrl-C to interrupt the foreground command before sending input." },
        restart: { type: "boolean", description: "Kill this shell and open a fresh one before sending input. Everything the old session held (cwd, env vars, background processes) is lost \u2014 use it when the shell is wedged, not to clean up." },
        timeout_ms: { type: "number", description: `Overall budget for the call \u2014 waiting to (re)connect counts against it too (default ${DEFAULT_TIMEOUT_MS}, max ${MAX_TIMEOUT_MS}).` }
      },
      required: [],
      additionalProperties: false
    },
    async execute(_toolCallId, params, signal) {
      const p = params ?? {};
      if (!tunnel.shellAvailable()) {
        return text2("Reverse shell is unavailable: the tunnel sidecar is not running on this machine.", { closed: true, truncated: false });
      }
      const picked = resolveMachine(machinesRef.current, p.machine);
      if ("error" in picked) return text2(picked.error, { closed: true, truncated: false });
      const machine = picked.machine;
      const machineId = machine.machineId;
      if (!tunnel.current()) return text2(builderDownMsg(tunnel.lastError()), { closed: true, truncated: false });
      const payload = shellPayload(p);
      const deadline = Date.now() + clampTimeout(p.timeout_ms);
      if (p.restart) await tunnel.restartShell(build, machineId, OPEN_TIMEOUT_MS);
      const opened = await openShellWithRetry(tunnel, build, machineId, machine.online, deadline, signal);
      if (opened === "failed") {
        const out = tunnel.drainShell(build, machineId);
        const msg = disconnectedMsg(machine, tunnel.hasEverOpened(build, machineId));
        return text2(out.trim() ? `${out}
[shell disconnected]
${msg}` : msg, { closed: true, truncated: false });
      }
      if (opened === "opened" && payload !== "") {
        await waitQuiet(tunnel, build, machineId, {
          quietMs: PROMPT_QUIET_MS,
          capMs: Math.min(PROMPT_WAIT_MS, Math.max(deadline - Date.now(), 0)),
          signal
        });
      }
      if (signal?.aborted) return shellResult(tunnel, build, machine, false);
      if (payload !== "" && !tunnel.shellSendInput(build, machineId, payload)) {
        return text2("Reverse shell is unavailable: failed to write to the sidecar.", { closed: true, truncated: false });
      }
      const closed = await waitQuiet(tunnel, build, machineId, {
        quietMs: IDLE_MS,
        capMs: Math.max(deadline - Date.now(), READ_FLOOR_MS),
        armed: true,
        signal
      });
      return shellResult(tunnel, build, machine, closed);
    }
  };
}
function resolveMachine(machines, requested) {
  if (machines.length === 0) return { error: NO_MACHINE_MSG };
  if (requested) {
    const q = requested.trim().toLowerCase();
    const hit = machines.find((r) => r.machineId.toLowerCase() === q || r.name.toLowerCase() === q);
    if (!hit) return { error: `Unknown machine "${requested}". Available: ${machines.map((r) => r.name).join(", ")}.` };
    return { machine: hit };
  }
  if (machines.length === 1) return { machine: machines[0] };
  return { error: `Several machines are available \u2014 pass "machine" to pick one: ${machines.map((r) => r.name).join(", ")}.` };
}
function shellPayload(p) {
  const prefix = p.interrupt ? "" : "";
  if (typeof p.input !== "string" || p.input === "") return prefix;
  const body = p.input.replace(/\r?\n/g, "\r");
  return prefix + (p.enter === false ? body : body.replace(/\r$/, "") + "\r");
}
async function openShellWithRetry(tunnel, build, machineId, online, deadline, signal, retryMs = OPEN_RETRY_MS) {
  const attempt = () => tunnel.ensureShell(build, machineId, Math.max(1e3, Math.min(OPEN_TIMEOUT_MS, deadline - Date.now())));
  let opened = await attempt();
  while (opened === "failed" && online !== false && !signal?.aborted && Date.now() + retryMs < deadline) {
    await sleep2(retryMs, signal);
    opened = await attempt();
  }
  return opened;
}
function waitQuiet(tunnel, build, machineId, opts) {
  const { quietMs, capMs, armed, signal } = opts;
  return new Promise((resolve6) => {
    let quiet;
    const armQuiet = () => {
      clearTimeout(quiet);
      quiet = setTimeout(() => done(false), quietMs);
    };
    const cap2 = setTimeout(() => done(false), capMs);
    const unsub = tunnel.subscribeShell(build, machineId, {
      onActivity: armQuiet,
      onClosed: () => done(true)
    });
    const onAbort = () => done(false);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (armed) armQuiet();
    if (signal?.aborted) done(false);
    function done(closed) {
      clearTimeout(cap2);
      clearTimeout(quiet);
      unsub();
      signal?.removeEventListener("abort", onAbort);
      resolve6(closed);
    }
  });
}
function sleep2(ms, signal) {
  return new Promise((resolve6) => {
    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve6();
    }
  });
}
function clampTimeout(ms) {
  return Math.min(Math.max(Number(ms) || DEFAULT_TIMEOUT_MS, 1e3), MAX_TIMEOUT_MS);
}
function shellResult(t, build, machine, closed) {
  const reconnected = t.consumeShellReconnect(build, machine.machineId);
  let out = t.drainShell(build, machine.machineId);
  const truncated = out.length > OUTPUT_CAP;
  if (truncated) out = out.slice(-OUTPUT_CAP);
  if (closed && out.trim() === "" && !reconnected) {
    return text2(disconnectedMsg(machine, t.hasEverOpened(build, machine.machineId)), { closed: true, truncated: false });
  }
  const parts = [];
  if (reconnected) parts.push(RECONNECT_NOTE);
  if (truncated) parts.push(`[output truncated to the last ${OUTPUT_CAP} characters]`);
  parts.push(out || "(no output)");
  if (closed) parts.push("[shell session closed]");
  return text2(parts.join("\n"), { closed, truncated });
}
function text2(s, details) {
  return { content: [{ type: "text", text: s }], details };
}

// src/lib/pushBranchTool.ts
function makePushBranchTool(cwd, step, credential) {
  return {
    name: "push_branch",
    label: "Push Branch",
    description: "Commit all work in the worktree and push this conversation's own working branch (tds/conv-*) to the remote repo. The branch is normally pushed only when a turn ends, so the remote does not have changes from the current turn until you call this. Call it before any tool that reads the branch from the remote \u2014 e.g. merge_branch on your own branch, or a CI run you want to pick the work up. `message` becomes the commit message for the staged work; when nothing changed since the last commit it just pushes.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: 'Use type(scope): summary (scope optional), e.g. "fix(executor): skip empty checkpoints". Types: feat, fix, refactor, perf, docs, test, build, ci, chore, revert. Optional body after a blank line; no Co-Authored-By or generated-by attribution.' }
      },
      required: ["message"],
      additionalProperties: false
    },
    async execute(_toolCallId, params) {
      const raw = params?.message;
      const message = typeof raw === "string" && raw.trim() ? raw.trim() : null;
      if (!message) return text("A commit message is required.");
      if (!step.workspace || !credential) return text("This turn has no repository workspace \u2014 push_branch is unavailable.");
      const branch = convBranch(step.conversationId);
      try {
        const { sha } = await commitAndPushWork(cwd, step.workspace, credential, branch, message);
        return text(sha ? `Committed ${sha.slice(0, 12)} and pushed "${branch}" \u2014 the remote now has all work up to this point.` : `Nothing new to commit \u2014 pushed "${branch}" so the remote is current with the last commit.`);
      } catch (err) {
        return text(`push_branch failed: ${err.message}`);
      }
    }
  };
}

// src/lib/pushCredential.ts
function makePushCredential(serverUrl, machineToken, stepId, workspace) {
  const external = !!workspace.remote;
  let token = (external ? workspace.remote?.token : workspace.installationToken) ?? "";
  return {
    current: () => token,
    async refresh() {
      const reply = await request(serverUrl, `/api/machine/tool/${stepId}`, machineToken, { name: "push_credential", params: {} }, {
        replaySafe: true,
        label: "push credential"
      });
      const fresh = parseJsonReply(reply, "push_credential");
      const next = external ? fresh.remoteToken : fresh.installationToken;
      if (typeof next !== "string" || !next) throw new Error("push credential refresh returned an invalid token");
      token = next;
    }
  };
}

// src/lib/mcpTools.ts
var import_client = require("@modelcontextprotocol/sdk/client/index.js");
var import_stdio = require("@modelcontextprotocol/sdk/client/stdio.js");
var import_streamableHttp = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
var TOOL_NAME_MAX = 64;
function mcpToolName(slug, tool) {
  return `mcp__${slug}__${tool}`.slice(0, TOOL_NAME_MAX);
}
async function connectMcpServers(refs, creds) {
  if (!refs.length) return [];
  const credById = new Map(creds.map((c) => [c.id, c.credential]));
  const conns = await Promise.all(refs.map((ref) => connectOne(ref, credById.get(ref.id))));
  return conns.filter((c) => c !== null);
}
async function connectOne(ref, cred) {
  if (!cred) {
    console.warn(`[mcp] ${ref.slug}: no credential resolved at claim \u2014 skipping`);
    return null;
  }
  let transport;
  try {
    transport = ref.transport === "http" ? new import_streamableHttp.StreamableHTTPClientTransport(new URL(ref.url), {
      requestInit: { headers: cred.type === "http" ? cred.headers : {} }
    }) : new import_stdio.StdioClientTransport({
      command: ref.command,
      args: ref.args ?? [],
      env: { ...(0, import_stdio.getDefaultEnvironment)(), ...cred.type === "stdio" ? cred.env : {} }
    });
    const client = new import_client.Client({ name: "todos-executor", version: getVersion() }, { capabilities: {} });
    await withTimeout(client.connect(transport), TIMEOUTS_MS.mcpConnect, `${ref.slug} connect`);
    return { ref, client };
  } catch (err) {
    void transport?.close().catch(() => {
    });
    console.warn(`[mcp] ${ref.slug}: connect failed \u2014 its tools are unavailable this turn: ${formatError(err)}`);
    return null;
  }
}
async function mcpToolDefinitions(conns, takenNames) {
  const taken = new Set(takenNames);
  const lists = await Promise.all(conns.map(async (conn) => {
    try {
      const { tools } = await withTimeout(conn.client.listTools(), TIMEOUTS_MS.mcpConnect, `${conn.ref.slug} listTools`);
      return tools.map((tool) => makeMcpTool(conn, tool));
    } catch (err) {
      console.warn(`[mcp] ${conn.ref.slug}: listTools failed \u2014 its tools are unavailable this turn: ${formatError(err)}`);
      return [];
    }
  }));
  const out = [];
  for (const def of lists.flat()) {
    if (taken.has(def.name)) {
      console.warn(`[mcp] dropping ${def.name}: name already taken in this session`);
      continue;
    }
    taken.add(def.name);
    out.push(def);
  }
  return out;
}
function makeMcpTool(conn, tool) {
  const { ref, client } = conn;
  const name = mcpToolName(ref.slug, tool.name);
  return {
    name,
    label: `${ref.label}: ${tool.name}`,
    description: tool.description || `Tool "${tool.name}" from the MCP server "${ref.label}".`,
    // Raw JSON Schema, same as webFetchTool/makeRemoteTools: pi serializes it into the provider
    // payload without running TypeBox validation over it.
    parameters: tool.inputSchema ?? { type: "object", properties: {} },
    async execute(_id, params, signal) {
      try {
        const result = await client.callTool(
          { name: tool.name, arguments: params ?? {} },
          void 0,
          { signal, timeout: TIMEOUTS_MS.mcpToolCall }
        );
        const content = (Array.isArray(result.content) ? result.content : []).flatMap((c) => {
          if (c.type === "text") return [{ type: "text", text: String(c.text ?? "") }];
          if (c.type === "image") return [{ type: "image", data: String(c.data ?? ""), mimeType: String(c.mimeType ?? "image/png") }];
          return [{ type: "text", text: `[${name}: unsupported ${String(c.type)} content omitted]` }];
        });
        if (result.isError) {
          const text3 = content.map((c) => c.type === "text" ? c.text : "").join("\n").trim();
          return textResult(`${name} failed: ${text3 || "the server reported an error without details."}`);
        }
        return { content: content.length ? content : [{ type: "text", text: "(no content)" }], details: {} };
      } catch (err) {
        if (signal?.aborted) throw err;
        return textResult(`${name} returned no result: the call to the "${ref.label}" MCP server failed (${formatError(err)}). This is a connection problem, not a rejection \u2014 the server may be down or slow.`);
      }
    }
  };
}
async function closeMcpConnections(conns) {
  await Promise.all(conns.map((c) => c.client.close().catch(() => {
  })));
}
function textResult(s) {
  return { content: [{ type: "text", text: s }], details: {} };
}
async function withTimeout(p, ms, label) {
  let timer;
  try {
    return await Promise.race([
      p,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// src/lib/repoGitTool.ts
var CHIEF_OUTPUT_CAP = 8e3;
var BUILD_OUTPUT_CAP = 32e3;
var READ_SUBCOMMANDS = ["log", "show", "diff", "grep", "ls-files", "ls-tree", "cat-file", "rev-parse", "describe", "shortlog", "blame", "tag", "branch", "ls-remote", "fetch"];
var BANNED_FLAGS = /^(-o$|--output|--ext-diff$|--textconv$|-O$|--open-files-in-pager|--no-index$|--upload-pack)/;
function cap(out, limit) {
  return out.length > limit ? `${out.slice(0, limit)}
\u2026(truncated)` : out;
}
function openedNote(repo, baseDir) {
  return `Local clone of ${repo.remote?.url ?? repo.repoFullName} at ${baseDir} (default branch ${repo.defaultBranch} checked out, read-only): read it with read/grep/find like any folder; never edit it or run git writes there. Other refs: ["fetch", "origin", "<ref>"] here, then read FETCH_HEAD.`;
}
async function openRepo(serverUrl, token, stepId, projectId, signal) {
  const reply = await request(serverUrl, `/api/machine/tool/${stepId}`, token, { name: "open_repo", params: { projectId } }, {
    timeoutMs: TIMEOUTS_MS.openRepo,
    replaySafe: true,
    label: "open_repo",
    signal
  }).catch((err) => {
    if (signal?.aborted) throw err;
    const how = isTimeout(err) ? "timed out" : `failed (${formatError(err)})`;
    throw new Error(
      `Could not reach the Todos server to open this project's repository: the credential lookup ${how}. No git command ran and the repository is fine. Try again.`
    );
  });
  return parseJsonReply(reply, "open_repo");
}
function makeRepoGitTool(serverUrl, token, step) {
  const build = Boolean(step.workspace);
  const outputCap = build ? BUILD_OUTPUT_CAP : CHIEF_OUTPUT_CAP;
  const opened = /* @__PURE__ */ new Map();
  const announced = /* @__PURE__ */ new Set();
  function open(projectId, signal) {
    let entry = opened.get(projectId);
    if (!entry) {
      entry = (async () => {
        const repo = await openRepo(serverUrl, token, step.stepId, projectId, signal);
        const { origin, originToken } = remotesOf(repo);
        const baseDir = baseRepoDir(projectId);
        await withProjectLock(projectId, () => ensureBaseRepo(baseDir, origin, repo.defaultBranch, originToken, { readCheckout: true }));
        return { repo, baseDir, auth: authConfig(originToken, origin) };
      })();
      entry.catch(() => opened.delete(projectId));
      opened.set(projectId, entry);
    }
    return entry;
  }
  return {
    name: "git",
    label: "Git",
    description: `Read-only git against any team project's repository (this one included), on a local clone kept fresh on this machine (the very first use of a project clones it \u2014 that call can take a while). The default branch is checked out and tags are fetched; other branches and PR heads are not local: list remote refs with ["ls-remote", "origin"], or ["fetch", "origin", "<ref>"] (e.g. a branch name or pull/<n>/head) and then reference FETCH_HEAD. Allowed subcommands: ${READ_SUBCOMMANDS.join(", ")}; anything that writes is rejected. Examples: ["grep", "-n", "handleLogin"], ["log", "--oneline", "-20"], ["show", "HEAD:package.json"], ["tag", "--list"], ["show", "FETCH_HEAD:src/app.ts"].` + (build ? " The first result for a project names the clone's directory, which the file tools can read directly." : ""),
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Which project's repo to run against (the id after project: in a reference, or from projects / todos)." },
        args: { type: "array", items: { type: "string" }, description: 'git arguments as an array, starting with the subcommand, e.g. ["log", "--oneline", "-20"].' }
      },
      required: ["projectId", "args"],
      additionalProperties: false
    },
    async execute(_id, params, signal) {
      const p = params ?? {};
      const projectId = typeof p.projectId === "string" ? p.projectId.trim() : "";
      const args2 = Array.isArray(p.args) ? p.args.map(String) : [];
      if (!projectId || !args2.length) return text('git needs { projectId, args } \u2014 e.g. args: ["log", "--oneline", "-20"].');
      const sub = args2[0];
      if (!READ_SUBCOMMANDS.includes(sub)) {
        return text(`git ${sub} is not available \u2014 this tool is read-only. Allowed subcommands: ${READ_SUBCOMMANDS.join(", ")}.`);
      }
      const banned = args2.find((a) => BANNED_FLAGS.test(a));
      if (banned) return text(`The ${banned} flag is not allowed here.`);
      try {
        const { repo, baseDir, auth } = await open(projectId, signal);
        signal?.throwIfAborted();
        const note = build && !announced.has(projectId) ? `${openedNote(repo, baseDir)}

` : "";
        announced.add(projectId);
        if (sub === "fetch") {
          const ref = args2.length === 3 && args2[1] === "origin" && !args2[2].startsWith("-") ? args2[2] : null;
          if (!ref) return text('fetch is limited to exactly: ["fetch", "origin", "<ref>"] \u2014 e.g. a branch name or pull/<n>/head.');
          await withProjectLock(projectId, () => runGit(["fetch", "origin", ref], baseDir, auth, { timeoutMs: TIMEOUTS_MS.gitNetworkInteractive }));
          return text(`${note}Fetched ${ref} \u2014 reference it as FETCH_HEAD, e.g. ["log", "--oneline", "-10", "FETCH_HEAD"].`);
        }
        if (sub === "ls-remote") {
          const out2 = await runGit(args2, baseDir, auth, { timeoutMs: TIMEOUTS_MS.gitNetworkInteractive });
          return text(note + (cap(out2, outputCap) || "(no output)"));
        }
        const finalArgs = (sub === "tag" || sub === "branch") && !args2.some((a) => a === "--list" || a === "-l") ? [sub, "--list", ...args2.slice(1)] : args2;
        const out = await runGit(finalArgs, baseDir, {}, { timeoutMs: TIMEOUTS_MS.gitLocalInteractive });
        return text(note + (cap(out, outputCap) || "(no output)"));
      } catch (err) {
        if (signal?.aborted) throw err;
        return text(err.message);
      }
    }
  };
}

// src/lib/stepModelConfig.ts
function stepCredentialStore(seed) {
  const data = new Map(Object.entries(seed));
  return {
    async read(providerId) {
      return data.get(providerId);
    },
    async list() {
      return [...data.entries()].map(([providerId, c]) => ({ providerId, type: c.type }));
    },
    async modify(providerId, fn) {
      const next = await fn(data.get(providerId));
      if (next !== void 0) data.set(providerId, next);
      return data.get(providerId);
    },
    async delete(providerId) {
      data.delete(providerId);
    }
  };
}
async function buildStepModelRuntime(sdk, step) {
  const { agent: agent2 } = step;
  const fail3 = (error) => ({ ok: false, error });
  if (step.modelConfigError) return fail3(step.modelConfigError);
  const config = step.modelConfigs?.find((c) => c.providerId === agent2.provider);
  if (!config) {
    return fail3(`Model ${agent2.provider}/${agent2.modelId} is unavailable on this machine: the server sent no provider configuration for this step (server and CLI versions may be out of sync).`);
  }
  const configs = step.modelConfigs ?? [];
  const credentials = stepCredentialStore(Object.fromEntries(
    configs.filter((c) => c.credential.type === "oauth").map((c) => [c.providerId, c.credential])
  ));
  const modelRuntime = await sdk.ModelRuntime.create({ credentials, modelsPath: null, allowModelNetwork: false });
  for (const c of configs) {
    if (!c.provider) continue;
    modelRuntime.registerProvider(c.providerId, {
      name: c.provider.name,
      baseUrl: c.provider.baseUrl,
      api: c.provider.api,
      apiKey: c.credential.type === "api_key" ? c.credential.key : "-",
      authHeader: c.provider.authHeader,
      headers: c.provider.headers,
      models: c.provider.models.map((d) => ({ ...fillModelDefDefaults(d), compat: c.provider.compat ?? d.compat }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
  }
  const model = modelRuntime.getModel(agent2.provider, agent2.modelId);
  if (!model || !modelRuntime.hasConfiguredAuth(agent2.provider)) {
    return fail3(`Configured model ${agent2.provider}/${agent2.modelId} is unavailable on this machine: this team's provider configuration does not offer it. Manage providers on the website (Resources > Providers).`);
  }
  const trim = config.compactionTrim;
  const compactionModel = trim?.provider && trim.modelId ? modelRuntime.getModel(trim.provider, trim.modelId) ?? void 0 : void 0;
  if (trim?.modelId && !compactionModel) {
    console.warn(`[step] compaction model ${trim.provider}/${trim.modelId} is unavailable on this machine \u2014 summarizing with the step's own model`);
  }
  return {
    ok: true,
    runtime: {
      modelRuntime,
      model,
      transport: config.transport,
      compaction: config.compaction,
      compactionModel,
      compactionTrim: trim
    }
  };
}

// src/lib/compactionTrim.ts
var TRUNCATION_MARKER = "\n[truncated for compaction]";
var clip = (text3, keep) => text3.length <= keep ? text3 : text3.slice(0, keep) + TRUNCATION_MARKER;
function trimForSummary(messages, trim) {
  const { toolResultKeepChars: toolKeep, textKeepChars: textKeep } = trim;
  return messages.map((m) => {
    if (m.role === "toolResult" && Array.isArray(m.content)) {
      if (!toolKeep) return m;
      const parts = m.content;
      if (parts.every((p) => p.type === "text") && parts.reduce((n, p) => n + (p.text?.length ?? 0), 0) <= toolKeep) return m;
      const text3 = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n");
      return { ...m, content: [{ type: "text", text: clip(text3, toolKeep) }] };
    }
    if (!textKeep) return m;
    if (m.role === "user" && typeof m.content === "string") {
      return m.content.length <= textKeep ? m : { ...m, content: clip(m.content, textKeep) };
    }
    if ((m.role === "user" || m.role === "assistant") && Array.isArray(m.content)) {
      const parts = m.content;
      if (!parts.some((p) => p.type === "thinking" || p.type === "text" && (p.text?.length ?? 0) > textKeep)) return m;
      const next = parts.filter((p) => p.type !== "thinking").map((p) => p.type === "text" && (p.text?.length ?? 0) > textKeep ? { ...p, text: clip(p.text, textKeep) } : p);
      return { ...m, content: next };
    }
    return m;
  });
}
function compactionTrimExtension(sdk, settings4, opts = {}) {
  return {
    name: "compaction-trim",
    factory: (pi) => {
      pi.on("session_before_compact", async (event, ctx) => {
        if (!opts.trim && !opts.compactionModel) return;
        if (!ctx.model) return;
        try {
          let model = opts.compactionModel ?? ctx.model;
          let auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
          if (!auth.ok && model !== ctx.model) {
            model = ctx.model;
            auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
          }
          if (!auth.ok) return;
          const trim = opts.trim ?? {};
          const preparation = {
            ...event.preparation,
            messagesToSummarize: trimForSummary(event.preparation.messagesToSummarize, trim),
            turnPrefixMessages: trimForSummary(event.preparation.turnPrefixMessages, trim)
          };
          const requestModel = {
            ...model,
            ...trim.summaryMaxTokens ? { maxTokens: trim.summaryMaxTokens } : {},
            ...auth.baseUrl ? { baseUrl: auth.baseUrl } : {}
          };
          const headers = {
            ...openCodeHeaders(requestModel, ctx.sessionManager.getSessionId()),
            ...Object.fromEntries(Object.entries(auth.headers ?? {}).filter((e) => e[1] != null))
          };
          const compaction = await sdk.compact(
            preparation,
            requestModel,
            auth.apiKey,
            headers,
            void 0,
            event.signal,
            void 0,
            void 0,
            auth.env,
            settings4.getRetrySettings()
          );
          return { compaction };
        } catch (err) {
          if (event.signal.aborted) throw err;
          console.warn("[compaction-trim] falling back to pi default:", err.message);
        }
      });
    }
  };
}

// src/lib/sessionStore.ts
var import_node_fs6 = require("node:fs");
var import_promises3 = require("node:fs/promises");
var import_node_path6 = require("node:path");
var import_node_buffer = require("node:buffer");

// src/lib/atomicFile.ts
var import_node_fs5 = require("node:fs");
function atomicWriteFileSync(path, data, opts) {
  const tmp = `${path}.tmp`;
  (0, import_node_fs5.writeFileSync)(tmp, data, opts?.mode === void 0 ? void 0 : { mode: opts.mode });
  (0, import_node_fs5.renameSync)(tmp, path);
}

// src/lib/sessionMirror.ts
var import_node_zlib = require("node:zlib");
var import_node_util = require("node:util");
var gzipAsync = (0, import_node_util.promisify)(import_node_zlib.gzip);
var HEADERS = { "Content-Type": "application/x-ndjson", "Content-Encoding": "gzip" };
async function uploadMirror(url, plain, refreshUrl) {
  const body = await gzipAsync(plain);
  const put = (u) => boundedFetch(u, TIMEOUTS_MS.r2UploadSession, { method: "PUT", body, headers: HEADERS });
  let res = await put(url);
  if (!res.ok && refreshUrl) {
    const fresh = await refreshUrl();
    if (fresh) res = await put(fresh);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.headers.get("etag");
}
function blankMirror(url) {
  return uploadMirror(url, Buffer.alloc(0));
}

// src/lib/sessionStore.ts
function sessionsDir() {
  const dir = process.env.TDS_CHAT_SESSIONS_DIR ?? tdsPath("chat-sessions");
  (0, import_node_fs6.mkdirSync)(dir, { recursive: true });
  return dir;
}
function indexPath() {
  return (0, import_node_path6.join)(sessionsDir(), "index.json");
}
function loadIndex() {
  try {
    return JSON.parse((0, import_node_fs6.readFileSync)(indexPath(), "utf-8"));
  } catch {
    return { version: 1, entries: {} };
  }
}
function saveIndex(index) {
  const dir = sessionsDir();
  (0, import_node_fs6.mkdirSync)(dir, { recursive: true });
  atomicWriteFileSync(indexPath(), JSON.stringify(index));
}
function resolveSessionMode(sessionId) {
  const index = loadIndex();
  const entry = index.entries[sessionId];
  if (!entry) return { mode: "rebuild" };
  if (!(0, import_node_fs6.existsSync)(entry.sessionFilePath)) {
    delete index.entries[sessionId];
    saveIndex(index);
    return { mode: "rebuild" };
  }
  return { mode: "continue", sessionFilePath: entry.sessionFilePath };
}
function saveSessionPath(sessionId, sessionFilePath) {
  const index = loadIndex();
  index.entries[sessionId] = { sessionFilePath, lastUsedAt: Date.now() };
  saveIndex(index);
}
function touchSession(sessionId) {
  const index = loadIndex();
  const entry = index.entries[sessionId];
  if (entry) {
    entry.lastUsedAt = Date.now();
    saveIndex(index);
  }
}
async function hydrateFromUrl(sessionKey, url) {
  if (!url) return;
  if (resolveSessionMode(sessionKey).mode === "continue") return;
  let buf;
  try {
    const res = await boundedFetch(url, TIMEOUTS_MS.r2Download);
    if (!res.ok) return;
    buf = import_node_buffer.Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`[session] hydrate fetch failed for ${sessionKey}:`, err.message);
    return;
  }
  const target = (0, import_node_path6.join)(sessionsDir(), `${sessionKey}.jsonl`);
  atomicWriteFileSync(target, buf);
  saveSessionPath(sessionKey, target);
}
async function backupSession(sessionKey, sessionFile3, url, refreshUrl) {
  if (!url || !sessionFile3) return;
  try {
    await uploadMirror(url, await (0, import_promises3.readFile)(sessionFile3), refreshUrl);
  } catch (err) {
    console.warn(`[session] R2 backup failed for ${sessionKey}:`, err.message);
  }
}
async function materializeSession(opts) {
  await hydrateFromUrl(opts.sessionKey, opts.restoreUrl);
  const mode = resolveSessionMode(opts.sessionKey);
  if (mode.mode === "continue") {
    touchSession(opts.sessionKey);
    pruneSessionFile(mode.sessionFilePath);
    return {
      sessionManager: opts.sdk.SessionManager.open(mode.sessionFilePath, sessionsDir(), opts.cwd),
      isContinue: true,
      sessionKeyForSave: null
    };
  }
  return {
    sessionManager: opts.sdk.SessionManager.create(opts.cwd, sessionsDir(), { id: opts.sessionKey }),
    isContinue: false,
    sessionKeyForSave: opts.sessionKey
  };
}
var PRUNE_MIN_BYTES = 1024 * 1024;
function readLines(file2) {
  return (0, import_node_fs6.readFileSync)(file2, "utf-8").split("\n").filter(Boolean);
}
function parseEntry(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
function pruneSessionFile(file2) {
  try {
    const size = (0, import_node_fs6.statSync)(file2).size;
    if (size < PRUNE_MIN_BYTES) return;
    const lines = readLines(file2);
    const entries = lines.map(parseEntry);
    if (entries[0]?.type !== "session") return;
    const at = /* @__PURE__ */ new Map();
    entries.forEach((e, i) => {
      if (i && e?.id) at.set(e.id, i);
    });
    const path = [];
    for (let i = entries.length - 1; i > 0; ) {
      path.push(i);
      const parent = at.get(entries[i]?.parentId ?? "");
      if (parent === void 0 || parent >= i) break;
      i = parent;
    }
    const anchor = path.filter((i) => entries[i]?.type === "compaction")[1];
    if (anchor === void 0) return;
    const cut = at.get(entries[anchor]?.firstKeptEntryId ?? "") ?? anchor;
    if (cut > anchor || lines.slice(1, cut).reduce((n, l) => n + l.length + 1, 0) < PRUNE_MIN_BYTES) return;
    const carried = [];
    for (const type of ["model_change", "thinking_level_change"]) {
      const i = path.find((i2) => i2 < cut && entries[i2]?.type === type);
      if (i !== void 0) carried.push({ ...entries[i], parentId: carried[carried.length - 1]?.id ?? null });
    }
    const first2 = { ...entries[cut], parentId: carried[carried.length - 1]?.id ?? null };
    const out = [lines[0], ...carried.map((e) => JSON.stringify(e)), JSON.stringify(first2), ...lines.slice(cut + 1)].join("\n") + "\n";
    atomicWriteFileSync(file2, out);
    console.log(`[session] pruned ${(0, import_node_path6.basename)(file2)}: ${size} -> ${import_node_buffer.Buffer.byteLength(out)} bytes`);
  } catch (err) {
    console.warn(`[session] prune failed for ${(0, import_node_path6.basename)(file2)}:`, err.message);
  }
}
function truncateSessionFile(file2, leafEntryId, stepId) {
  const lines = readLines(file2);
  if (lines.length === 0) return;
  const header = lines[0];
  if (!leafEntryId) {
    (0, import_node_fs6.writeFileSync)(file2, header + "\n");
    return;
  }
  const kept = [header];
  let found2 = false;
  for (let i = 1; i < lines.length; i++) {
    kept.push(lines[i]);
    if (parseEntry(lines[i])?.id === leafEntryId) {
      found2 = true;
      break;
    }
  }
  if (!found2) {
    console.warn(`[restore] ${stepId} session leaf ${leafEntryId} not found \u2014 session pruned or drifted from history, resetting to empty`);
    (0, import_node_fs6.writeFileSync)(file2, header + "\n");
    return;
  }
  (0, import_node_fs6.writeFileSync)(file2, kept.join("\n") + "\n");
}
async function truncateSessionToLeaf(sessionId, restoreUrl, leafEntryId, stepId) {
  await hydrateFromUrl(sessionId, restoreUrl);
  const mode = resolveSessionMode(sessionId);
  if (mode.mode !== "continue") return null;
  truncateSessionFile(mode.sessionFilePath, leafEntryId, stepId);
  return mode.sessionFilePath;
}
async function cleanupStaleSessions(ttlMs = 7 * 24 * 3600 * 1e3) {
  const index = loadIndex();
  const cutoff = Date.now() - ttlMs;
  const stale = [];
  for (const [sessionId, entry] of Object.entries(index.entries)) {
    if (entry.lastUsedAt < cutoff) {
      stale.push(entry.sessionFilePath);
      delete index.entries[sessionId];
    }
  }
  if (!stale.length) return;
  saveIndex(index);
  await Promise.all(stale.map((path) => (0, import_promises3.rm)(path, { force: true }).catch(() => {
  })));
  console.log("[machine] Cleaned up stale local session files");
}

// src/lib/skillCache.ts
var import_node_fs7 = require("node:fs");
var import_node_path7 = require("node:path");
var SKILL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function chmodTree(path, dirMode, fileMode) {
  const st = (0, import_node_fs7.statSync)(path);
  if (st.isDirectory()) {
    for (const e of (0, import_node_fs7.readdirSync)(path)) chmodTree((0, import_node_path7.join)(path, e), dirMode, fileMode);
    (0, import_node_fs7.chmodSync)(path, dirMode);
  } else {
    (0, import_node_fs7.chmodSync)(path, fileMode);
  }
}
async function downloadSkillFiles(skill, dir) {
  const tmp = `${dir}.tmp.${process.pid}.${Date.now()}`;
  (0, import_node_fs7.mkdirSync)(tmp, { recursive: true });
  try {
    await Promise.all(skill.files.map(async (f) => {
      if (f.name.includes("..")) throw new Error(`unsafe skill file name ${f.name}`);
      if (!f.url) throw new Error(`missing url for ${f.name}`);
      const body = await withRetry(
        async () => {
          const res = await boundedFetch(f.url, TIMEOUTS_MS.r2Download);
          if (!res.ok) throw httpError(res, `for ${f.name}`);
          return Buffer.from(await res.arrayBuffer());
        },
        isRetryableHttpError,
        `[step] skill file ${f.name} fetch`
      );
      const dest = (0, import_node_path7.join)(tmp, f.name);
      (0, import_node_fs7.mkdirSync)((0, import_node_path7.dirname)(dest), { recursive: true });
      (0, import_node_fs7.writeFileSync)(dest, body);
    }));
    (0, import_node_fs7.mkdirSync)((0, import_node_path7.dirname)(dir), { recursive: true });
    if ((0, import_node_fs7.existsSync)(dir)) {
      (0, import_node_fs7.rmSync)(tmp, { recursive: true, force: true });
    } else {
      (0, import_node_fs7.renameSync)(tmp, dir);
      chmodTree(dir, 365, 292);
    }
  } catch (err) {
    (0, import_node_fs7.rmSync)(tmp, { recursive: true, force: true });
    throw err;
  }
}
async function materializeSkills(skills, agentDir2) {
  if (!skills?.length) return [];
  const out = [];
  for (const skill of skills) {
    if (!skill.files.some((f) => f.name === "SKILL.md")) continue;
    const dir = (0, import_node_path7.join)(agentDir2, "skills", skill.id, String(skill.updatedAt));
    const filePath = (0, import_node_path7.join)(dir, "SKILL.md");
    try {
      if ((0, import_node_fs7.existsSync)(filePath)) (0, import_node_fs7.utimesSync)(dir, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date());
      else await downloadSkillFiles(skill, dir);
      out.push({
        name: skill.name,
        description: skill.description,
        filePath,
        baseDir: dir,
        sourceInfo: { path: filePath, source: "tds-skill", scope: "temporary", origin: "top-level", baseDir: dir },
        disableModelInvocation: false
      });
    } catch (err) {
      console.error(`[step] skill ${skill.id} materialize failed:`, err instanceof Error ? err.message : String(err));
    }
  }
  return out;
}
function gcSkillCache(agentDir2) {
  const root = (0, import_node_path7.join)(agentDir2, "skills");
  if (!(0, import_node_fs7.existsSync)(root)) return;
  const now = Date.now();
  for (const skillId of (0, import_node_fs7.readdirSync)(root)) {
    const skillDir = (0, import_node_path7.join)(root, skillId);
    let versions;
    try {
      versions = (0, import_node_fs7.readdirSync)(skillDir);
    } catch {
      continue;
    }
    for (const v of versions) {
      const dir = (0, import_node_path7.join)(skillDir, v);
      try {
        if (now - (0, import_node_fs7.statSync)(dir).mtimeMs > SKILL_CACHE_TTL_MS) {
          chmodTree(dir, 493, 420);
          (0, import_node_fs7.rmSync)(dir, { recursive: true, force: true });
        }
      } catch {
      }
    }
    try {
      if ((0, import_node_fs7.readdirSync)(skillDir).length === 0) (0, import_node_fs7.rmSync)(skillDir, { recursive: true, force: true });
    } catch {
    }
  }
}
var skillGcStarted = false;
function ensureSkillGc(agentDir2) {
  if (skillGcStarted) return;
  skillGcStarted = true;
  try {
    gcSkillCache(agentDir2);
  } catch {
  }
  setInterval(() => {
    try {
      gcSkillCache(agentDir2);
    } catch {
    }
  }, 6 * 60 * 60 * 1e3).unref();
}

// src/lib/streaming.ts
var activeHeartbeats = /* @__PURE__ */ new Map();
function pokeActiveHeartbeats(stepId) {
  const tick = stepId && activeHeartbeats.get(stepId);
  if (tick) return tick();
  for (const t of activeHeartbeats.values()) t();
}
function modelCallFromMessage(message, thinkingLevel) {
  const { input, output, cacheRead, cacheWrite, cost } = message.usage;
  return {
    provider: message.provider,
    modelId: message.responseModel ?? message.model,
    thinkingLevel,
    at: message.timestamp,
    usage: {
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      costUsd: cost.total
    }
  };
}
function formatToolInput(toolName, args2) {
  if (!args2) return "";
  switch (toolName) {
    case "read":
    case "write":
    case "edit":
    case "ls":
      return String(args2.path ?? "");
    case "bash":
      return String(args2.command ?? "").slice(0, 100);
    case "grep":
      return `"${args2.pattern ?? ""}"${args2.path ? ` in ${args2.path}` : ""}`;
    case "find":
      return String(args2.path ?? args2.pattern ?? "");
    case "web_fetch":
      return String(args2.url ?? "");
    case "web_search":
      return String(args2.query ?? args2.input ?? "");
    default: {
      const firstVal = Object.values(args2)[0];
      return firstVal ? String(firstVal).slice(0, 100) : "";
    }
  }
}
async function postRaw(serverUrl, path, body, token) {
  const res = await serverRequest(serverUrl, path, { token, body, timeoutMs: TIMEOUTS_MS.stepPost });
  if (!res.ok) throw httpError(res);
  return await res.json();
}
async function post(serverUrl, path, body, token) {
  try {
    return await postRaw(serverUrl, path, body, token);
  } catch (err) {
    console.error(`[machine] POST ${path} failed:`, err.message);
    return {};
  }
}
async function postCritical(serverUrl, path, body, token) {
  return withRetry(
    () => postRaw(serverUrl, path, body, token),
    isRetryableHttpError,
    `[machine] POST ${path}`
  );
}
function startHeartbeat(serverUrl, stepId, onSignal, token, opts = {}) {
  const { onRemoteMachines, intervalMs = 60 * 1e3, onSteer, body = () => ({}) } = opts;
  let active = true;
  let inFlight2 = null;
  const tick = () => {
    if (!active || inFlight2) return;
    inFlight2 = (async () => {
      const res = await post(serverUrl, `/api/machine/heartbeat/${stepId}`, body(), token);
      if (active && res.stop) onSignal();
      if (active && Array.isArray(res.steer)) onSteer?.(res.steer);
      if (active && Array.isArray(res.remoteMachines)) onRemoteMachines?.(res.remoteMachines);
    })().catch((err) => console.error(`[machine] heartbeat ${stepId} handler failed:`, err.message)).finally(() => {
      inFlight2 = null;
    });
  };
  tick();
  const id = setInterval(tick, intervalMs);
  activeHeartbeats.set(stepId, tick);
  return {
    stop: () => {
      active = false;
      clearInterval(id);
      activeHeartbeats.delete(stepId);
    },
    // Resolves once the beat in flight (if any) has been answered and its steers handed on.
    settle: () => inFlight2 ?? Promise.resolve()
  };
}
var POST_PACING_MS = 50;
function mergeKind(body) {
  if (typeof body.text !== "string") return null;
  if (body.type === void 0) return "text";
  if (body.type === "thinking") return "thinking";
  return null;
}
function attachStreamingSession(session3, label, postToken, onStop, firstFrame) {
  const abort = new AbortController();
  abort.signal.addEventListener("abort", () => {
    try {
      session3.dispose();
    } catch {
    }
  });
  let settledText = "";
  let liveText = "";
  let lastModelError;
  let lastStopReason;
  const modelCalls2 = [];
  const compactions = [];
  let compactionStartedAt;
  let retryActive = false;
  const queue = [];
  let pump = Promise.resolve();
  let pumping = false;
  const runPump = async () => {
    try {
      while (queue.length) {
        const res = await postToken(queue.shift());
        if (res.stop) onStop();
        if (queue.length) await new Promise((r) => setTimeout(r, POST_PACING_MS));
      }
    } finally {
      pumping = false;
    }
  };
  let firstFramePending = firstFrame;
  const push = (body) => {
    if (firstFramePending) {
      queue.push(firstFramePending);
      firstFramePending = void 0;
    }
    const kind = mergeKind(body);
    const last = queue[queue.length - 1];
    if (kind && last && mergeKind(last) === kind) {
      last.text = last.text + body.text;
      return;
    }
    queue.push(body);
    if (!pumping) {
      pumping = true;
      pump = runPump();
    }
  };
  const clearRetry = () => {
    if (!retryActive) return;
    retryActive = false;
    push({ type: "retry", attempt: 0, maxAttempts: 0 });
  };
  const unsub = session3.subscribe((ev) => {
    if (ev.type === "message_end") {
      if (ev.message.role === "assistant") {
        modelCalls2.push(modelCallFromMessage(ev.message, session3.thinkingLevel));
        const text3 = ev.message.content.map((c) => c.type === "text" ? c.text : "").join("");
        if (text3 !== liveText) {
          console.warn(`[${label}] message_end text reconcile: deltas=${liveText.length} content=${text3.length} chars`);
          if (text3.startsWith(liveText)) push({ text: text3.slice(liveText.length) });
        }
        settledText += text3 || liveText;
        liveText = "";
        const { stopReason, errorMessage } = ev.message;
        lastStopReason = stopReason;
        lastModelError = errorMessage;
        if (stopReason !== "stop" && stopReason !== "toolUse") {
          console.warn(`[${label}] message_end stopReason=${stopReason}${errorMessage ? ` error=${errorMessage}` : ""}`);
        }
      }
      return;
    }
    if (ev.type === "auto_retry_start") {
      console.warn(`[${label}] auto_retry attempt=${ev.attempt}/${ev.maxAttempts} error=${ev.errorMessage}`);
      void refreshSystemProxy();
      retryActive = true;
      push({ type: "retry", attempt: ev.attempt, maxAttempts: ev.maxAttempts });
      return;
    }
    if (ev.type === "auto_retry_end") {
      if (!ev.success) console.error(`[${label}] auto_retry_end failed finalError=${ev.finalError}`);
      clearRetry();
      return;
    }
    if (ev.type === "compaction_start") {
      compactionStartedAt = Date.now();
      push({ type: "compact", active: true });
      return;
    }
    if (ev.type === "compaction_end") {
      push({ type: "compact", active: false });
      const durationMs = compactionStartedAt === void 0 ? void 0 : Date.now() - compactionStartedAt;
      compactionStartedAt = void 0;
      if (ev.errorMessage) console.warn(`[${label}] auto-compaction failed: ${ev.errorMessage}`);
      else if (!ev.aborted && ev.result) {
        const u = ev.result.usage;
        compactions.push({
          tokensBefore: ev.result.tokensBefore,
          usage: u && {
            inputTokens: u.input,
            outputTokens: u.output,
            cacheReadTokens: u.cacheRead,
            cacheWriteTokens: u.cacheWrite,
            costUsd: u.cost.total
          },
          durationMs
        });
      }
      return;
    }
    if (ev.type === "message_update") {
      const ame = ev.assistantMessageEvent;
      if ("delta" in ame && ame.delta || ame.type === "toolcall_end") clearRetry();
      if (ame.type === "text_delta") {
        const delta = ame.delta;
        if (delta) {
          liveText += delta;
          push({ text: delta });
        }
      } else if (ame.type === "thinking_delta") {
        const delta = ame.delta;
        if (delta) push({ type: "thinking", text: delta });
      } else if (ame.type === "toolcall_end") {
        const { name: toolName, arguments: args2 } = ame.toolCall;
        if (toolName) {
          push({ type: "tool_start", toolName, detail: formatToolInput(toolName, args2) });
        }
      }
    }
  });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    unsub();
    try {
      session3.dispose();
    } catch {
    }
  };
  return {
    abort,
    getFullText: () => settledText + liveText,
    getLastModelError: () => lastModelError,
    getLastStopReason: () => lastStopReason,
    getModelCalls: () => modelCalls2.length ? modelCalls2 : void 0,
    getCompactions: () => compactions.length ? compactions : void 0,
    idle: () => pump,
    dispose
  };
}

// src/lib/doneOutbox.ts
var import_node_fs8 = require("node:fs");
var import_node_path8 = require("node:path");
var MAX_ENTRY_AGE_MS = 48 * 60 * 60 * 1e3;
function outboxDir() {
  const dir = process.env.TDS_OUTBOX_DIR ?? tdsPath("outbox");
  (0, import_node_fs8.mkdirSync)(dir, { recursive: true });
  return dir;
}
var entryPath = (stepId) => (0, import_node_path8.join)(outboxDir(), `${stepId}.json`);
function clearSpooled(stepId) {
  (0, import_node_fs8.rmSync)(entryPath(stepId), { force: true });
}
function readEntry(stepId) {
  const path = entryPath(stepId);
  try {
    return JSON.parse((0, import_node_fs8.readFileSync)(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    console.error(`[outbox] moving corrupt entry aside: ${path}:`, err.message);
    try {
      (0, import_node_fs8.renameSync)(path, `${path}.corrupt`);
    } catch {
      (0, import_node_fs8.rmSync)(path, { force: true });
    }
    return null;
  }
}
var inFlight = /* @__PURE__ */ new Set();
async function sendEntry(serverUrl, token, stepId, body, send) {
  if (inFlight.has(stepId)) return;
  inFlight.add(stepId);
  try {
    await send(serverUrl, `/api/machine/done/${stepId}`, body, token);
    clearSpooled(stepId);
  } catch (err) {
    const transientEdgeRefusal = body.mode === "branch_sync" && err.httpStatus === 403;
    if (!transientEdgeRefusal && !isRetryableHttpError(err)) {
      console.error(`[outbox] server refused done for step ${stepId} (${err.message}) \u2014 dropping entry`);
      clearSpooled(stepId);
      return;
    }
    console.warn(`[outbox] done for step ${stepId} not delivered (${err.message}) \u2014 kept for retry`);
  } finally {
    inFlight.delete(stepId);
  }
}
async function deliverDone(serverUrl, token, stepId, body, send = postCritical) {
  try {
    atomicWriteFileSync(entryPath(stepId), JSON.stringify(body));
  } catch (err) {
    console.error(`[outbox] spool failed for step ${stepId}:`, err.message);
  }
  await sendEntry(serverUrl, token, stepId, body, send);
}
async function resendSpooledDone(serverUrl, token, stepId, send = postCritical) {
  const body = readEntry(stepId);
  if (!body) return false;
  await sendEntry(serverUrl, token, stepId, body, send);
  return true;
}
async function flushDoneOutbox(serverUrl, token, send = postCritical) {
  let names;
  try {
    names = (0, import_node_fs8.readdirSync)(outboxDir()).filter((n) => n.endsWith(".json"));
  } catch {
    return;
  }
  await Promise.all(names.map(async (name) => {
    const stepId = name.slice(0, -".json".length);
    const mtime = (0, import_node_fs8.statSync)(entryPath(stepId), { throwIfNoEntry: false })?.mtimeMs;
    if (mtime === void 0) return;
    if (Date.now() - mtime > MAX_ENTRY_AGE_MS) {
      console.warn(`[outbox] dropping expired entry for step ${stepId} (${Math.round((Date.now() - mtime) / 36e5)}h old)`);
      clearSpooled(stepId);
      return;
    }
    const body = readEntry(stepId);
    if (body) await sendEntry(serverUrl, token, stepId, body, send);
  }));
}

// src/lib/stepReport.ts
function makeDone(step, serverUrl, token) {
  const { stepId, conversationId, mode } = step;
  return (payload) => {
    const body = { conversationId, mode, ...payload };
    if (mode === "restore" || mode === "compact") {
      return postCritical(serverUrl, `/api/machine/done/${stepId}`, body, token).catch((err) => console.error(`[step] ${stepId} done report failed:`, err.message));
    }
    return deliverDone(serverUrl, token, stepId, body);
  };
}
function makeUploadUrlRefresh(serverUrl, token, stepId) {
  return async () => {
    try {
      const res = await serverRequest(serverUrl, `/api/machine/upload-urls/${stepId}`, { token, timeoutMs: TIMEOUTS_MS.recover });
      if (!res.ok) return void 0;
      return await res.json();
    } catch {
      return void 0;
    }
  };
}

// src/lib/images.ts
var import_node_fs9 = require("node:fs");
var import_node_path9 = require("node:path");
async function downloadImages(images, stepId) {
  if (!images?.length) return [];
  const downloaded = await Promise.all(images.map(async (img) => {
    if (!img.url) return null;
    try {
      const res = await boundedFetch(img.url, TIMEOUTS_MS.r2Download);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = Buffer.from(await res.arrayBuffer()).toString("base64");
      return { type: "image", data, mimeType: img.mimeType };
    } catch (err) {
      console.error(`[step] ${stepId} image download failed for ${img.key}:`, err instanceof Error ? err.message : String(err));
      return null;
    }
  }));
  return downloaded.filter((i) => i !== null);
}
async function withImageFiles(text3, images, dir, stepId) {
  const downloaded = await downloadImages(images, stepId);
  if (!downloaded.length) return text3;
  (0, import_node_fs9.mkdirSync)(dir, { recursive: true });
  const paths2 = downloaded.map((img, i) => {
    const path = (0, import_node_path9.join)(dir, `${stepId}-${i + 1}.${img.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin"}`);
    (0, import_node_fs9.writeFileSync)(path, Buffer.from(img.data, "base64"));
    return path;
  });
  return `${text3}

${paths2.map((p) => `Attached image: ${p}`).join("\n")}`;
}

// src/lib/turnCheckpoint.ts
function checkpointReport(checkpoint) {
  return {
    ...checkpoint,
    pushed: checkpoint.pushOutcome?.ok ? true : void 0,
    pushError: failedPushOf(checkpoint.pushOutcome)?.error
  };
}
async function discardReadOnlyTurn(step, cwd) {
  if (!step.readOnly || !step.workspace) return;
  try {
    if (!await runGit(["status", "--porcelain"], cwd)) return;
    console.warn(`[step] ${step.stepId} read-only turn changed the worktree \u2014 discarding`);
    await runGit(["reset", "--hard"], cwd);
    await runGit(["clean", "-fd"], cwd);
  } catch (err) {
    console.warn(`[step] ${step.stepId} read-only worktree reset failed:`, err.message);
  }
}
async function captureTurnCheckpoint(cwd, step, workspace, credential, turnText, uploadChanges) {
  const { stepId, conversationId } = step;
  const { defaultBranch, syncPush } = workspace;
  const { origin } = remotesOf(workspace);
  const external = !!workspace.remote;
  const tagged = parseCommitMessageTag(turnText);
  const committed = await commitCheckpoint(cwd, defaultBranch, stepId, tagged && `${tagged}

Checkpoint: ${stepId}`);
  const checkpoint = { commitSha: committed.sha, checkpointError: committed.error };
  const branchName = convBranch(conversationId);
  try {
    await pushBranch(cwd, credential, branchName, origin, { quick: !syncPush });
    console.log(`[step] ${stepId} pushed ${branchName}`);
    checkpoint.pushOutcome = { ok: true };
    if (external && uploadChanges) {
      const changes = await computeChanges(cwd, defaultBranch, stepId);
      if (changes) await uploadChanges(changes);
    }
    if (workspace.landOnClean && external && !checkpoint.checkpointError && parseMergeOutput(turnText).mergeStatus === "clean") {
      checkpoint.landOutcome = await landBranch(cwd, credential.current(), branchName, origin, defaultBranch);
      console.log(`[step] ${stepId} landing on ${defaultBranch}: ${checkpoint.landOutcome.ok ? "ok" : checkpoint.landOutcome.reason}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[step] ${stepId} push failed:`, message);
    checkpoint.pushOutcome = error instanceof PushFailure ? { ok: false, error: message, kind: error.kind, staleLeaseRetried: error.staleLeaseRetried } : { ok: false, error: message, kind: classifyPushError(message), staleLeaseRetried: false };
    if (syncPush) checkpoint.checkpointError ??= `${PUSH_FAILED_PREFIX}${message}`;
  }
  if (checkpoint.commitSha) checkpoint.commitSha = await runGit(["rev-parse", "HEAD"], cwd).catch(() => checkpoint.commitSha);
  checkpoint.diffHash = await computeDiffHash(cwd, defaultBranch, stepId);
  return checkpoint;
}

// src/lib/deferredWork.ts
var import_promises4 = require("node:timers/promises");
var deferredTurnWork = /* @__PURE__ */ new Map();
function deferTurnWork(conversationId, work) {
  const next = (deferredTurnWork.get(conversationId) ?? Promise.resolve()).then(work).catch((err) => console.error(`[step] deferred turn work failed (conv ${conversationId}):`, err.message));
  deferredTurnWork.set(conversationId, next);
  void next.finally(() => {
    if (deferredTurnWork.get(conversationId) === next) deferredTurnWork.delete(conversationId);
  });
  return next;
}
async function drainTurnWork(conversationId, pending, stepId, timeoutMs = TIMEOUTS_MS.deferredTurnWork) {
  const bail = new AbortController();
  const drained = await Promise.race([
    pending.then(() => true, () => true),
    (0, import_promises4.setTimeout)(timeoutMs, false, { signal: bail.signal }).catch(() => false)
  ]);
  bail.abort();
  if (drained) return;
  console.error(`[step] ${stepId} deferred turn work still pending after ${timeoutMs}ms \u2014 abandoning it (conv ${conversationId})`);
  if (deferredTurnWork.get(conversationId) === pending) deferredTurnWork.delete(conversationId);
}

// src/lib/frameLane.ts
function createFrameLane(serverUrl, token, stepId, onSteer) {
  let steerOpen = true;
  let chain = Promise.resolve();
  const pollBody = (body = {}) => steerOpen ? body : { ...body, steer: false };
  const postFrame = (body) => {
    const p = chain.then(async () => {
      const res = await post(serverUrl, `/api/machine/token/${stepId}`, pollBody(body), token);
      if (Array.isArray(res.steer)) onSteer(res.steer);
      return res;
    });
    chain = p.catch(() => ({}));
    return p;
  };
  return { postFrame, pollBody, setSteerOpen: (open) => {
    steerOpen = open;
  } };
}

// src/lib/externalBin.ts
var import_node_fs10 = require("node:fs");
var import_node_os2 = require("node:os");
var import_node_path10 = require("node:path");
function globalBinDirs({ env = process.env, platform: platform2 = process.platform, home = (0, import_node_os2.homedir)() } = {}) {
  if (platform2 === "win32") return [(0, import_node_path10.join)(env.APPDATA ?? (0, import_node_path10.join)(home, "AppData", "Roaming"), "npm")];
  const nvm = (0, import_node_path10.join)(env.NVM_DIR ?? (0, import_node_path10.join)(home, ".nvm"), "versions", "node");
  const fnm = env.FNM_DIR ?? (0, import_node_path10.join)(home, platform2 === "darwin" ? "Library/Application Support/fnm" : ".local/share/fnm");
  return [
    (0, import_node_path10.join)(home, ".local", "bin"),
    ...newestFirst(nvm).map((version) => (0, import_node_path10.join)(nvm, version, "bin")),
    (0, import_node_path10.join)(fnm, "aliases", "default", "bin"),
    (0, import_node_path10.join)(env.VOLTA_HOME ?? (0, import_node_path10.join)(home, ".volta"), "bin"),
    (0, import_node_path10.join)(home, ".npm-global", "bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin"
  ];
}
function resolveExecutable(spec, lookup = {}) {
  const { env = process.env, platform: platform2 = process.platform, home = (0, import_node_os2.homedir)() } = lookup;
  const override = env[spec.override];
  if (override) return override;
  const names = platform2 === "win32" ? [`${spec.command}.exe`, `${spec.command}.cmd`] : [spec.command];
  const dirs = [...(env.PATH ?? "").split(import_node_path10.delimiter), ...(spec.homeDirs ?? []).map((d) => (0, import_node_path10.join)(home, ...d)), ...globalBinDirs({ env, platform: platform2, home })];
  for (const dir of dirs) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = (0, import_node_path10.join)(dir, name);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}
function cmdShimTarget(shim) {
  let text3;
  try {
    text3 = (0, import_node_fs10.readFileSync)(shim, "utf8");
  } catch {
    return null;
  }
  const targets = [...text3.matchAll(/"%(?:~dp0|dp0%)\\([^"]+)"/g)].map((m) => m[1]).filter((t) => !/(^|\\)node\.exe$/i.test(t));
  const target = targets.at(-1);
  if (!target) return null;
  const path = (0, import_node_path10.join)((0, import_node_path10.dirname)(shim), ...target.split("\\"));
  return isFile(path) ? path : null;
}
function newestFirst(dir) {
  try {
    return (0, import_node_fs10.readdirSync)(dir).sort((a, b) => b.localeCompare(a, void 0, { numeric: true }));
  } catch {
    return [];
  }
}
function isFile(path) {
  try {
    return (0, import_node_fs10.statSync)(path).isFile();
  } catch {
    return false;
  }
}

// src/lib/claude-code/bin.ts
var SPEC = { override: "TDS_CLAUDE_CODE_BIN", command: "claude", homeDirs: [[".claude", "local"]] };
function resolveClaudeCodeExecutable(lookup) {
  const bin = resolveExecutable(SPEC, lookup);
  if (bin && /\.(cmd|bat)$/i.test(bin)) return cmdShimTarget(bin) ?? bin;
  return bin;
}
var CLAUDE_CODE_MISSING = "Claude Code is not installed on this machine \u2014 install it (https://claude.com/claude-code) and sign in, so that `claude` is on PATH; or point TDS_CLAUDE_CODE_BIN at the executable.";

// src/lib/claude-code/runtime.ts
var cached4 = null;
async function getClaudeCodeSDK() {
  if (cached4) return cached4;
  cached4 = await import("@anthropic-ai/claude-agent-sdk");
  return cached4;
}

// src/lib/claude-code/steer.ts
function createSteerBridge(prepare) {
  const queue = [];
  let waiting = null;
  let closed = false;
  let preparing = 0;
  let chain = Promise.resolve();
  const deliver = (msg) => {
    if (closed) return;
    if (waiting) {
      const resolve6 = waiting;
      waiting = null;
      resolve6(msg);
    } else {
      queue.push(msg);
    }
  };
  const steer = (entries) => {
    preparing += entries.length;
    chain = chain.then(async () => {
      for (const entry of entries) {
        try {
          deliver(await prepare(entry));
        } catch (err) {
          console.error("[steer] prepare failed:", err.message);
        } finally {
          preparing--;
        }
      }
    });
  };
  const pending = async () => {
    await chain;
    return preparing + queue.length;
  };
  const close = () => {
    closed = true;
    if (waiting) {
      const resolve6 = waiting;
      waiting = null;
      resolve6(null);
    }
  };
  async function* messages(opening2) {
    yield opening2;
    while (!closed) {
      if (queue.length) {
        yield queue.shift();
        continue;
      }
      const msg = await new Promise((resolve6) => {
        waiting = resolve6;
      });
      if (!msg) break;
      yield msg;
    }
  }
  return { messages, steer, pending, close };
}

// src/lib/claude-code/stream.ts
function formatToolInput2(toolName, args2) {
  if (!args2) return "";
  switch (toolName) {
    case "Read":
    case "Write":
    case "Edit":
      return String(args2.file_path ?? "");
    case "Bash":
      return String(args2.command ?? "").slice(0, 100);
    case "Grep":
      return `"${args2.pattern ?? ""}"${args2.path ? ` in ${args2.path}` : ""}`;
    case "WebFetch":
      return String(args2.url ?? "");
    case "WebSearch":
      return String(args2.query ?? "");
    default: {
      const firstVal = Object.values(args2)[0];
      return firstVal ? String(firstVal).slice(0, 100) : "";
    }
  }
}
function handleClaudeCodeMessage(msg, pump) {
  const m = msg;
  const type = m.type;
  if (type === "assistant") {
    const content = m.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "text" && typeof block.text === "string") pump.textDone(block.text);
        if (block.type === "tool_use") {
          const name = String(block.name ?? "");
          pump.toolStart(name, formatToolInput2(name, block.input));
        }
      }
    }
  }
  if (type === "stream_event") {
    const ev = m.event;
    if (ev?.type === "message_start") pump.retryDone();
    if (ev?.type === "content_block_delta") {
      const d = ev.delta;
      if (d?.type === "text_delta" && typeof d.text === "string") pump.text(d.text);
      if (d?.type === "thinking_delta" && typeof d.text === "string") pump.thinking(d.text);
    }
  }
  if (type === "system" && m.subtype === "api_retry") {
    pump.retry(Number(m.attempt) || 0, Number(m.max_retries) || 0);
  }
}

// src/lib/claude-code/session.ts
var import_node_crypto2 = require("node:crypto");
var import_node_fs11 = require("node:fs");
var import_promises5 = require("node:fs/promises");
var import_node_os3 = require("node:os");
var import_node_path11 = require("node:path");
function claudeSessionUuid(sessionId) {
  const h = (0, import_node_crypto2.createHash)("sha1").update(`tds-claude-code:${sessionId}`).digest();
  h[6] = h[6] & 15 | 80;
  h[8] = h[8] & 63 | 128;
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function claudeCodeCwd(step) {
  return step.workspace ? (0, import_node_path11.join)(workspacesRoot(), step.conversationId) : process.cwd();
}
function projectSlug(cwd) {
  const sanitized = cwd.replace(/[^a-zA-Z0-9]/g, "-");
  if (sanitized.length <= 200) return sanitized;
  let h = 0;
  for (let i = 0; i < cwd.length; i++) h = (h << 5) - h + cwd.charCodeAt(i) | 0;
  return `${sanitized.slice(0, 200)}-${Math.abs(h).toString(36)}`;
}
function claudeCodeSessionPath(cwd, sessionId) {
  let resolved2 = cwd;
  try {
    resolved2 = (0, import_node_fs11.realpathSync)(cwd);
  } catch {
  }
  return (0, import_node_path11.join)((0, import_node_os3.homedir)(), ".claude", "projects", projectSlug(resolved2), `${sessionId}.jsonl`);
}
async function backupClaudeCodeSession(sessionId, cwd, backupUrl, stepId) {
  if (!backupUrl) return;
  try {
    const sdk = await getClaudeCodeSDK();
    const entries = [];
    const store = {
      append: async (_key, batch) => {
        entries.push(...batch);
      },
      load: async () => null
    };
    await sdk.importSessionToStore(sessionId, store, { dir: cwd, includeSubagents: false });
    if (!entries.length) return;
    await uploadMirror(backupUrl, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
  } catch (err) {
    console.warn(`[step] ${stepId} claude-code session backup failed:`, err.message);
  }
}
async function hydrateClaudeCodeSession(sessionId, cwd, restoreUrl, stepId) {
  if (!restoreUrl) return;
  const target = claudeCodeSessionPath(cwd, sessionId);
  if ((0, import_node_fs11.existsSync)(target)) return;
  try {
    const res = await fetch(restoreUrl, { signal: AbortSignal.timeout(TIMEOUTS_MS.r2Download) });
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return;
    await (0, import_promises5.mkdir)((0, import_node_path11.dirname)(target), { recursive: true });
    await (0, import_promises5.writeFile)(target, buf);
    console.log(`[step] ${stepId} hydrated claude-code session ${sessionId} from R2`);
  } catch (err) {
    console.warn(`[step] ${stepId} claude-code session hydrate failed:`, err.message);
  }
}
async function resetClaudeCodeSession(sessionId, cwd, backupUrl, stepId) {
  try {
    const sdk = await getClaudeCodeSDK();
    await sdk.deleteSession(sessionId, { dir: cwd }).catch(() => {
    });
  } catch (err) {
    console.warn(`[step] ${stepId} claude-code session delete failed:`, err.message);
  }
  if (!backupUrl) return;
  try {
    await blankMirror(backupUrl);
  } catch (err) {
    console.warn(`[step] ${stepId} claude-code session R2 blank failed:`, err.message);
  }
}

// src/lib/externalTurn.ts
var import_node_crypto3 = require("node:crypto");

// src/lib/framePump.ts
function createFramePump(postFrame, onStop) {
  let fullText = "";
  let liveText = "";
  let modelStarted = false;
  let retryActive = false;
  const queue = [];
  let pumping = false;
  let pump = Promise.resolve();
  const runPump = async () => {
    try {
      while (queue.length) {
        const res = await postFrame(queue.shift());
        if (res.stop) onStop();
        if (queue.length) await new Promise((r) => setTimeout(r, POST_PACING_MS));
      }
    } finally {
      pumping = false;
    }
  };
  const push = (body) => {
    if (body.type === "retry") retryActive = body.attempt > 0;
    else if (retryActive) push({ type: "retry", attempt: 0, maxAttempts: 0 });
    if (!modelStarted && body.type !== "retry") {
      modelStarted = true;
      queue.push({ type: "stage", stage: "model", state: "done" });
    }
    const kind = mergeKind(body);
    const last = queue[queue.length - 1];
    if (kind && last && mergeKind(last) === kind) {
      last.text = last.text + body.text;
      return;
    }
    queue.push(body);
    if (!pumping) {
      pumping = true;
      pump = runPump();
    }
  };
  return {
    text: (delta) => {
      liveText += delta;
      push({ text: delta });
    },
    // The finished message: stream whatever the deltas didn't carry, then fold it into the record.
    textDone: (full) => {
      if (full !== liveText && full.startsWith(liveText)) push({ text: full.slice(liveText.length) });
      fullText += full;
      liveText = "";
    },
    // A paragraph break ahead of a further message in the same turn, so two don't run together.
    gap: () => {
      if (!fullText || fullText.endsWith("\n")) return;
      fullText += "\n\n";
      push({ text: "\n\n" });
    },
    thinking: (delta) => push({ type: "thinking", text: delta }),
    toolStart: (toolName, detail2) => push({ type: "tool_start", toolName, detail: detail2 }),
    retry: (attempt, maxAttempts) => push({ type: "retry", attempt, maxAttempts }),
    // The provider answered: takes a standing retry status down ahead of the first output frame.
    retryDone: () => {
      if (retryActive) push({ type: "retry", attempt: 0, maxAttempts: 0 });
    },
    getFullText: () => fullText || liveText,
    modelStarted: () => modelStarted,
    idle: async () => {
      await pump;
    }
  };
}
function messageBuffer(pump) {
  let message = "";
  return {
    chunk(t) {
      if (!message) pump.gap();
      message += t;
      pump.text(t);
    },
    close() {
      if (message) pump.textDone(message);
      message = "";
    },
    // Retracted: the chunks already streamed stay on screen, but the message is never finished.
    drop() {
      message = "";
    },
    open: () => message.length > 0
  };
}
function detail(input, ...keys) {
  if (!input || typeof input !== "object") return "";
  for (const k of keys) {
    const v = input[k];
    if (typeof v === "string" && v) return v;
    if (Array.isArray(v) && typeof v[0] === "string" && v[0]) return v[0];
  }
  return "";
}

// src/lib/externalTurn.ts
var REVIEW_NOTE = "This is a read-only review turn: inspect the repository and answer, but do not create, modify or delete any file.";
var turnInstructions = (step, ephemeral) => [step.systemPrompt, step.appendSystemPrompt, ephemeral ? REVIEW_NOTE : ""].filter(Boolean).join("\n\n");
var instructionsStamp = (instructions) => (0, import_node_crypto3.createHash)("sha256").update(instructions).digest("hex").slice(0, 16);
var withInstructions = (instructions, text3) => `<system_instructions>
These come from the platform running you, not from the user, and hold for the whole conversation; a later copy replaces an earlier one.

${instructions}
</system_instructions>

${text3}`;
async function runSteeredTurns(ctx, step, io) {
  const backlog = [];
  let active = false;
  let chain = Promise.resolve();
  ctx.setSteerSink((entries) => {
    for (const entry of entries) {
      chain = chain.then(async () => {
        if (!active) {
          backlog.push(entry);
          return;
        }
        const input = await io.prepare(entry.text, entry.images ?? []);
        try {
          if (!await io.inject(input)) backlog.push(entry);
        } catch (err) {
          console.warn(`[step] ${step.stepId} steer failed:`, err.message);
        }
      }).catch((err) => console.error(`[step] ${step.stepId} steer inject failed:`, err.message));
    }
  });
  const turn = async (input) => {
    active = true;
    ctx.setSteerOpen(true);
    try {
      return await io.turn(input);
    } finally {
      active = false;
      ctx.setSteerOpen(false);
    }
  };
  const gathered = backlog.splice(0);
  let text3 = [step.prompt, ...gathered.map((e) => e.text)].join("\n\n");
  let images = [...step.images ?? [], ...gathered.flatMap((e) => e.images ?? [])];
  while (!ctx.interrupted()) {
    if (!await turn(await io.prepare(text3, images))) return;
    await ctx.pump.idle();
    await ctx.settle();
    await chain;
    if (!backlog.length) return;
    const entries = backlog.splice(0);
    text3 = entries.map((e) => e.text).join("\n\n");
    images = entries.flatMap((e) => e.images ?? []);
  }
}
function externalStep(driver) {
  return (step, serverUrl, token) => runExternalTurn(step, serverUrl, token, driver(step, serverUrl, token));
}
async function runExternalTurn(step, serverUrl, token, driver) {
  const { stepId, conversationId } = step;
  const done = makeDone(step, serverUrl, token);
  const refreshUploadUrls = makeUploadUrlRefresh(serverUrl, token, stepId);
  const ephemeral = step.mode !== "persistent_turn";
  const backlog = [];
  let sink = (entries) => {
    backlog.push(...entries);
  };
  const lane = createFrameLane(serverUrl, token, stepId, (entries) => sink(entries));
  let interrupted = false;
  let stop = () => {
  };
  const stopTurn = () => {
    interrupted = true;
    stop();
  };
  const heartbeat = startHeartbeat(serverUrl, stepId, stopTurn, token, { onSteer: (entries) => sink(entries), body: lane.pollBody });
  const pump = createFramePump(lane.postFrame, stopTurn);
  const ctx = {
    cwd: process.cwd(),
    ephemeral,
    pump,
    setSteerSink: (next) => {
      sink = next;
      if (backlog.length) next(backlog.splice(0));
    },
    setSteerOpen: lane.setSteerOpen,
    onStop: (fn) => {
      stop = fn;
    },
    settle: heartbeat.settle,
    interrupted: () => interrupted,
    refreshSessionBackupUrl: () => refreshUploadUrls().then((r) => r?.sessionBackupUrl)
  };
  let outcome = {};
  let checkpoint = {};
  const captureCheckpoint = async () => {
    await discardReadOnlyTurn(step, ctx.cwd);
    if (ephemeral || !step.workspace) return;
    const credential = makePushCredential(serverUrl, token, stepId, step.workspace);
    checkpoint = await captureTurnCheckpoint(ctx.cwd, step, step.workspace, credential, pump.getFullText(), makeChangesUpload(serverUrl, token, stepId));
  };
  const turnReport = () => ({
    ...checkpointReport(checkpoint),
    ...ephemeral ? {} : { sessionLeafEntryId: outcome.leafId },
    ...outcome.modelCalls ? { modelCalls: outcome.modelCalls } : {},
    ...outcome.contextUsage ? { contextUsage: outcome.contextUsage } : {}
  });
  const checkpointFailedTurn = () => captureCheckpoint().catch((e) => console.error(`[step] ${stepId} failed-turn checkpoint:`, e.message));
  try {
    const missing2 = driver.missing();
    if (missing2) {
      await done({ error: missing2 });
      return;
    }
    void lane.postFrame({ type: "stage", stage: "prepare", state: "start" });
    const onGitRetry = (attempt, maxAttempts) => void lane.postFrame({ type: "retry", attempt, maxAttempts });
    try {
      if (step.workspace) ctx.cwd = await prepareConversationWorkspace(conversationId, step.workspace, { onRetry: onGitRetry });
    } catch (err) {
      await done({ error: `Workspace preparation failed: ${err.message}` });
      return;
    }
    void lane.postFrame({ type: "stage", stage: "prepare", state: "done" });
    void lane.postFrame({ type: "stage", stage: "model", state: "start" });
    try {
      outcome = await driver.run(ctx);
    } finally {
      lane.setSteerOpen(false);
    }
    await pump.idle();
    if (!pump.modelStarted()) void lane.postFrame({ type: "stage", stage: "model", state: "done" });
    const text3 = pump.getFullText();
    if (outcome.error && !text3) {
      await checkpointFailedTurn();
      await done({ error: outcome.error, ...turnReport() });
    } else {
      await captureCheckpoint();
      await done({ text: text3, ...turnReport() });
    }
  } catch (err) {
    await pump.idle().catch(() => {
    });
    if (interrupted) {
      console.log(`[step] ${stepId} interrupted \u2014 saving partial content`);
      await checkpointFailedTurn();
      await done({ text: pump.getFullText(), ...turnReport() });
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[step] ${stepId} ${step.runtime} failed:`, msg);
      await checkpointFailedTurn();
      await done({ error: msg, ...turnReport() });
    }
  } finally {
    if (!ephemeral && driver.backup) deferTurnWork(conversationId, () => driver.backup(ctx));
    if (step.workspace) {
      const reap = deferTurnWork(conversationId, async () => {
        if (deferredTurnWork.get(conversationId) !== reap) return;
        await reapWorkspaceStrays(ctx.cwd, stepId);
      });
    }
    heartbeat.stop();
  }
}

// src/lib/toolsBridge.ts
var import_node_fs12 = require("node:fs");
var import_node_os4 = require("node:os");
var import_node_path12 = require("node:path");
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_stdio2 = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_types7 = require("@modelcontextprotocol/sdk/types.js");

// src/lib/daemon.ts
var import_child_process2 = require("child_process");
var import_fs4 = require("fs");

// src/lib/log.ts
var installed2 = false;
function installTimestampedLogging() {
  if (installed2) return;
  installed2 = true;
  const stamp = () => `[${(/* @__PURE__ */ new Date()).toISOString()}]`;
  for (const method of ["log", "info", "warn", "error", "debug"]) {
    const orig = console[method].bind(console);
    console[method] = (...args2) => orig(stamp(), ...args2);
  }
}

// src/lib/flagParser.ts
var REPEATABLE = /* @__PURE__ */ new Set(["model"]);
function stripFlags(args2, drop) {
  return args2.filter((a) => !drop.has(a));
}
function parseFlags(args2, shortFlags = {}) {
  const flags = {};
  const repeated = {};
  const bools = {};
  const positionals = [];
  for (let i = 0; i < args2.length; i++) {
    const a = args2[i];
    if (!a.startsWith("--")) {
      const short = a.startsWith("-") ? shortFlags[a.slice(1)] : void 0;
      if (short) {
        bools[short] = true;
        continue;
      }
      positionals.push(a);
      continue;
    }
    const body = a.slice(2);
    const eqIdx = body.indexOf("=");
    if (eqIdx !== -1) {
      const key = body.slice(0, eqIdx);
      const val = body.slice(eqIdx + 1);
      assign(key, val, flags, repeated);
      continue;
    }
    if (body.startsWith("no-")) {
      bools[body.slice(3)] = false;
      continue;
    }
    const next = args2[i + 1];
    if (next === void 0 || next.startsWith("--")) {
      bools[body] = true;
      continue;
    }
    assign(body, next, flags, repeated);
    i++;
  }
  return { flags, repeated, bools, positionals };
}
function assign(key, value, flags, repeated) {
  if (REPEATABLE.has(key)) {
    if (!repeated[key]) repeated[key] = [];
    repeated[key].push(value);
  } else {
    flags[key] = value;
  }
}

// src/lib/daemon.ts
var LOG_CAP = 10 * 1024 * 1024;
var STOP_GRACE_MS = 6e3;
var EXIT_TERMINAL = 78;
function daemonStatePath() {
  return tdsPath("daemon.json");
}
function logPath() {
  return tdsPath("daemon.log");
}
function readDaemon() {
  const p = daemonStatePath();
  if (!(0, import_fs4.existsSync)(p)) return null;
  try {
    const s = JSON.parse((0, import_fs4.readFileSync)(p, "utf-8"));
    if (typeof s.pid === "number") {
      return { pid: s.pid, startedAt: s.startedAt ?? 0, runner: s.runner === "desktop" ? "desktop" : "cli", ...typeof s.version === "string" && { version: s.version } };
    }
  } catch {
  }
  return null;
}
function writeDaemon(state) {
  (0, import_fs4.mkdirSync)(tdsDir(), { recursive: true });
  (0, import_fs4.writeFileSync)(daemonStatePath(), JSON.stringify(state, null, 2));
}
function clearDaemon() {
  try {
    (0, import_fs4.rmSync)(daemonStatePath());
  } catch {
  }
}
function isAlive(pid) {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
var delay = (ms) => new Promise((r) => setTimeout(r, ms));
function killDaemon(pid, force) {
  if (process.platform === "win32") {
    (0, import_child_process2.spawnSync)("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  } else {
    process.kill(pid, force ? "SIGKILL" : "SIGTERM");
  }
}
async function stopDaemon() {
  const d = readDaemon();
  if (!d || !isAlive(d.pid)) {
    if (d) clearDaemon();
    return "not_running";
  }
  try {
    killDaemon(d.pid, false);
  } catch {
  }
  const deadline = Date.now() + STOP_GRACE_MS;
  while (Date.now() < deadline && isAlive(d.pid)) await delay(150);
  let result = "stopped";
  if (isAlive(d.pid)) {
    result = "killed";
    try {
      killDaemon(d.pid, true);
    } catch {
    }
  }
  clearDaemon();
  return result;
}
function rotateLogIfBig(cap2 = LOG_CAP) {
  const p = logPath();
  try {
    if (!(0, import_fs4.existsSync)(p) || (0, import_fs4.statSync)(p).size < cap2) return;
    (0, import_fs4.copyFileSync)(p, p + ".1");
    (0, import_fs4.truncateSync)(p, 0);
  } catch {
  }
}
function openLogFd() {
  (0, import_fs4.mkdirSync)(tdsDir(), { recursive: true });
  return (0, import_fs4.openSync)(logPath(), "a");
}
var selfArgs = (command2, ...extra) => [...process.execArgv, process.argv[1], command2, ...extra];
function spawnDetachedSelf(command2, args2) {
  rotateLogIfBig();
  const logFd = openLogFd();
  try {
    const child = (0, import_child_process2.spawn)(process.execPath, selfArgs(command2, ...args2), {
      cwd: tdsDir(),
      detached: true,
      stdio: ["ignore", logFd, logFd]
    });
    child.unref();
    return child.pid;
  } finally {
    (0, import_fs4.closeSync)(logFd);
  }
}
var MODE_FLAGS = /* @__PURE__ */ new Set(["--supervisor", "--foreground", "-f"]);
var userFlagsOnly = (args2) => stripFlags(args2, MODE_FLAGS);
function forwardToLog(src, dest) {
  src?.on("data", (d) => dest.write(d));
  src?.on("error", () => {
  });
}
async function drainWorkerPipes(c) {
  const closed = (s) => new Promise((resolve6) => {
    if (!s || s.closed) resolve6();
    else s.once("close", resolve6);
  });
  await Promise.race([Promise.all([closed(c.stdout), closed(c.stderr)]), delay(1e3)]);
}
var INITIAL_BACKOFF_MS = 1e3;
var MAX_BACKOFF_MS = 3e4;
var STABLE_MS = 6e4;
function restartDecision(code, uptimeMs, backoffMs) {
  if (code === EXIT_TERMINAL) return { kind: "terminal" };
  const delayMs = uptimeMs >= STABLE_MS ? INITIAL_BACKOFF_MS : backoffMs;
  return { kind: "restart", delayMs, nextBackoffMs: Math.min(delayMs * 2, MAX_BACKOFF_MS) };
}
async function runSupervisor(args2) {
  installTimestampedLogging();
  const userArgs = userFlagsOnly(args2);
  let shuttingDown = false;
  let child = null;
  let lastChild = null;
  let backoff = INITIAL_BACKOFF_MS;
  const rotateTimer = setInterval(() => rotateLogIfBig(), 5 * 6e4);
  rotateTimer.unref();
  const onSignal = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(rotateTimer);
    if (child) {
      child.kill("SIGTERM");
      const c = child;
      setTimeout(() => {
        try {
          c.kill("SIGKILL");
        } catch {
        }
      }, 5e3).unref();
    }
  };
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
  console.log(`[supervisor] online (pid ${process.pid}); supervising worker`);
  while (!shuttingDown) {
    const startedAt = Date.now();
    child = (0, import_child_process2.spawn)(process.execPath, selfArgs("start", "--foreground", ...userArgs), {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    forwardToLog(child.stdout, process.stdout);
    forwardToLog(child.stderr, process.stderr);
    const code = await new Promise((resolve6) => {
      child.on("exit", (c, sig) => resolve6(c ?? (sig ? 128 : 0)));
    });
    lastChild = child;
    child = null;
    if (shuttingDown) break;
    const next = restartDecision(code, Date.now() - startedAt, backoff);
    if (next.kind === "terminal") {
      console.error("[supervisor] worker hit a terminal condition (not registered / revoked); not restarting.");
      break;
    }
    console.warn(`[supervisor] worker exited (code ${code}); restarting in ${Math.round(next.delayMs / 1e3)}s`);
    await delay(next.delayMs);
    backoff = next.nextBackoffMs;
  }
  if (lastChild) await drainWorkerPipes(lastChild);
  clearDaemon();
  console.log("[supervisor] stopped");
  process.exit(0);
}

// src/lib/toolsBridge.ts
var BRIDGE_SERVER_NAME = "tds";
var LOCAL_BRIDGED = ["git", "push_branch"];
var selfEnv = () => ({
  ...process.versions.electron ? { ELECTRON_RUN_AS_NODE: "1" } : {},
  ...process.env.LD_LIBRARY_PATH ? { LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH } : {}
});
function stagedBridge(step, cwd, renamed) {
  const tools = step.tools.filter((t) => LOCAL_BRIDGED.includes(t));
  if (!step.remoteTools?.length && !tools.length) return null;
  return { step: { stepId: step.stepId, conversationId: step.conversationId, workspace: step.workspace, tools, remoteTools: step.remoteTools }, cwd, ...renamed ? { renamed } : {} };
}
function stageToolsBridge(step, serverUrl, token, cwd, renamed) {
  const staged = stagedBridge(step, cwd, renamed);
  if (!staged) return null;
  const file2 = (0, import_node_path12.join)((0, import_node_os4.tmpdir)(), `tds-tools-${step.stepId}.json`);
  (0, import_node_fs12.rmSync)(file2, { force: true });
  (0, import_node_fs12.writeFileSync)(file2, JSON.stringify(staged), { mode: 384 });
  return {
    spawn: {
      command: process.execPath,
      args: selfArgs("mcp-bridge"),
      env: { ...selfEnv(), TDS_BRIDGE_SERVER: serverUrl, TDS_BRIDGE_TOKEN: token, TDS_BRIDGE_TOOLS: file2 }
    },
    tools: bridgeTools(staged, serverUrl, token).map((t) => t.name),
    cleanup: () => (0, import_node_fs12.rmSync)(file2, { force: true })
  };
}
function bridgeTools({ step, cwd, renamed }, serverUrl, token) {
  const s = step;
  const tools = [
    ...makeRemoteTools(serverUrl, token, s),
    ...step.tools.includes("git") ? [makeRepoGitTool(serverUrl, token, s)] : [],
    ...step.tools.includes("push_branch") && step.workspace ? [makePushBranchTool(cwd, s, makePushCredential(serverUrl, token, step.stepId, step.workspace))] : []
  ];
  return tools.map((t) => renamed?.[t.name] ? { ...t, name: renamed[t.name] } : t);
}
function createBridgeServer(tools, onListed) {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const server = new import_server.Server({ name: BRIDGE_SERVER_NAME, version: getVersion() }, { capabilities: { tools: {} } });
  server.setRequestHandler(import_types7.ListToolsRequestSchema, async () => {
    onListed?.();
    return { tools: tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.parameters })) };
  });
  server.setRequestHandler(import_types7.CallToolRequestSchema, async ({ params }, extra) => {
    const tool = byName.get(params.name);
    if (!tool) return { content: [{ type: "text", text: `Unknown tool: ${params.name}` }], isError: true };
    const result = await tool.execute(String(extra.requestId), params.arguments ?? {}, extra.signal, void 0, void 0);
    return { content: result.content.map((c) => ({ type: "text", text: c.type === "text" ? c.text.replace(new RegExp("\\p{Cs}", "gu"), "") : `[${c.type} omitted]` })) };
  });
  return server;
}
var BRIDGE_LISTED_ENV = "TDS_BRIDGE_LISTED";
async function serveToolsBridge(env = process.env) {
  const { TDS_BRIDGE_SERVER: serverUrl, TDS_BRIDGE_TOKEN: token, TDS_BRIDGE_TOOLS: file2, [BRIDGE_LISTED_ENV]: listed } = env;
  if (!serverUrl || !token || !file2) throw new Error("mcp-bridge is spawned by a turn on this machine, not run by hand");
  const tools = bridgeTools(JSON.parse((0, import_node_fs12.readFileSync)(file2, "utf8")), serverUrl, token);
  const server = createBridgeServer(tools, listed ? () => {
    try {
      (0, import_node_fs12.writeFileSync)(listed, "");
    } catch {
    }
  } : void 0);
  const closed = new Promise((resolve6) => {
    server.onclose = resolve6;
  });
  await server.connect(new import_stdio2.StdioServerTransport());
  await closed;
}

// src/lib/externalMcpServers.ts
function turnMcpServers(step, serverUrl, token, cwd, renamed) {
  const bridge = stageToolsBridge(step, serverUrl, token, cwd, renamed);
  return { servers: externalMcpServers(step, bridge?.spawn), bridgeTools: bridge?.tools ?? [], cleanup: () => bridge?.cleanup() };
}
function externalMcpServers(step, bridge) {
  const creds = new Map((step.mcpServerCredentials ?? []).map((c) => [c.id, c.credential]));
  const team = (step.mcpServers ?? []).flatMap((ref) => {
    const cred = creds.get(ref.id);
    if (!cred || ref.slug === BRIDGE_SERVER_NAME) {
      console.warn(`[mcp] ${ref.slug}: skipped \u2014 ${cred ? "the name is the bridge's" : "no credential resolved at claim"}`);
      return [];
    }
    if (ref.transport === "http") return ref.url ? [{ name: ref.slug, transport: "http", url: ref.url, headers: cred.type === "http" ? cred.headers : {} }] : [];
    return ref.command ? [{ name: ref.slug, transport: "stdio", command: ref.command, args: ref.args ?? [], env: cred.type === "stdio" ? cred.env : {} }] : [];
  });
  return [...bridge ? [{ name: BRIDGE_SERVER_NAME, transport: "stdio", ...bridge }] : [], ...team];
}
var claudeCodeMcpServers = (servers) => Object.fromEntries(servers.map((s) => [
  s.name,
  s.transport === "http" ? { type: "http", url: s.url, headers: s.headers } : { type: "stdio", command: s.command, args: s.args, env: s.env }
]));
var copilotMcpServers = claudeCodeMcpServers;
var codexMcpServers = (servers) => Object.fromEntries(servers.map((s) => [
  s.name,
  s.transport === "http" ? { url: s.url, http_headers: s.headers } : { command: s.command, args: s.args, env: s.env }
]));
var pairs = (o) => Object.entries(o).map(([name, value]) => ({ name, value }));
var acpMcpServers = (servers) => servers.map((s) => s.transport === "http" ? { type: "http", name: s.name, url: s.url, headers: pairs(s.headers) } : { name: s.name, command: s.command, args: s.args, env: pairs(s.env) });
var droidMcpServers = (servers) => servers.map((s) => s.transport === "http" ? { type: "http", name: s.name, url: s.url, headers: pairs(s.headers) } : { name: s.name, command: s.command, args: s.args, env: s.env });
var antigravityMcpServers = (servers, eager) => Object.fromEntries(servers.map((s) => [
  s.name,
  s.transport === "http" ? { serverUrl: s.url, headers: s.headers } : { command: s.command, args: s.args, env: s.env, ...s.name === BRIDGE_SERVER_NAME ? { tools: Object.fromEntries(eager.map((t) => [t, { eager: true }])) } : {} }
]));
var opencodeMcpServers = (servers) => Object.fromEntries(servers.map((s) => [
  s.name,
  s.transport === "http" ? { type: "remote", url: s.url, headers: s.headers, oauth: false, codemode: false } : { type: "local", command: [s.command, ...s.args], environment: s.env, codemode: false }
]));
var clineMcpServers = (servers) => ({ mcpServers: Object.fromEntries(servers.map((s) => [
  s.name,
  s.transport === "http" ? { transport: { type: "streamableHttp", url: s.url, headers: s.headers } } : { transport: { type: "stdio", command: s.command, args: s.args, env: s.env } }
])) });

// src/lib/claude-code/execute.ts
var NO_BACKGROUND_ENV = { CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: "1" };
var WAKEUP_TOOLS = ["ScheduleWakeup", "CronCreate", "CronDelete", "CronList", "Monitor"];
async function userMessage(text3, images, stepId) {
  const downloaded = await downloadImages(images, stepId);
  const content = downloaded.length ? [
    ...downloaded.map((i) => ({ type: "image", source: { type: "base64", media_type: i.mimeType, data: i.data } })),
    { type: "text", text: text3 }
  ] : text3;
  return { type: "user", message: { role: "user", content }, parent_tool_use_id: null };
}
function usageFromResult(resultMsg, lastAssistantUsage, thinkingLevel) {
  const mu = resultMsg?.modelUsage;
  const modelCalls2 = mu ? Object.entries(mu).map(([modelId, u]) => ({
    provider: "claude-code",
    modelId: u.canonicalModel ?? modelId,
    thinkingLevel: thinkingLevel ?? "",
    usage: {
      inputTokens: u.inputTokens ?? 0,
      outputTokens: u.outputTokens ?? 0,
      cacheReadTokens: u.cacheReadInputTokens ?? 0,
      cacheWriteTokens: u.cacheCreationInputTokens ?? 0,
      costUsd: u.costUSD ?? 0
    }
  })) : [];
  const num = (v) => typeof v === "number" ? v : 0;
  const contextWindow = mu ? Math.max(0, ...Object.values(mu).map((u) => u.contextWindow ?? 0)) : 0;
  const tokens = lastAssistantUsage ? num(lastAssistantUsage.input_tokens) + num(lastAssistantUsage.cache_read_input_tokens) + num(lastAssistantUsage.cache_creation_input_tokens) + num(lastAssistantUsage.output_tokens) : null;
  return {
    ...modelCalls2.length ? { modelCalls: modelCalls2 } : {},
    ...contextWindow > 0 && tokens !== null ? { contextUsage: { tokens, contextWindow } } : {}
  };
}
function claudeCodeDriver(step, serverUrl, token) {
  const { stepId } = step;
  let claudeSessionId = null;
  return {
    // The user's own Claude Code (sign-in included), never a bundled binary.
    missing: () => resolveClaudeCodeExecutable() ? null : CLAUDE_CODE_MISSING,
    async run(ctx) {
      const sdk = await getClaudeCodeSDK();
      const { cwd, ephemeral } = ctx;
      let session3 = {};
      if (!ephemeral) {
        claudeSessionId = claudeSessionUuid(step.sessionId);
        let existing = await sdk.getSessionMessages(claudeSessionId, { dir: cwd, limit: 1 }).catch(() => []);
        if (!existing.length && step.sessionRestoreUrl) {
          await hydrateClaudeCodeSession(claudeSessionId, cwd, step.sessionRestoreUrl, stepId);
          existing = await sdk.getSessionMessages(claudeSessionId, { dir: cwd, limit: 1 }).catch(() => []);
        }
        session3 = existing.length ? { resume: claudeSessionId, ...step.resumeSessionAt ? { resumeSessionAt: step.resumeSessionAt } : {} } : { sessionId: claudeSessionId };
      }
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const mcpServers = claudeCodeMcpServers(mcp.servers);
      const bridge = createSteerBridge((entry) => userMessage(entry.text, entry.images, stepId));
      ctx.setSteerSink(bridge.steer);
      const root = process.getuid?.() === 0;
      const env = { ...process.env, ...step.secretEnv, ...NO_BACKGROUND_ENV, ...root ? { IS_SANDBOX: "1" } : {} };
      const q = sdk.query({
        prompt: bridge.messages(await userMessage(step.prompt, step.images, stepId)),
        options: {
          cwd,
          pathToClaudeCodeExecutable: resolveClaudeCodeExecutable(),
          ...session3,
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          env,
          // The machine's own Claude Code carries its owner's config. The agent works for the team on
          // whichever machine picks the turn, so only what the repo checks in reaches it: project
          // CLAUDE.md, skills and settings — not ~/.claude (user) or settings.local.json (local), and
          // no MCP servers beyond the ones passed here (none of the owner's ~/.claude.json, .mcp.json
          // or plugin servers were granted to this agent).
          settingSources: ["project"],
          strictMcpConfig: true,
          ...Object.keys(mcpServers).length ? { mcpServers } : {},
          enableFileCheckpointing: true,
          includePartialMessages: true,
          maxTurns: 200,
          // Review and plan-track turns are read-only — pi's toolset has no write/edit there (bash
          // stays, as there); the worktree reset after the turn backs it either way.
          disallowedTools: [...WAKEUP_TOOLS, ...ephemeral || step.readOnly ? ["Write", "Edit", "NotebookEdit"] : []],
          ...step.agent.modelId ? { model: step.agent.modelId } : {},
          ...step.agent.thinkingLevel ? { effort: step.agent.thinkingLevel } : {},
          ...step.systemPrompt ? { systemPrompt: step.systemPrompt } : step.appendSystemPrompt ? { systemPrompt: { type: "preset", preset: "claude_code", append: step.appendSystemPrompt } } : {}
        }
      });
      ctx.onStop(() => q.close());
      let resultMsg = null;
      let lastAssistantUsage = null;
      let leafUuid;
      try {
        for await (const raw of q) {
          const msg = raw;
          handleClaudeCodeMessage(msg, ctx.pump);
          if ((msg.type === "assistant" || msg.type === "user") && typeof msg.uuid === "string") leafUuid = msg.uuid;
          if (msg.type === "assistant") {
            const usage = msg.message?.usage;
            if (usage) lastAssistantUsage = usage;
          }
          if (msg.type === "result") {
            if (msg.origin?.kind === "task-notification") continue;
            resultMsg = msg;
            await ctx.settle();
            if (await bridge.pending() > 0) continue;
            break;
          }
        }
      } finally {
        bridge.close();
        q.close();
        mcp.cleanup();
      }
      const error = resultMsg?.is_error ? String(resultMsg.error ?? resultMsg.result ?? "Claude Code returned an error") : void 0;
      return { error, leafId: leafUuid, ...usageFromResult(resultMsg, lastAssistantUsage, step.agent.thinkingLevel) };
    },
    backup: (ctx) => claudeSessionId ? backupClaudeCodeSession(claudeSessionId, ctx.cwd, step.sessionBackupUrl, stepId) : Promise.resolve()
  };
}
var executeClaudeCodeStep = externalStep(claudeCodeDriver);
async function rewindClaudeCodeSession(step) {
  if (step.restore?.sessionLeafEntryId || !step.sessionId) return;
  await resetClaudeCodeSession(claudeSessionUuid(step.sessionId), claudeCodeCwd(step), step.sessionBackupUrl, step.stepId);
}

// src/lib/claude-code/usage.ts
var import_node_path14 = require("node:path");

// src/lib/runtimeHome.ts
var import_node_fs13 = require("node:fs");
var import_node_path13 = require("node:path");
function runtimeHome(name, dirs) {
  const home = tdsPath(name);
  for (const dir of dirs) (0, import_node_fs13.mkdirSync)((0, import_node_path13.join)(home, dir), { recursive: true });
  return home;
}
var workdir = (home) => (0, import_node_path13.join)(home, "workdir");
var sessionHome = (home, sessionId) => (0, import_node_path13.join)(home, "sessions", sessionId);
var turnHome = (home, stepId) => (0, import_node_path13.join)(home, "turns", stepId);
var probeHome = (home) => (0, import_node_path13.join)(home, "probe");
function ensureConfig(home, file2, content) {
  const path = (0, import_node_path13.join)(home, file2);
  if (!(0, import_node_fs13.existsSync)(path)) (0, import_node_fs13.writeFileSync)(path, content);
}
function linkAuth(source, home, label) {
  const auth = (0, import_node_path13.join)(home, (0, import_node_path13.basename)(source));
  const existing = lstat(auth);
  if (existing?.isSymbolicLink()) return;
  if (existing && existing.mtimeMs >= (0, import_node_fs13.statSync)(source).mtimeMs) return;
  if (existing) (0, import_node_fs13.rmSync)(auth);
  try {
    (0, import_node_fs13.symlinkSync)(source, auth);
  } catch (err) {
    console.warn(`[${label}] ${(0, import_node_path13.basename)(source)} symlink failed (${err.message}) \u2014 copying instead; a refreshed token will not propagate`);
    (0, import_node_fs13.copyFileSync)(source, auth);
  }
}
function lstat(path) {
  try {
    return (0, import_node_fs13.lstatSync)(path);
  } catch {
    return null;
  }
}

// src/lib/usageProbe.ts
var import_node_child_process4 = require("node:child_process");
var SIGNED_OUT = { status: "signed_out", account: null, windows: [] };
var noLimits = (account) => ({ status: "no_limits", account, windows: [] });
function jsonObjectIn(text3) {
  return JSON.parse(text3.slice(text3.indexOf("{"), text3.lastIndexOf("}") + 1));
}
function cliOutput(bin, args2, opts) {
  const options = { cwd: opts.cwd, env: opts.env, timeout: opts.timeoutMs, signal: opts.signal, maxBuffer: opts.maxBuffer, windowsHide: true, shell: process.platform === "win32" && bin.endsWith(".cmd") };
  return new Promise((resolve6) => {
    const child = (0, import_node_child_process4.execFile)(bin, args2, options, (err, stdout, stderr) => resolve6({ failed: !!err, stdout: String(stdout), stderr: String(stderr) || err?.message || "" }));
    child.stdin?.end();
  });
}
var pct = (v) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null;
var msFromIso = (v) => {
  const ms = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(ms) ? ms : null;
};
var msFromSeconds = (v) => typeof v === "number" && Number.isFinite(v) ? v * 1e3 : null;
function homeOrSignedOut(ensure, notSignedIn) {
  try {
    return ensure();
  } catch (err) {
    if (err.message === notSignedIn) return null;
    throw err;
  }
}
var REJECTED_ARGS = /unknown (?:flag|argument|command|option)|unrecognized|unexpected argument|无法识别/i;
function outdatedIfRejected(err, outdated) {
  return REJECTED_ARGS.test(err?.message ?? "") ? new Error(outdated) : err;
}
async function withSpawned(signal, stop, run) {
  const onAbort = () => void stop();
  if (signal.aborted) onAbort();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await run();
  } finally {
    signal.removeEventListener("abort", onAbort);
    await stop();
  }
}

// src/lib/claude-code/usage.ts
var WINDOWS = [
  ["five_hour", 300],
  ["seven_day", 10080],
  ["seven_day_opus", 10080],
  ["seven_day_sonnet", 10080],
  ["seven_day_oauth_apps", 10080]
];
var USAGE_UNSUPPORTED = /Unsupported control request subtype: get_usage/;
var CLAUDE_USAGE_OUTDATED = "Claude Code on this machine is too old to report its usage \u2014 update it (`claude update`).";
var signedIn = (account) => !!account.email || !!account.apiKeySource || !!account.apiProvider && account.apiProvider !== "firstParty";
var accountOf = (account, plan) => ({ id: account.email ?? null, email: account.email ?? null, plan: plan ?? account.subscriptionType ?? null });
function outdatedReading(account) {
  if (!signedIn(account)) return SIGNED_OUT;
  return { status: "error", account: accountOf(account, null), windows: [], error: CLAUDE_USAGE_OUTDATED };
}
function readingFromClaudeUsage(account, usage) {
  if (!signedIn(account)) return SIGNED_OUT;
  const acct = accountOf(account, usage.subscription_type);
  const limits = usage.rate_limits;
  if (!usage.rate_limits_available || !limits) return noLimits(acct);
  const windows = [];
  for (const [key, windowMinutes] of WINDOWS) {
    const w = limits[key];
    if (w) windows.push({ key, windowMinutes, utilization: pct(w.utilization), resetsAt: msFromIso(w.resets_at) });
  }
  for (const m of limits.model_scoped ?? []) {
    windows.push({ key: `model:${m.display_name}`, label: m.display_name, windowMinutes: 10080, utilization: pct(m.utilization), resetsAt: msFromIso(m.resets_at) });
  }
  const extra = limits.extra_usage;
  if (extra?.is_enabled) {
    const utilization2 = pct(extra.utilization) ?? (extra.monthly_limit && extra.used_credits != null ? pct(extra.used_credits / extra.monthly_limit * 100) : null);
    if (utilization2 != null) windows.push({ key: "extra_usage", utilization: utilization2, resetsAt: null });
  }
  return { status: "ok", account: acct, windows };
}
function modelsFromClaudeInit(models) {
  return models.map((m) => ({
    id: m.value,
    label: m.displayName || m.value,
    effortLevels: [...m.supportedEffortLevels ?? []],
    ...m.resolvedModel ? { resolvedModel: m.resolvedModel } : {}
  }));
}
function idlePrompt() {
  let release = () => {
  };
  const prompt = {
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise((resolve6) => {
        release = () => resolve6({ done: true, value: void 0 });
      })
    })
  };
  return { prompt, release: () => release() };
}
async function probeClaudeCodeUsage(signal) {
  const bin = resolveClaudeCodeExecutable();
  if (!bin) throw new Error(CLAUDE_CODE_MISSING);
  const sdk = await getClaudeCodeSDK();
  const cwd = (0, import_node_path14.join)(runtimeHome("claude-home", ["workdir"]), "workdir");
  const { prompt, release } = idlePrompt();
  const q = sdk.query({
    prompt,
    options: { cwd, pathToClaudeCodeExecutable: bin, settingSources: [], strictMcpConfig: true, maxTurns: 1 }
  });
  return withSpawned(signal, () => {
    release();
    q.close();
  }, async () => {
    const usage = q.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET().then((value) => ({ value }), (err) => ({ err }));
    const [account, init, asked] = await Promise.all([q.accountInfo(), q.initializationResult(), usage]);
    const models = modelsFromClaudeInit(init.models);
    if ("err" in asked) {
      if (!USAGE_UNSUPPORTED.test(asked.err?.message ?? "")) throw asked.err;
      return { ...outdatedReading(account), models };
    }
    return { ...readingFromClaudeUsage(account, asked.value), models };
  });
}

// src/lib/codex/bin.ts
var SPEC2 = { override: "TDS_CODEX_BIN", command: "codex" };
function resolveCodexExecutable(lookup) {
  return resolveExecutable(SPEC2, lookup);
}
var CODEX_MISSING = "Codex is not installed on this machine \u2014 install it (npm i -g @openai/codex) and sign in (`codex login`), so that `codex` is on PATH; or point TDS_CODEX_BIN at the executable.";

// src/lib/codex/execute.ts
var import_node_fs17 = require("node:fs");

// src/lib/stdioRpc.ts
var import_node_child_process5 = require("node:child_process");
var import_node_readline = require("node:readline");
var STDERR_TAIL_MAX = 32e3;
function isRpcError(err) {
  return err instanceof Error && "rpc" in err;
}
var RpcServerExit = class extends Error {
};
var live = /* @__PURE__ */ new Set();
process.on("exit", () => {
  for (const child of live) killTree(child);
});
function readFrames(stream, onBody) {
  let buffer = Buffer.alloc(0);
  stream.on("data", (chunk) => {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;
    for (; ; ) {
      const head = buffer.indexOf("\r\n\r\n");
      if (head === -1) return;
      const length = Number(/^content-length: *(\d+)/im.exec(buffer.toString("latin1", 0, head))?.[1]);
      const start = head + 4;
      if (Number.isNaN(length)) {
        buffer = buffer.subarray(start);
        continue;
      }
      if (buffer.length < start + length) return;
      onBody(buffer.toString("utf8", start, start + length));
      buffer = buffer.subarray(start + length);
    }
  });
}
function spawnJsonLines(bin, args2, opts, on) {
  const win322 = process.platform === "win32";
  const child = (0, import_node_child_process5.spawn)(bin, args2, {
    cwd: opts.cwd,
    env: opts.env,
    stdio: ["pipe", "pipe", "pipe"],
    // Its own process group, so killTree reaches the tools it spawned.
    detached: !win322,
    windowsHide: true,
    // The npm shim on Windows is a .cmd, which only a shell can start.
    shell: win322 && bin.endsWith(".cmd")
  });
  live.add(child);
  for (const s of [child.stdin, child.stdout, child.stderr]) s?.on("error", () => {
  });
  let stderrTail = "";
  let lastText = "";
  child.stderr?.on("data", (d) => {
    const text3 = String(d).trimEnd();
    console.warn(`[${opts.label}] ${text3}`);
    stderrTail = (stderrTail + text3 + "\n").slice(-STDERR_TAIL_MAX);
    on.stderr?.(text3);
  });
  const exit = waitForExit(child).then(
    (r) => {
      const said = errorLine(stderrTail) || errorLine(lastText);
      return new RpcServerExit(`${opts.label} exited (${r.signal ?? `code ${r.code}`})${r.code && said ? `: ${said}` : ""}`);
    },
    (err) => err
  ).then((err) => {
    on.exit(err);
    live.delete(child);
  });
  const receive = (body) => {
    let msg;
    try {
      msg = JSON.parse(body);
    } catch {
      if (body.trim()) lastText = body;
      on.text?.(body);
      return;
    }
    on.message(msg);
  };
  if (opts.framed) readFrames(child.stdout, receive);
  else (0, import_node_readline.createInterface)({ input: child.stdout }).on("line", receive);
  return {
    child,
    send(msg) {
      if (!child.stdin?.writable) return;
      const body = JSON.stringify(msg);
      child.stdin.write(opts.framed ? `Content-Length: ${Buffer.byteLength(body)}\r
\r
${body}` : body + "\n");
    },
    // Close stdin so the server finishes writing its session and exits; a stuck one is killed.
    async close() {
      child.stdin?.end();
      const kill = setTimeout(() => killTree(child), opts.exitTimeoutMs);
      await exit;
      clearTimeout(kill);
    }
  };
}
function spawnStdioRpc(bin, args2, opts) {
  let nextId = 0;
  const pending = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const waiters = /* @__PURE__ */ new Set();
  let exited = null;
  const send = (type, msg) => server.send({ jsonrpc: "2.0", ...opts.typed ? { ...opts.typed, type } : {}, ...msg });
  const server = spawnJsonLines(bin, args2, opts, {
    text: opts.text,
    exit(err) {
      exited = err;
      for (const p of pending.values()) {
        clearTimeout(p.timer);
        p.reject(err);
      }
      pending.clear();
      for (const w of waiters) w.reject(err);
      waiters.clear();
    },
    message(msg) {
      if (msg.id !== void 0 && msg.method) {
        const reply = opts.autoReply(msg.method, msg.params ?? {});
        send("response", reply ? { id: msg.id, result: reply } : { id: msg.id, error: { code: -32601, message: `unattended: ${msg.method}` } });
        return;
      }
      if (msg.id !== void 0) {
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.error) p.reject(Object.assign(new Error(msg.error.message ?? JSON.stringify(msg.error)), { rpc: msg.error }));
        else p.resolve(msg.result);
        return;
      }
      if (!msg.method) return;
      const n = msg;
      for (const l of listeners) l(n);
      for (const w of waiters) {
        const v = w.pred(n);
        if (v !== void 0) {
          waiters.delete(w);
          w.resolve(v);
        }
      }
    }
  });
  return {
    // timeoutMs 0 = none: a call whose effect is unknown after a timeout (a steer) must not be
    // mistaken for undelivered. Params null goes on the wire (a server whose request takes none
    // reads it as such); undefined leaves the field out.
    call(method, params, timeoutMs = opts.callTimeoutMs) {
      if (exited) return Promise.reject(exited);
      return new Promise((resolve6, reject) => {
        const id = opts.typed ? String(++nextId) : ++nextId;
        const timer = timeoutMs ? setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${opts.label} ${method} timed out after ${timeoutMs}ms`));
        }, timeoutMs) : void 0;
        pending.set(id, { resolve: resolve6, reject, timer });
        send("request", { id, method, params });
      });
    },
    notify(method, params) {
      send("notification", { method, ...params ? { params } : {} });
    },
    onNotification(fn) {
      listeners.add(fn);
    },
    // The first notification the predicate accepts; rejects when the server dies first.
    waitFor(pred) {
      if (exited) return Promise.reject(exited);
      return new Promise((resolve6, reject) => {
        waiters.add({ pred, resolve: resolve6, reject });
      });
    },
    close: server.close
  };
}
function idleWatch(rpc, label, timeoutMs = TIMEOUTS_MS.streamIdle) {
  let timer;
  let tripped = false;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      tripped = true;
      void rpc.close();
    }, timeoutMs);
  };
  rpc.onNotification(() => {
    if (timer) arm();
  });
  return {
    arm,
    disarm: () => {
      clearTimeout(timer);
      timer = void 0;
    },
    error: (err) => tripped ? new Error(`${label} produced nothing for ${timeoutMs / 6e4} minutes`) : err
  };
}

// src/lib/codex/home.ts
var import_node_fs14 = require("node:fs");
var import_node_os5 = require("node:os");
var import_node_path15 = require("node:path");

// src/lib/codex/rpc.ts
function autoReply(method) {
  switch (method) {
    case "item/commandExecution/requestApproval":
    case "item/fileChange/requestApproval":
      return { decision: "decline" };
    case "item/tool/requestUserInput":
      return { answers: {} };
    case "mcpServer/elicitation/request":
      return { action: "decline" };
    case "applyPatchApproval":
    case "execCommandApproval":
      return { decision: { denied: { rejection: "unattended" } } };
    default:
      return null;
  }
}
function spawnAppServer(bin, opts) {
  return spawnStdioRpc(bin, ["app-server", "--listen", "stdio://"], {
    label: "codex",
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env, CODEX_HOME: opts.codexHome },
    autoReply,
    callTimeoutMs: TIMEOUTS_MS.codexRpc,
    exitTimeoutMs: TIMEOUTS_MS.codexExit
  });
}
async function handshake(rpc) {
  await rpc.call("initialize", { clientInfo: { name: "tds", version: getVersion() }, capabilities: null });
  rpc.notify("initialized");
}

// src/lib/codex/home.ts
var CODEX_NOT_SIGNED_IN = "Codex is not signed in on this machine \u2014 run `codex login` first.";
var SETUP_HINTS = [
  [/failed to load configuration/, "This is the agent's Codex config on this machine, not the task: fix that line, or delete the file and tds writes a fresh one."],
  [/\b401 Unauthorized\b/, "Codex on this machine could not sign in to its model provider: run `codex login` there, and if it goes through a relay, name that as `model_provider` in ~/.codex/config.toml there."]
];
function withSetupHint(message) {
  const hint = SETUP_HINTS.find(([pattern]) => pattern.test(message))?.[1];
  return hint ? `${message}

${hint} See https://todos.dev/docs/runtimes` : message;
}
var CONFIG_TOML = `# Written by tds. The agent's Codex home: only auth.json and your model provider are shared with your own ~/.codex.
[features]
apps = false

[apps._default]
enabled = false
`;
function userCodexHome() {
  return process.env.CODEX_HOME || (0, import_node_path15.join)((0, import_node_os5.homedir)(), ".codex");
}
function codexHome() {
  return runtimeHome("codex-home", ["workdir", "tds-threads", "sessions"]);
}
function ensureCodexHome() {
  const home = codexHome();
  ensureConfig(home, "config.toml", CONFIG_TOML);
  const source = (0, import_node_path15.join)(userCodexHome(), "auth.json");
  if (!(0, import_node_fs14.existsSync)(source)) throw new Error(CODEX_NOT_SIGNED_IN);
  linkAuth(source, home, "codex");
  return home;
}
function providerOverride(config) {
  const { model_provider: id, openai_base_url, model_providers } = config;
  const table = id ? model_providers?.[id] : null;
  const picked = { model_provider: id, openai_base_url, model_providers: id && table ? { [id]: table } : null };
  return JSON.parse(JSON.stringify(picked, (_, v) => v ?? void 0));
}
async function userProvider(bin, cwd) {
  const rpc = spawnAppServer(bin, { codexHome: userCodexHome(), cwd });
  try {
    await handshake(rpc);
    return providerOverride((await rpc.call("config/read", {})).config);
  } catch (err) {
    console.warn(`[codex] the user's provider could not be read (${err.message})`);
    return {};
  } finally {
    await rpc.close();
  }
}

// src/lib/codex/session.ts
var import_node_fs16 = require("node:fs");
var import_node_path17 = require("node:path");

// src/lib/runtimeSession.ts
var import_node_fs15 = require("node:fs");
var import_node_path16 = require("node:path");
function sessionMapStore(dir) {
  const path = (sessionId) => (0, import_node_path16.join)(dir, `${sessionId}.json`);
  return {
    read(sessionId) {
      try {
        return JSON.parse((0, import_node_fs15.readFileSync)(path(sessionId), "utf8"));
      } catch {
        return null;
      }
    },
    write(sessionId, map) {
      if (map) atomicWriteFileSync(path(sessionId), JSON.stringify(map));
      else (0, import_node_fs15.rmSync)(path(sessionId), { force: true });
    }
  };
}
async function syncSession(store, codec14, sessionId, restoreUrl, stepId, label) {
  const local = store.read(sessionId);
  if (!restoreUrl) return local;
  try {
    const res = await boundedFetch(restoreUrl, TIMEOUTS_MS.r2Download, local?.etag ? { headers: { "If-None-Match": local.etag } } : {});
    if (res.status === 304 || res.status === 404) return local;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (local) codec14.drop(local);
    const unpacked = body ? codec14.unpack(body) : null;
    const map = unpacked ? { ...unpacked, etag: res.headers.get("etag") ?? void 0 } : null;
    store.write(sessionId, map);
    if (map) console.log(`[step] ${stepId} hydrated ${label} session ${map.id} from R2`);
    return map;
  } catch (err) {
    console.warn(`[step] ${stepId} ${label} session sync failed:`, err.message);
    return local;
  }
}
async function backupSession2(store, codec14, sessionId, backupUrl, refreshUrl, stepId, label) {
  const map = store.read(sessionId);
  if (!backupUrl || !map) return;
  const body = codec14.pack(map);
  if (body === null) return;
  try {
    const etag = await uploadMirror(backupUrl, body, refreshUrl);
    store.write(sessionId, { ...map, etag: etag ?? void 0 });
  } catch (err) {
    console.warn(`[step] ${stepId} ${label} session backup failed:`, err.message);
  }
}
async function resetSession(store, codec14, sessionId, backupUrl, stepId, label) {
  const map = store.read(sessionId);
  if (map) codec14.drop(map);
  store.write(sessionId, null);
  if (!backupUrl) return;
  try {
    await blankMirror(backupUrl);
  } catch (err) {
    console.warn(`[step] ${stepId} ${label} session R2 blank failed:`, err.message);
  }
}
function sessionMirror(label, codec14, mapsDir = "tds-sessions") {
  const maps = (home) => sessionMapStore((0, import_node_path16.join)(home, mapsDir));
  const sync = (home, sessionId, restoreUrl, stepId) => syncSession(maps(home), codec14(home, sessionId), sessionId, restoreUrl, stepId, label);
  const backup = (home, sessionId, backupUrl, refreshUrl, stepId) => backupSession2(maps(home), codec14(home, sessionId), sessionId, backupUrl, refreshUrl, stepId, label);
  const reset = (home, sessionId, backupUrl, stepId) => resetSession(maps(home), codec14(home, sessionId), sessionId, backupUrl, stepId, label);
  return {
    maps,
    sync,
    backup,
    reset,
    // The session half of a restore, with no CLI running. An empty checkpoint (chief session
    // delete) drops the session and blanks the mirror; otherwise `cut` brings the synced session
    // to the kept leaf on disk — false when it cannot, which starts over the same way. A cut that
    // rewrote the store asks for `backup` so the mirror follows at once.
    async rewind(home, step, cut, opts) {
      const { stepId, sessionId } = step;
      if (!sessionId) return;
      const leaf = step.restore?.sessionLeafEntryId;
      if (!leaf) return reset(home, sessionId, step.sessionBackupUrl, stepId);
      const map = await sync(home, sessionId, step.sessionRestoreUrl, stepId);
      if (!map) return;
      if (!cut(map, leaf, sessionId)) return reset(home, sessionId, step.sessionBackupUrl, stepId);
      if (opts?.backup) await backup(home, sessionId, step.sessionBackupUrl, void 0, stepId);
    }
  };
}
var atLatestLeaf = (map, leaf) => map.leaf === leaf;

// src/lib/codex/session.ts
var sessionsDir2 = (home) => (0, import_node_path17.join)(home, "sessions");
function findRolloutFiles(home, threadId) {
  const out = [];
  const walk = (dir) => {
    for (const entry of (0, import_node_fs16.readdirSync)(dir, { withFileTypes: true })) {
      const path = (0, import_node_path17.join)(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".jsonl") && entry.name.includes(`-${threadId}`)) out.push(path);
    }
  };
  if ((0, import_node_fs16.existsSync)(sessionsDir2(home))) walk(sessionsDir2(home));
  return out.sort((a, b) => (0, import_node_path17.basename)(a).localeCompare((0, import_node_path17.basename)(b)));
}
function dropRollouts(home, threadId) {
  for (const file2 of findRolloutFiles(home, threadId)) (0, import_node_fs16.rmSync)(file2, { force: true });
}
function threadTurnIds(home, threadId) {
  let turns = [];
  for (const file2 of findRolloutFiles(home, threadId)) {
    let first2 = null;
    for (const line of (0, import_node_fs16.readFileSync)(file2, "utf8").split("\n")) {
      if (!line) continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (typeof record.ordinal !== "number") continue;
      if (first2 === null) {
        first2 = record.ordinal;
        turns = turns.filter((t) => t.ordinal < first2);
      }
      if (record.type === "event_msg" && record.payload?.type === "task_started" && record.payload.turn_id) {
        turns.push({ ordinal: record.ordinal, id: record.payload.turn_id });
      }
    }
  }
  return turns.map((t) => t.id);
}
var MARK = "tds_rollout";
function packRollouts(home, files) {
  return files.map((file2) => {
    const lines = (0, import_node_fs16.readFileSync)(file2, "utf8");
    return `${JSON.stringify({ [MARK]: (0, import_node_path17.relative)(sessionsDir2(home), file2) })}
${lines}${lines.endsWith("\n") || !lines ? "" : "\n"}`;
  }).join("");
}
function unpackRollouts(home, body) {
  let file2 = null;
  let threadId = null;
  let chunk = [];
  const flush = () => {
    if (file2 && chunk.length) {
      (0, import_node_fs16.mkdirSync)((0, import_node_path17.dirname)(file2), { recursive: true });
      (0, import_node_fs16.writeFileSync)(file2, chunk.join(""));
    }
    chunk = [];
  };
  for (const line of body.split("\n")) {
    if (!line) continue;
    if (line.startsWith(`{"${MARK}"`)) {
      flush();
      const rel = String(JSON.parse(line)[MARK] ?? "");
      if (!rel || rel.includes("..")) return null;
      file2 = (0, import_node_path17.join)(sessionsDir2(home), rel);
      continue;
    }
    if (!file2) return null;
    if (!threadId) {
      const record = JSON.parse(line);
      if (record.type === "session_meta" && record.payload?.id) threadId = record.payload.id;
    }
    chunk.push(line + "\n");
  }
  flush();
  return threadId;
}
function codec(home) {
  return {
    pack: (map) => {
      const files = findRolloutFiles(home, map.id);
      return files.length ? packRollouts(home, files) : null;
    },
    unpack: (body) => {
      const id = unpackRollouts(home, body);
      return id ? { id } : null;
    },
    drop: (map) => dropRollouts(home, map.id)
  };
}
var codexSession = sessionMirror("codex", codec, "tds-threads");

// src/lib/codex/stream.ts
var FIELDS = ["inputTokens", "cachedInputTokens", "cacheWriteInputTokens", "outputTokens", "reasoningOutputTokens", "totalTokens"];
var minus = (a, b) => Object.fromEntries(FIELDS.map((f) => [f, Math.max(0, (a[f] ?? 0) - (b[f] ?? 0))]));
function toolStart(item) {
  switch (item.type) {
    case "commandExecution": {
      const action = item.commandActions?.[0];
      if (action?.type === "read") return ["Read", String(action.path ?? "")];
      if (action?.type === "search") return ["Grep", `"${action.query ?? ""}"${action.path ? ` in ${action.path}` : ""}`];
      return ["Bash", String(item.command ?? "").slice(0, 100)];
    }
    case "fileChange": {
      const paths2 = (item.changes ?? []).map((c) => c.path);
      return ["Edit", paths2.length ? `${paths2[0]}${paths2.length > 1 ? ` +${paths2.length - 1}` : ""}` : ""];
    }
    case "mcpToolCall":
      return [`${item.server}/${item.tool}`, ""];
    case "webSearch":
      return ["WebSearch", String(item.query ?? "")];
    case "imageView":
      return ["Read", String(item.path ?? "")];
    default:
      return null;
  }
}
function createCodexStream(pump) {
  let retries = 0;
  let lastError;
  let messageItem;
  let turnStarted = false;
  let baseline = null;
  let last = null;
  let total = null;
  let contextWindow = 0;
  return {
    turnStarted: () => {
      turnStarted = true;
    },
    lastError: () => lastError,
    handle(n) {
      const p = n.params;
      switch (n.method) {
        // A steer taken mid-turn makes Codex answer again in the same turn: a second message item.
        case "item/agentMessage/delta":
          if (p.itemId !== messageItem) {
            messageItem = p.itemId;
            pump.gap();
          }
          pump.text(String(p.delta ?? ""));
          break;
        case "item/reasoning/summaryTextDelta":
        case "item/reasoning/textDelta":
          pump.thinking(String(p.delta ?? ""));
          break;
        case "item/started": {
          const t = toolStart(p.item ?? {});
          if (t) pump.toolStart(t[0], t[1]);
          break;
        }
        case "item/completed":
          if (p.item?.type === "agentMessage") pump.textDone(String(p.item.text ?? ""));
          break;
        case "error":
          if (p.willRetry) pump.retry(++retries, 0);
          else lastError = p.error?.message;
          break;
        case "thread/tokenUsage/updated": {
          const u = p.tokenUsage;
          last = u.last;
          total = u.total;
          contextWindow = u.modelContextWindow ?? contextWindow;
          if (!turnStarted) baseline = u.total;
          else baseline ??= minus(u.total, u.last);
          break;
        }
      }
    },
    report(modelId, thinkingLevel) {
      if (!total || !last) return {};
      const spent = minus(total, baseline ?? minus(total, total));
      const call = {
        provider: "codex",
        modelId,
        thinkingLevel: thinkingLevel ?? "",
        usage: {
          // inputTokens counts cached tokens too; keep the platform's split (cache reads apart).
          inputTokens: Math.max(0, spent.inputTokens - spent.cachedInputTokens),
          outputTokens: spent.outputTokens,
          cacheReadTokens: spent.cachedInputTokens,
          cacheWriteTokens: spent.cacheWriteInputTokens ?? 0,
          costUsd: 0
        }
      };
      return {
        modelCalls: [call],
        ...contextWindow > 0 ? { contextUsage: { tokens: last.totalTokens, contextWindow } } : {}
      };
    }
  };
}

// src/lib/codex/execute.ts
function threadOptions(cwd, step, ephemeral = false, mcpServers = {}, provider = {}) {
  let trusted = cwd;
  try {
    trusted = (0, import_node_fs17.realpathSync)(cwd);
  } catch {
  }
  const notes = [step?.appendSystemPrompt, ephemeral ? REVIEW_NOTE : ""].filter(Boolean).join("\n\n");
  return {
    cwd,
    approvalPolicy: "never",
    sandbox: "danger-full-access",
    config: { ...provider, projects: { [trusted]: { trust_level: "trusted" } }, ...Object.keys(mcpServers).length ? { mcp_servers: mcpServers } : {} },
    ...step?.agent.modelId ? { model: step.agent.modelId } : {},
    ...step?.systemPrompt ? { baseInstructions: step.systemPrompt } : {},
    ...notes ? { developerInstructions: notes } : {}
  };
}
async function userInput(text3, images, stepId) {
  const downloaded = await downloadImages(images, stepId);
  return [
    ...downloaded.map((i) => ({ type: "image", url: `data:${i.mimeType};base64,${i.data}` })),
    { type: "text", text: text3 }
  ];
}
async function revertAfter(rpc, home, threadId, leafTurnId) {
  let turns = threadTurnIds(home, threadId);
  if (!turns.includes(leafTurnId)) {
    turns = [];
    let cursor = null;
    do {
      const page = await rpc.call("thread/turns/list", { threadId, sortDirection: "asc", itemsView: "notLoaded", ...cursor ? { cursor } : {} });
      turns.push(...page.data.map((t) => t.id));
      cursor = page.nextCursor ?? null;
    } while (cursor);
  }
  const at = turns.indexOf(leafTurnId);
  if (at === -1) return false;
  if (at + 1 < turns.length) await rpc.call("thread/revert", { threadId, beforeTurnId: turns[at + 1] });
  return true;
}
async function openThread(rpc, home, threadId, options, resumeAt, ephemeral) {
  if (threadId) {
    try {
      await rpc.call("thread/resume", { threadId, excludeTurns: true, ...options }, TIMEOUTS_MS.codexResume);
      if (!resumeAt || await revertAfter(rpc, home, threadId, resumeAt)) return threadId;
      console.warn(`[codex] rewind leaf ${resumeAt} not in thread ${threadId} \u2014 starting over`);
    } catch (err) {
      console.warn(`[codex] thread/resume ${threadId} failed (${err.message}) \u2014 starting a new thread`);
    }
  }
  const { thread } = await rpc.call("thread/start", { ...options, ephemeral });
  return thread.id;
}
function codexDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveCodexExecutable() ? null : CODEX_MISSING,
    async run(ctx) {
      home = ensureCodexHome();
      const bin = resolveCodexExecutable();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const provider = await userProvider(bin, workdir(home));
      const known = ctx.ephemeral ? null : (await codexSession.sync(home, sessionId, step.sessionRestoreUrl, stepId))?.id ?? null;
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const rpc = spawnAppServer(bin, { codexHome: home, cwd, env: step.secretEnv });
      const stream = createCodexStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Codex");
      try {
        await handshake(rpc);
        const threadId = await openThread(rpc, home, known, threadOptions(cwd, step, ctx.ephemeral, codexMcpServers(mcp.servers), provider), step.resumeSessionAt, ctx.ephemeral);
        if (!ctx.ephemeral && threadId !== known) codexSession.maps(home).write(sessionId, { ...codexSession.maps(home).read(sessionId), id: threadId });
        let activeTurnId = null;
        let last;
        ctx.onStop(() => {
          if (activeTurnId) void rpc.call("turn/interrupt", { threadId, turnId: activeTurnId }).catch(() => {
          });
        });
        await runSteeredTurns(ctx, step, {
          prepare: (text3, images) => userInput(text3, images, stepId),
          // A steer that lands under a turn in flight (a definitive error) waits for a follow-up.
          async inject(input) {
            if (!activeTurnId) return false;
            try {
              await rpc.call("turn/steer", { threadId, expectedTurnId: activeTurnId, input }, 0);
              return true;
            } catch (err) {
              if (isRpcError(err)) return false;
              throw err;
            }
          },
          async turn(input) {
            const completed = rpc.waitFor((n) => n.method === "turn/completed" ? n.params.turn : void 0);
            const { turn } = await rpc.call("turn/start", {
              threadId,
              input,
              ...step.agent.modelId ? { model: step.agent.modelId } : {},
              ...step.agent.thinkingLevel ? { effort: step.agent.thinkingLevel } : {}
            });
            activeTurnId = turn.id;
            stream.turnStarted();
            idle.arm();
            try {
              last = await completed;
            } finally {
              idle.disarm();
              activeTurnId = null;
            }
            return last.status !== "failed";
          }
        });
        const error = last?.status === "failed" ? withSetupHint(last.error?.message ?? stream.lastError() ?? "Codex returned an error") : void 0;
        return { error, leafId: last?.id, ...stream.report(step.agent.modelId, step.agent.thinkingLevel) };
      } catch (err) {
        const failure2 = idle.error(err);
        if (failure2 instanceof Error) failure2.message = withSetupHint(failure2.message);
        throw failure2;
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
      }
    },
    backup: (ctx) => codexSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeCodexStep = externalStep(codexDriver);
async function rewindCodexSession(step) {
  const { stepId, sessionId } = step;
  if (!sessionId) return;
  const leaf = step.restore?.sessionLeafEntryId;
  if (!leaf) return codexSession.reset(codexHome(), sessionId, step.sessionBackupUrl, stepId);
  const bin = resolveCodexExecutable();
  if (!bin) throw new Error(CODEX_MISSING);
  const home = ensureCodexHome();
  const threadId = (await codexSession.sync(home, sessionId, step.sessionRestoreUrl, stepId))?.id;
  if (!threadId) return;
  const rpc = spawnAppServer(bin, { codexHome: home, cwd: workdir(home) });
  let kept = false;
  try {
    await handshake(rpc);
    await rpc.call("thread/resume", { threadId, excludeTurns: true, ...threadOptions(workdir(home)) }, TIMEOUTS_MS.codexResume);
    kept = await revertAfter(rpc, home, threadId, leaf);
  } finally {
    await rpc.close();
  }
  if (!kept) return codexSession.reset(home, sessionId, step.sessionBackupUrl, stepId);
  await codexSession.backup(home, sessionId, step.sessionBackupUrl, void 0, stepId);
}

// src/lib/codex/usage.ts
var RPC_TIMEOUT_MS = 2e4;
var MODEL_PAGES_MAX = 4;
var HALVES = ["primary", "secondary"];
function keyByLength(w) {
  if (w.windowDurationMins === 300) return "five_hour";
  if (w.windowDurationMins === 10080) return "seven_day";
  return `window:${w.windowDurationMins ?? "unknown"}`;
}
function windowsOf(snap, keyOf, label) {
  return HALVES.flatMap((half) => {
    const w = snap[half];
    return w ? [{ key: keyOf(w, half), label, windowMinutes: w.windowDurationMins ?? null, utilization: pct(w.usedPercent), resetsAt: msFromSeconds(w.resetsAt) }] : [];
  });
}
function readingFromCodexAccount(account, limits) {
  if (!account) return SIGNED_OUT;
  if (account.type !== "chatgpt") return noLimits({ id: null, email: null, plan: null });
  const email = account.email ?? null;
  if (!limits) return noLimits({ id: email, email, plan: account.planType ?? null });
  const main = limits.rateLimits;
  const acct = { id: limits.accountId ?? email, email, plan: main.planType ?? account.planType ?? null };
  const extras = Object.entries(limits.rateLimitsByLimitId ?? {}).filter((e) => !!e[1] && e[0] !== main.limitId);
  const windows = [
    ...windowsOf(main, keyByLength, main.limitName),
    ...extras.flatMap(([id, snap]) => windowsOf(snap, (_, half) => `limit:${id}${half === "secondary" ? ":secondary" : ""}`, snap.limitName ?? id))
  ];
  return { status: "ok", account: acct, windows };
}
function modelsFromCodexList(models) {
  return models.filter((m) => !m.hidden).map((m) => ({
    id: m.model,
    label: m.displayName || m.model,
    effortLevels: m.supportedReasoningEfforts.map((e) => e.reasoningEffort),
    ...m.upgrade ? { upgrade: m.upgrade } : {}
  }));
}
async function readRateLimits(call) {
  try {
    return await call("account/rateLimits/read", { excludeResetCreditDetails: true }, RPC_TIMEOUT_MS);
  } catch (err) {
    if (!/expected unit/.test(err?.message ?? "")) throw err;
    return call("account/rateLimits/read", null, RPC_TIMEOUT_MS);
  }
}
async function listModels(rpc) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < MODEL_PAGES_MAX; page++) {
    const res = await rpc.call("model/list", cursor ? { cursor } : {}, RPC_TIMEOUT_MS);
    all.push(...res.data);
    cursor = res.nextCursor ?? null;
    if (!cursor) break;
  }
  return all;
}
async function probeCodexUsage(signal) {
  const bin = resolveCodexExecutable();
  if (!bin) throw new Error(CODEX_MISSING);
  const home = homeOrSignedOut(ensureCodexHome, CODEX_NOT_SIGNED_IN);
  if (!home) return SIGNED_OUT;
  const rpc = spawnAppServer(bin, { codexHome: home, cwd: workdir(home) });
  return withSpawned(signal, () => rpc.close(), async () => {
    await handshake(rpc);
    const { account } = await rpc.call("account/read", {}, RPC_TIMEOUT_MS);
    if (!account) return SIGNED_OUT;
    const [limits, models] = await Promise.all([
      account.type === "chatgpt" ? readRateLimits(rpc.call) : null,
      listModels(rpc)
    ]);
    return { ...readingFromCodexAccount(account, limits), models: modelsFromCodexList(models) };
  });
}

// src/lib/grok-build/bin.ts
var GROK_MISSING = "Grok Build is not installed on this machine \u2014 install it (curl -fsSL https://x.ai/cli/install.sh | bash) and run `grok login`, or point TDS_GROK_BUILD_BIN at the executable.";
function resolveGrokExecutable(lookup) {
  return resolveExecutable({ override: "TDS_GROK_BUILD_BIN", command: "grok", homeDirs: [[".grok", "bin"]] }, lookup);
}

// src/lib/grok-build/execute.ts
var import_node_fs20 = require("node:fs");

// src/lib/grok-build/home.ts
var import_node_fs18 = require("node:fs");
var import_node_os6 = require("node:os");
var import_node_path18 = require("node:path");
var GROK_NOT_SIGNED_IN = "Grok Build is not signed in on this machine \u2014 run `grok login` first (or set XAI_API_KEY).";
var CONFIG_TOML2 = `# Written by tds. The agent's Grok home: only auth.json is shared with your own ~/.grok.
[cli]
auto_update = false
use_leader = false

[memory]
enabled = false

[compat.claude]
skills = false
rules = false
agents = false
mcps = false
hooks = false
sessions = false

[compat.cursor]
skills = false
rules = false
agents = false
mcps = false
hooks = false
sessions = false

[compat.codex]
sessions = false
`;
var COMPAT_ENV = Object.fromEntries(
  ["CLAUDE", "CURSOR"].flatMap((vendor) => ["SKILLS", "RULES", "AGENTS", "MCPS", "HOOKS"].map((cell) => [`GROK_${vendor}_${cell}_ENABLED`, "0"]))
);
function userGrokHome() {
  return process.env.GROK_HOME || (0, import_node_path18.join)((0, import_node_os6.homedir)(), ".grok");
}
function grokHome() {
  return runtimeHome("grok-home", ["workdir", "tds-sessions", "sessions", "attachments"]);
}
function ensureGrokHome() {
  const home = grokHome();
  ensureConfig(home, "config.toml", CONFIG_TOML2);
  const source = (0, import_node_path18.join)(userGrokHome(), "auth.json");
  if ((0, import_node_fs18.existsSync)(source)) linkAuth(source, home, "grok");
  else if (!process.env.XAI_API_KEY) throw new Error(GROK_NOT_SIGNED_IN);
  return home;
}
function grokEnv(home) {
  return { ...process.env, GROK_HOME: home, GROK_DISABLE_AUTOUPDATER: "1", GROK_MEMORY: "0", ...COMPAT_ENV };
}
function trustFolder(home, cwd) {
  const file2 = (0, import_node_path18.join)(home, "trusted_folders.toml");
  const have = (0, import_node_fs18.existsSync)(file2) ? (0, import_node_fs18.readFileSync)(file2, "utf8") : "";
  let real = cwd;
  try {
    real = (0, import_node_fs18.realpathSync)(cwd);
  } catch {
  }
  for (const path of /* @__PURE__ */ new Set([cwd, real])) {
    const header = `[folders.${JSON.stringify(path)}]`;
    if (!have.includes(header)) (0, import_node_fs18.appendFileSync)(file2, `${header}
trusted = true
decided_at = ${Math.floor(Date.now() / 1e3)}

`);
  }
}

// src/lib/acp.ts
function acpInitialize(rpc, meta) {
  return rpc.call("initialize", {
    protocolVersion: 1,
    clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false, ...meta ? { _meta: meta } : {} },
    clientInfo: { name: "tds", version: getVersion() }
  });
}
function declineAcpPermission(params) {
  const options = params.options ?? [];
  const pick = options.find((o) => o.kind === "reject_once") ?? options.find((o) => o.kind === "reject_always");
  return pick ? { outcome: { outcome: "selected", optionId: pick.optionId } } : { outcome: { outcome: "cancelled" } };
}
function acpAutoReply(more) {
  return (method, params) => method === "session/request_permission" ? declineAcpPermission(params) : more?.(method, params) ?? null;
}
function isAcpAuthRequired(err) {
  return isRpcError(err) && err.rpc.code === -32e3;
}
function acpPrompt(text3, images) {
  return [...images.map((i) => ({ type: "image", data: i.data, mimeType: i.mimeType })), { type: "text", text: text3 }];
}
function acpEffortOption(options) {
  return options.find((o) => o.category === "thought_level" && !(o.options ?? []).every((v) => v.value === "true" || v.value === "false"));
}
async function selectAcpModel(rpc, label, session3, modelId, effort) {
  const { sessionId } = session3;
  let options = session3.configOptions;
  if (modelId && options.find((o) => o.id === "model")?.currentValue !== modelId) {
    try {
      options = (await rpc.call("session/set_config_option", { sessionId, configId: "model", value: modelId })).configOptions ?? [];
    } catch (err) {
      throw isRpcError(err) ? new Error(`${label} cannot run the model ${modelId}: ${err.message}`) : err;
    }
  }
  const level = acpEffortOption(options);
  if (effort && level && level.currentValue !== effort && level.options?.some((o) => o.value === effort)) {
    await rpc.call("session/set_config_option", { sessionId, configId: level.id, value: effort });
  }
}

// src/lib/grok-build/rpc.ts
var autoReply2 = acpAutoReply((method) => method === "_x.ai/mcp/elicit" ? { action: "decline" } : null);
function spawnGrokAgent(bin, opts) {
  const args2 = [
    "agent",
    "--no-leader",
    "--always-approve",
    ...opts.model ? ["-m", opts.model] : [],
    ...opts.effort ? ["--reasoning-effort", opts.effort] : [],
    "stdio"
  ];
  return spawnStdioRpc(bin, args2, {
    label: "grok",
    cwd: opts.cwd,
    env: { ...opts.env, ...grokEnv(opts.home) },
    autoReply: autoReply2,
    callTimeoutMs: TIMEOUTS_MS.grokRpc,
    exitTimeoutMs: TIMEOUTS_MS.grokExit
  });
}
var handshake2 = (rpc) => acpInitialize(rpc);
function contextWindowFor(init, modelId) {
  const models = init?._meta?.modelState?.availableModels ?? [];
  return Number(models.find((m) => m.modelId === modelId)?._meta?.totalContextTokens ?? 0);
}

// src/lib/grok-build/session.ts
var import_node_fs19 = require("node:fs");
var import_node_path19 = require("node:path");
var grokSessionMaps = (home) => sessionMapStore((0, import_node_path19.join)(home, "tds-sessions"));
var encodeCwd = (cwd) => encodeURIComponent(cwd);
var sessionDir = (home, cwd, id) => (0, import_node_path19.join)(home, "sessions", encodeCwd(cwd), id);
var attachmentsDir = (home, conversationId) => (0, import_node_path19.join)(home, "attachments", conversationId);
var MIRRORED = ["summary.json", "updates.jsonl", "chat_history.jsonl", "rewind_points.jsonl", "hunk_records.jsonl", "signals.json", "plan.json", "prompt_context.json", "system_prompt.txt", "resources_state.json"];
var MIRRORED_DIRS = ["compaction_checkpoints"];
function mirroredFiles(dir) {
  const out = MIRRORED.filter((f) => (0, import_node_fs19.existsSync)((0, import_node_path19.join)(dir, f)));
  for (const sub of MIRRORED_DIRS) {
    if (!(0, import_node_fs19.existsSync)((0, import_node_path19.join)(dir, sub))) continue;
    for (const name of (0, import_node_fs19.readdirSync)((0, import_node_path19.join)(dir, sub)).sort()) {
      if ((0, import_node_fs19.statSync)((0, import_node_path19.join)(dir, sub, name)).isFile()) out.push(`${sub}/${name}`);
    }
  }
  return out;
}
var HEAD = "tds_grok_session";
var FILE = "tds_grok_file";
var SESSION_ID = /^[0-9a-f-]{36}$/i;
function packSession(dir, cwd) {
  if (!(0, import_node_fs19.existsSync)((0, import_node_path19.join)(dir, "summary.json"))) return null;
  const lines = [JSON.stringify({ [HEAD]: (0, import_node_path19.basename)(dir), cwd })];
  for (const rel of mirroredFiles(dir)) lines.push(JSON.stringify({ [FILE]: rel, text: (0, import_node_fs19.readFileSync)((0, import_node_path19.join)(dir, rel), "utf8") }));
  return lines.join("\n") + "\n";
}
function unpackSession(home, cwd, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD}"`)) return null;
  const head = JSON.parse(lines[0]);
  const id = head[HEAD] ?? "";
  if (!SESSION_ID.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const rel = record[FILE];
    if (!rel || rel.startsWith("/") || rel.split("/").includes("..") || typeof record.text !== "string") return null;
    files.push([rel, record.text]);
  }
  const dir = sessionDir(home, cwd, id);
  for (const [rel, text3] of files) {
    (0, import_node_fs19.mkdirSync)((0, import_node_path19.dirname)((0, import_node_path19.join)(dir, rel)), { recursive: true });
    (0, import_node_fs19.writeFileSync)((0, import_node_path19.join)(dir, rel), text3);
  }
  rewriteSummary(dir, head.cwd ?? "", cwd, home);
  return id;
}
function rewriteSummary(dir, from, to, home) {
  const file2 = (0, import_node_path19.join)(dir, "summary.json");
  let summary;
  try {
    summary = JSON.parse((0, import_node_fs19.readFileSync)(file2, "utf8"));
  } catch {
    return;
  }
  summary.info = { ...summary.info, cwd: to };
  summary.grok_home = home;
  if (from && typeof summary.git_root_dir === "string" && summary.git_root_dir.startsWith(from)) summary.git_root_dir = to + summary.git_root_dir.slice(from.length);
  (0, import_node_fs19.writeFileSync)(file2, JSON.stringify(summary, null, 2) + "\n");
}
function relocateSession(home, map, cwd) {
  if (map.cwd === cwd) return map;
  const from = sessionDir(home, map.cwd, map.id);
  const to = sessionDir(home, cwd, map.id);
  if ((0, import_node_fs19.existsSync)(from)) {
    (0, import_node_fs19.mkdirSync)((0, import_node_path19.dirname)(to), { recursive: true });
    (0, import_node_fs19.rmSync)(to, { recursive: true, force: true });
    (0, import_node_fs19.renameSync)(from, to);
    rewriteSummary(to, map.cwd, cwd, home);
  }
  return { ...map, cwd };
}
function promptTurns(dir) {
  let text3;
  try {
    text3 = (0, import_node_fs19.readFileSync)((0, import_node_path19.join)(dir, "updates.jsonl"), "utf8");
  } catch {
    return [];
  }
  const turns = [];
  let index = null;
  for (const line of text3.split("\n")) {
    if (!line) continue;
    let u;
    try {
      u = JSON.parse(line).params?.update;
    } catch {
      continue;
    }
    if (u?.sessionUpdate === "user_message_chunk" && typeof u._meta?.promptIndex === "number") index = u._meta.promptIndex;
    else if (u?.sessionUpdate === "turn_completed" && index !== null && u.prompt_id) {
      turns.push({ index, promptId: String(u.prompt_id) });
      index = null;
    }
  }
  return turns;
}
function codec2(home, conversationId, cwd) {
  return {
    pack: (map) => packSession(sessionDir(home, map.cwd, map.id), map.cwd),
    unpack: (body) => {
      const id = unpackSession(home, cwd, body);
      return id ? { id, cwd } : null;
    },
    drop: (map) => {
      (0, import_node_fs19.rmSync)(sessionDir(home, map.cwd, map.id), { recursive: true, force: true });
      (0, import_node_fs19.rmSync)(attachmentsDir(home, conversationId), { recursive: true, force: true });
    }
  };
}
async function syncGrokSession(home, cwd, ref, restoreUrl, stepId) {
  const store = grokSessionMaps(home);
  const map = await syncSession(store, codec2(home, ref.conversationId, cwd), ref.sessionId, restoreUrl, stepId, "grok");
  if (!map) return null;
  const moved = relocateSession(home, map, cwd);
  if (moved !== map) store.write(ref.sessionId, moved);
  return map.id;
}
function backupGrokSession(home, ref, backupUrl, refreshUrl, stepId) {
  return backupSession2(grokSessionMaps(home), codec2(home, ref.conversationId, ""), ref.sessionId, backupUrl, refreshUrl, stepId, "grok");
}
function resetGrokSession(home, ref, backupUrl, stepId) {
  return resetSession(grokSessionMaps(home), codec2(home, ref.conversationId, ""), ref.sessionId, backupUrl, stepId, "grok");
}

// src/lib/grok-build/stream.ts
function toolStart2(u) {
  const name = String(u._meta?.["x.ai/tool"]?.name ?? u.title ?? "tool");
  const input = u.rawInput;
  switch (name) {
    case "read_file":
      return ["Read", detail(input, "path", "file_path")];
    case "list_dir":
      return ["Glob", detail(input, "path")];
    case "grep":
    case "search_tool": {
      const path = detail(input, "path");
      return ["Grep", `"${detail(input, "pattern", "query")}"${path ? ` in ${path}` : ""}`];
    }
    case "search_replace":
      return ["Edit", detail(input, "path", "file_path")];
    case "write_file":
    case "create_file":
      return ["Write", detail(input, "path", "file_path")];
    case "run_terminal_command":
    case "run_terminal_cmd":
      return ["Bash", detail(input, "command").slice(0, 100)];
    case "web_search":
      return ["WebSearch", detail(input, "query")];
    case "web_fetch":
      return ["WebFetch", detail(input, "url")];
    case "Agent":
      return ["Task", detail(input, "description")];
    default:
      return [name, detail(input, "path", "command", "pattern", "query", "url", "description")];
  }
}
function createGrokStream(pump, modelId, thinkingLevel) {
  let started2 = false;
  const message = messageBuffer(pump);
  let lastPromptId;
  let contextTokens;
  const calls = [];
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      started2 = true;
    },
    lastPromptId: () => lastPromptId,
    // Chunks and tool calls ride ACP's session/update; turn_completed rides the vendor
    // _x.ai/session_notification (the session log on disk rewrites both to session/update).
    handle(n) {
      if (!started2 || !n.method.endsWith("session/update") && n.method !== "_x.ai/session_notification") return;
      const u = n.params.update ?? {};
      if (typeof n.params._meta?.totalTokens === "number") contextTokens = n.params._meta.totalTokens;
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (t) message.chunk(t);
          break;
        }
        case "agent_thought_chunk":
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        case "tool_call":
          message.close();
          pump.toolStart(...toolStart2(u));
          break;
        case "user_message_chunk":
          message.close();
          break;
        case "turn_completed": {
          message.close();
          if (u.prompt_id) lastPromptId = String(u.prompt_id);
          const usage = u.usage;
          if (usage) {
            calls.push({
              provider: "grok-build",
              modelId,
              thinkingLevel: thinkingLevel ?? "",
              at: Date.now(),
              usage: {
                // inputTokens counts cached tokens too; keep the platform's split (cache reads apart).
                inputTokens: Math.max(0, (usage.inputTokens ?? 0) - (usage.cachedReadTokens ?? 0)),
                outputTokens: usage.outputTokens ?? 0,
                cacheReadTokens: usage.cachedReadTokens ?? 0,
                cacheWriteTokens: usage.cacheCreationTokens ?? 0,
                costUsd: (usage.costUsdTicks ?? 0) / 1e10
              }
            });
          }
          break;
        }
      }
    },
    report(contextWindow) {
      if (!calls.length) return {};
      return {
        modelCalls: calls,
        ...contextWindow > 0 && contextTokens !== void 0 ? { contextUsage: { tokens: contextTokens, contextWindow } } : {}
      };
    }
  };
}

// src/lib/grok-build/execute.ts
function sessionMeta(step, ephemeral) {
  const rules = [step.appendSystemPrompt, ephemeral ? REVIEW_NOTE : ""].filter(Boolean).join("\n\n");
  return {
    yoloMode: true,
    ...step.systemPrompt ? { systemPromptOverride: step.systemPrompt } : {},
    ...rules ? { rules } : {}
  };
}
async function rewindTo(rpc, dir, sessionId, leafPromptId) {
  const turns = promptTurns(dir);
  const at = turns.findIndex((t) => t.promptId === leafPromptId);
  if (at === -1) return false;
  if (at === turns.length - 1) return true;
  const target = turns[at + 1].index;
  const { points } = await rpc.call("_x.ai/rewind/points", { session_id: sessionId });
  if (!points?.some((p) => (p.prompt_index ?? p.promptIndex) === target)) return false;
  await rpc.call("_x.ai/rewind/execute", { session_id: sessionId, targetPromptIndex: target });
  return true;
}
async function openSession(rpc, home, cwd, known, step, ephemeral, mcpServers) {
  if (known) {
    try {
      await rpc.call("session/load", { sessionId: known, cwd, mcpServers, _meta: sessionMeta(step, ephemeral) }, TIMEOUTS_MS.grokLoad);
      if (!step.resumeSessionAt || await rewindTo(rpc, sessionDir(home, cwd, known), known, step.resumeSessionAt)) {
        if (step.agent.modelId) await rpc.call("session/set_model", { sessionId: known, modelId: step.agent.modelId }).catch((err) => console.warn(`[grok] set_model failed: ${err.message}`));
        return known;
      }
      console.warn(`[grok] rewind leaf ${step.resumeSessionAt} not in session ${known} \u2014 starting over`);
    } catch (err) {
      console.warn(`[grok] session/load ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  const { sessionId } = await rpc.call("session/new", { cwd, mcpServers, _meta: sessionMeta(step, ephemeral) });
  return sessionId;
}
function grokDriver(step, serverUrl, token) {
  const { stepId, conversationId } = step;
  const ref = { conversationId, sessionId: step.sessionId };
  let home = "";
  return {
    missing: () => resolveGrokExecutable() ? null : GROK_MISSING,
    async run(ctx) {
      home = ensureGrokHome();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      trustFolder(home, cwd);
      const known = ctx.ephemeral ? null : await syncGrokSession(home, cwd, ref, step.sessionRestoreUrl, stepId);
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const rpc = spawnGrokAgent(resolveGrokExecutable(), { home, cwd, model: step.agent.modelId, effort: step.agent.thinkingLevel, env: step.secretEnv });
      const stream = createGrokStream(ctx.pump, step.agent.modelId, step.agent.thinkingLevel);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Grok Build");
      let sessionId = "";
      try {
        const contextWindow = contextWindowFor(await handshake2(rpc), step.agent.modelId);
        sessionId = await openSession(rpc, home, cwd, known, step, ctx.ephemeral, acpMcpServers(mcp.servers));
        if (!ctx.ephemeral && sessionId !== known) grokSessionMaps(home).write(ref.sessionId, { id: sessionId, cwd });
        let active = false;
        let error;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId });
        });
        await runSteeredTurns(ctx, step, {
          // Grok's ACP takes no image blocks.
          prepare: (text3, images) => withImageFiles(text3, images, attachmentsDir(home, conversationId), stepId),
          async inject(text3) {
            try {
              await rpc.call("_x.ai/interject", { sessionId, text: text3 }, 0);
              return true;
            } catch (err) {
              if (isRpcError(err)) return false;
              throw err;
            }
          },
          // The prompt response is the turn's end.
          async turn(text3) {
            active = true;
            stream.turnStarted();
            idle.arm();
            try {
              const { stopReason } = await rpc.call("session/prompt", { sessionId, prompt: [{ type: "text", text: text3 }] }, 0);
              if (stopReason === "refusal") error = "Grok Build refused the request";
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = err.rpc.message;
            } finally {
              idle.disarm();
              active = false;
            }
            return !error;
          }
        });
        return { error, leafId: stream.lastPromptId(), ...stream.report(contextWindow) };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        if (ctx.ephemeral && sessionId) (0, import_node_fs20.rmSync)(sessionDir(home, cwd, sessionId), { recursive: true, force: true });
      }
    },
    backup: (ctx) => backupGrokSession(home, ref, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeGrokBuildStep = externalStep(grokDriver);
async function rewindGrokBuildSession(step) {
  const { stepId, conversationId } = step;
  if (!step.sessionId) return;
  const ref = { conversationId, sessionId: step.sessionId };
  const leaf = step.restore?.sessionLeafEntryId;
  if (!leaf) return resetGrokSession(grokHome(), ref, step.sessionBackupUrl, stepId);
  const bin = resolveGrokExecutable();
  if (!bin) throw new Error(GROK_MISSING);
  const home = ensureGrokHome();
  const cwd = workdir(home);
  trustFolder(home, cwd);
  const sessionId = await syncGrokSession(home, cwd, ref, step.sessionRestoreUrl, stepId);
  if (!sessionId) return;
  const rpc = spawnGrokAgent(bin, { home, cwd });
  let kept = false;
  try {
    await handshake2(rpc);
    await rpc.call("session/load", { sessionId, cwd, mcpServers: [] }, TIMEOUTS_MS.grokLoad);
    kept = await rewindTo(rpc, sessionDir(home, cwd, sessionId), sessionId, leaf);
  } finally {
    await rpc.close();
  }
  if (!kept) return resetGrokSession(home, ref, step.sessionBackupUrl, stepId);
  await backupGrokSession(home, ref, step.sessionBackupUrl, void 0, stepId);
}

// src/lib/grok-build/usage.ts
var RPC_TIMEOUT_MS2 = 2e4;
function modelsFromGrokInit(init) {
  const models = init?._meta?.modelState?.availableModels ?? [];
  return models.flatMap((m) => {
    if (typeof m.modelId !== "string" || !m.modelId) return [];
    const efforts = (m._meta?.reasoningEfforts ?? []).flatMap((e) => typeof e.value === "string" && e.value ? [e.value] : []);
    return [{ id: m.modelId, label: typeof m.name === "string" && m.name ? m.name : m.modelId, effortLevels: efforts.reverse() }];
  });
}
async function billingOf(rpc) {
  try {
    return await rpc.call("_x.ai/billing", {}, RPC_TIMEOUT_MS2);
  } catch (err) {
    if (!isRpcError(err) || !/auth|login/i.test(err.message)) throw err;
    return null;
  }
}
function readingFromGrokBilling(sub, billing) {
  if (!sub.authenticated) return SIGNED_OUT;
  const email = sub.meta?.email ?? null;
  const acct = { id: email, email, plan: billing?.subscription_tier ?? sub.meta?.subscription_tier ?? null };
  if (!billing) return noLimits(acct);
  const windows = [];
  const { currentPeriod: period, creditUsagePercent, onDemandCap, onDemandUsed } = billing.config ?? {};
  if (period?.type === "USAGE_PERIOD_TYPE_WEEKLY") windows.push({ key: "seven_day", windowMinutes: 10080, utilization: null, resetsAt: msFromIso(period.end) });
  const credits = pct(creditUsagePercent);
  if (credits != null) windows.push({ key: "credits", utilization: credits, resetsAt: null });
  const cap2 = onDemandCap?.val ?? 0;
  if (cap2 > 0) windows.push({ key: "on_demand", utilization: pct((onDemandUsed?.val ?? 0) / cap2 * 100), resetsAt: msFromIso(period?.end) });
  return { status: "ok", account: acct, windows };
}
async function probeGrokBuildUsage(signal) {
  const bin = resolveGrokExecutable();
  if (!bin) throw new Error(GROK_MISSING);
  const home = homeOrSignedOut(ensureGrokHome, GROK_NOT_SIGNED_IN);
  if (!home) return SIGNED_OUT;
  const rpc = spawnGrokAgent(bin, { home, cwd: workdir(home) });
  return withSpawned(signal, () => rpc.close(), async () => {
    const models = modelsFromGrokInit(await handshake2(rpc));
    const sub = await rpc.call("_x.ai/auth/check_subscription", {}, RPC_TIMEOUT_MS2);
    const reading = !sub.authenticated && process.env.XAI_API_KEY ? noLimits(null) : readingFromGrokBilling(sub, sub.authenticated ? await billingOf(rpc) : null);
    return { ...reading, models };
  });
}

// src/lib/cursor/bin.ts
var CURSOR_MISSING = "Cursor CLI is not installed on this machine \u2014 install it (curl https://cursor.com/install -fsS | bash) and run `cursor-agent login`, or point TDS_CURSOR_BIN at the executable.";
function resolveCursorExecutable(lookup) {
  return resolveExecutable({ override: "TDS_CURSOR_BIN", command: "cursor-agent" }, lookup);
}

// src/lib/cursor/execute.ts
var import_node_crypto4 = require("node:crypto");
var import_node_fs22 = require("node:fs");

// src/lib/cursor/home.ts
var CURSOR_NOT_SIGNED_IN = "Cursor CLI is not signed in on this machine \u2014 run `cursor-agent login` first (or set CURSOR_API_KEY).";
var CLI_CONFIG = `${JSON.stringify({
  version: 1,
  editor: { vimMode: false },
  permissions: { allow: [], deny: [] },
  sandbox: { mode: "disabled" },
  attribution: { attributeCommitsToAgent: false, attributePRsToAgent: false }
}, null, 2)}
`;
function cursorHome() {
  return runtimeHome("cursor-home", ["workdir", "tds-sessions", "acp-sessions"]);
}
function ensureCursorHome() {
  const home = cursorHome();
  ensureConfig(home, "cli-config.json", CLI_CONFIG);
  return home;
}
function cursorEnv(home) {
  return { ...process.env, CURSOR_CONFIG_DIR: home, CURSOR_DATA_DIR: home };
}

// src/lib/cursor/rpc.ts
var autoReply3 = acpAutoReply((method) => {
  switch (method) {
    case "cursor/ask_question":
      return { outcome: { outcome: "skipped", reason: "Nobody is here to answer: decide yourself and carry on." } };
    case "cursor/create_plan":
      return { outcome: { outcome: "accepted" } };
    case "cursor/update_todos":
    case "cursor/task":
    case "cursor/generate_image":
      return {};
    default:
      return null;
  }
});
function spawnCursorAgent(bin, opts) {
  return spawnStdioRpc(bin, ["--force", "acp"], {
    label: "cursor",
    cwd: opts.cwd,
    env: { ...opts.env, ...cursorEnv(opts.home) },
    autoReply: autoReply3,
    callTimeoutMs: TIMEOUTS_MS.cursorRpc,
    exitTimeoutMs: TIMEOUTS_MS.cursorExit
  });
}
function handshake3(rpc) {
  return acpInitialize(rpc, { parameterizedModelPicker: true });
}

// src/lib/cursor/session.ts
var import_node_fs21 = require("node:fs");
var import_node_path20 = require("node:path");
var sessionDir2 = (home, id) => (0, import_node_path20.join)(home, "acp-sessions", id);
var MIRRORED2 = ["store.db", "store.db-wal"];
var HEAD2 = "tds_cursor_session";
var FILE2 = "tds_cursor_file";
var SESSION_ID2 = /^[0-9a-f-]{36}$/i;
function packSession2(home, map) {
  const dir = sessionDir2(home, map.id);
  if (!(0, import_node_fs21.existsSync)((0, import_node_path20.join)(dir, "store.db"))) return null;
  const lines = [JSON.stringify({ [HEAD2]: map.id, leaf: map.leaf, instructions: map.instructions })];
  for (const name of MIRRORED2) {
    if ((0, import_node_fs21.existsSync)((0, import_node_path20.join)(dir, name))) lines.push(JSON.stringify({ [FILE2]: name, base64: (0, import_node_fs21.readFileSync)((0, import_node_path20.join)(dir, name)).toString("base64") }));
  }
  return lines.join("\n") + "\n";
}
function unpackSession2(home, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD2}"`)) return null;
  const head = JSON.parse(lines[0]);
  const id = head[HEAD2] ?? "";
  if (!SESSION_ID2.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const name = record[FILE2];
    if (!name || !MIRRORED2.includes(name) || typeof record.base64 !== "string") return null;
    files.push([name, Buffer.from(record.base64, "base64")]);
  }
  const dir = sessionDir2(home, id);
  (0, import_node_fs21.rmSync)(dir, { recursive: true, force: true });
  (0, import_node_fs21.mkdirSync)(dir, { recursive: true });
  for (const [name, data] of files) (0, import_node_fs21.writeFileSync)((0, import_node_path20.join)(dir, name), data);
  return { id, ...head.leaf ? { leaf: head.leaf } : {}, ...head.instructions ? { instructions: head.instructions } : {} };
}
function codec3(home) {
  return {
    pack: (map) => packSession2(home, map),
    unpack: (body) => unpackSession2(home, body),
    drop: (map) => (0, import_node_fs21.rmSync)(sessionDir2(home, map.id), { recursive: true, force: true })
  };
}
var cursorSession = sessionMirror("cursor", codec3);

// src/lib/cursor/stream.ts
var FAILURE = /^\n\n(Error: [\s\S]+|Please sign in to continue|Upgrade your plan to continue|Add a payment method to continue|Check your settings to continue)$/;
var TRANSIENT = /^Error: RetriableError:/;
function toolStart3({ title, kind, input }) {
  switch (kind) {
    case "execute":
      return ["Bash", (detail(input, "command") || title).slice(0, 100)];
    case "read":
      return input.path ? ["Read", detail(input, "path")] : [title, ""];
    case "edit":
      return ["Edit", detail(input, "path")];
    case "fetch":
      return ["WebFetch", detail(input, "url")];
    case "search": {
      if (input.searchTerm) return ["WebSearch", detail(input, "searchTerm")];
      if (input.query) return ["Grep", `"${detail(input, "query")}"`];
      const path = detail(input, "path");
      if (title.startsWith("grep")) return ["Grep", `"${detail(input, "pattern")}"${path ? ` in ${path}` : ""}`];
      return ["Glob", detail(input, "pattern") || path];
    }
    // The rest (delete, MCP, todos, plan) say it all in the title.
    default:
      return input._toolName === "task" ? ["Task", detail(input, "description")] : [title, ""];
  }
}
function createCursorStream(pump) {
  let started2 = false;
  const message = messageBuffer(pump);
  let wrote = false;
  let failure2;
  let resumes = 1;
  let resumable2 = false;
  const tools = /* @__PURE__ */ new Map();
  const announce = (call) => {
    if (call.announced) return;
    call.announced = true;
    pump.toolStart(...toolStart3(call));
  };
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      started2 = true;
      failure2 = void 0;
      resumable2 = false;
    },
    // The prompt's response is the turn's end.
    turnEnded: () => {
      for (const call of tools.values()) announce(call);
      tools.clear();
      message.close();
    },
    failure: () => failure2,
    // The failure was transient and the resume budget covered it: the error stayed out of the reply.
    resumable: () => resumable2,
    handle(n) {
      if (!started2 || n.method !== "session/update") return;
      const u = n.params.update ?? {};
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (!t) break;
          const failed = FAILURE.exec(t);
          if (failed) {
            failure2 = failed[1];
            if (TRANSIENT.test(failure2) && resumes > 0) {
              resumes--;
              resumable2 = true;
              message.close();
              pump.retry(1, 1);
              break;
            }
            if (!wrote) break;
          }
          message.chunk(t);
          wrote = true;
          break;
        }
        case "agent_thought_chunk":
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        // The card opens while the arguments still stream; the frame waits for the call to start.
        case "tool_call":
          message.close();
          tools.set(String(u.toolCallId), { title: String(u.title ?? "tool"), kind: String(u.kind ?? "other"), input: u.rawInput ?? {}, announced: false });
          break;
        case "tool_call_update": {
          const call = tools.get(String(u.toolCallId));
          if (!call) break;
          if (u.title) call.title = String(u.title);
          if (u.rawInput) call.input = u.rawInput;
          if (u.status) announce(call);
          break;
        }
        case "user_message_chunk":
          message.close();
          break;
      }
    }
  };
}

// src/lib/cursor/execute.ts
var RESUME = "Your last request was cut off by a transient network error. Continue the task from where you left off; do not repeat work that is already done.";
async function openSession2(rpc, cwd, known, resumeAt, mcpServers) {
  const signedOut = (err) => isAcpAuthRequired(err) ? new Error(CURSOR_NOT_SIGNED_IN) : err;
  if (known && resumeAt && known.leaf !== resumeAt) {
    console.warn(`[cursor] rewind leaf ${resumeAt} is not session ${known.id}'s latest turn \u2014 starting over`);
  } else if (known) {
    try {
      const loaded = await rpc.call("session/load", { sessionId: known.id, cwd, mcpServers }, TIMEOUTS_MS.cursorLoad);
      return { sessionId: known.id, fresh: false, configOptions: loaded?.configOptions ?? [] };
    } catch (err) {
      if (isAcpAuthRequired(err)) throw signedOut(err);
      console.warn(`[cursor] session/load ${known.id} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  try {
    const created = await rpc.call("session/new", { cwd, mcpServers });
    return { sessionId: created.sessionId, fresh: true, configOptions: created.configOptions ?? [] };
  } catch (err) {
    throw signedOut(err);
  }
}
function cursorDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveCursorExecutable() ? null : CURSOR_MISSING,
    async run(ctx) {
      home = ensureCursorHome();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : await cursorSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const rpc = spawnCursorAgent(resolveCursorExecutable(), { home, cwd, env: step.secretEnv });
      const stream = createCursorStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Cursor");
      let opened;
      try {
        await handshake3(rpc);
        opened = await openSession2(rpc, cwd, known, step.resumeSessionAt, acpMcpServers(mcp.servers));
        const acpSessionId = opened.sessionId;
        await selectAcpModel(rpc, "Cursor", opened, step.agent.modelId, step.agent.thinkingLevel);
        const instructions = turnInstructions(step, ctx.ephemeral);
        const stamp = instructions ? instructionsStamp(instructions) : void 0;
        let pending = opened.fresh || known?.instructions !== stamp ? instructions : "";
        const leaf = (0, import_node_crypto4.randomUUID)();
        if (!ctx.ephemeral) cursorSession.maps(home).write(sessionId, { id: opened.sessionId, leaf, instructions: stamp, etag: known?.etag });
        let active = false;
        let error;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: acpSessionId });
        });
        const send = async (prompt) => {
          active = true;
          stream.turnStarted();
          idle.arm();
          try {
            const { stopReason } = await rpc.call("session/prompt", { sessionId: acpSessionId, prompt }, 0);
            if (stopReason === "refusal") return "Cursor refused the request";
          } catch (err) {
            if (!isRpcError(err)) throw err;
            return err.rpc.message;
          } finally {
            idle.disarm();
            active = false;
            stream.turnEnded();
          }
          return stream.failure();
        };
        await runSteeredTurns(ctx, step, {
          prepare: async (text3, images) => ({ text: text3, images }),
          // A prompt sent under a running one cancels it, so a steer waits for a follow-up turn.
          inject: async () => false,
          async turn({ text: text3, images }) {
            let prompt = acpPrompt(pending ? withInstructions(pending, text3) : text3, await downloadImages(images, stepId));
            pending = "";
            for (; ; ) {
              error = await send(prompt);
              if (!error || !stream.resumable() || ctx.interrupted()) return !error;
              console.warn(`[cursor] ${error} \u2014 resuming the turn once`);
              prompt = [{ type: "text", text: RESUME }];
            }
          }
        });
        return { error, leafId: leaf };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        if (ctx.ephemeral && opened) (0, import_node_fs22.rmSync)(sessionDir2(home, opened.sessionId), { recursive: true, force: true });
      }
    },
    backup: (ctx) => cursorSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeCursorStep = externalStep(cursorDriver);
var rewindCursorSession = (step) => cursorSession.rewind(cursorHome(), step, atLatestLeaf);

// src/lib/cursor/usage.ts
var RPC_TIMEOUT_MS3 = 2e4;
var ABOUT_TIMEOUT_MS = 2e4;
function modelsFromCursorList(models) {
  return models.flatMap((m) => {
    if (typeof m.value !== "string" || !m.value) return [];
    const effortLevels = acpEffortOption(m.configOptions ?? [])?.options?.map((o) => o.value) ?? [];
    return [{ id: m.value, label: typeof m.name === "string" && m.name ? m.name : m.value, effortLevels }];
  });
}
function readingFromCursorAbout(about) {
  const email = about?.userEmail ?? null;
  return { status: "ok", account: { id: email, email, plan: about?.subscriptionTier ?? null }, windows: [] };
}
async function aboutOf(bin, home, signal) {
  const about = await cliOutput(bin, ["about", "--format", "json"], { cwd: workdir(home), env: cursorEnv(home), timeoutMs: ABOUT_TIMEOUT_MS, signal });
  if (about.failed) return null;
  try {
    return jsonObjectIn(about.stdout);
  } catch {
    return null;
  }
}
async function probeCursorUsage(signal) {
  const bin = resolveCursorExecutable();
  if (!bin) throw new Error(CURSOR_MISSING);
  const home = ensureCursorHome();
  const rpc = spawnCursorAgent(bin, { home, cwd: workdir(home) });
  return withSpawned(signal, () => rpc.close(), async () => {
    await handshake3(rpc);
    let listed;
    try {
      listed = await rpc.call("cursor/list_available_models", {}, RPC_TIMEOUT_MS3);
    } catch (err) {
      if (isAcpAuthRequired(err)) return SIGNED_OUT;
      throw err;
    }
    return { ...readingFromCursorAbout(await aboutOf(bin, home, signal)), models: modelsFromCursorList(listed.models ?? []) };
  });
}

// src/lib/antigravity/bin.ts
var ANTIGRAVITY_MISSING = "Antigravity CLI is not installed on this machine \u2014 install it (curl -fsSL https://antigravity.google/cli/install.sh | bash) and run `agy` once to sign in, or point TDS_ANTIGRAVITY_BIN at the executable.";
var ANTIGRAVITY_OUTDATED = "Antigravity CLI on this machine is too old to be driven by tds \u2014 update it (`agy update`).";
function resolveAntigravityExecutable(lookup) {
  return resolveExecutable({ override: "TDS_ANTIGRAVITY_BIN", command: "agy", homeDirs: [["AppData", "Local", "agy", "bin"]] }, lookup);
}

// src/lib/antigravity/execute.ts
var import_node_crypto5 = require("node:crypto");
var import_node_fs25 = require("node:fs");

// src/lib/antigravity/home.ts
var import_node_fs23 = require("node:fs");
var import_node_os7 = require("node:os");
var import_node_path21 = require("node:path");
var ANTIGRAVITY_NOT_SIGNED_IN = "Antigravity CLI is not signed in on this machine \u2014 run `agy` once and sign in first (or set GEMINI_API_KEY).";
function antigravityHome() {
  return runtimeHome("antigravity-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
var ownerGeminiDir = () => (0, import_node_path21.join)((0, import_node_os7.homedir)(), ".gemini");
var SIGN_IN_FILES = [(0, import_node_path21.join)("antigravity-cli", "antigravity-oauth-token"), "jetski-standalone-oauth-token"];
var appData = (dir) => (0, import_node_path21.join)(dir, "antigravity-cli");
var attachmentsDir2 = (dir) => (0, import_node_path21.join)(dir, "attachments");
function antigravityEnv(secrets) {
  return { ...process.env, ...secrets, AGY_CLI_DISABLE_AUTO_UPDATE: "true" };
}
var usesApiKey = (env) => !!env.GEMINI_API_KEY;
var RULES = "GEMINI.md";
var MCP_CONFIG = (0, import_node_path21.join)("config", "mcp_config.json");
function stageSession(dir, stage, owner = ownerGeminiDir()) {
  (0, import_node_fs23.mkdirSync)((0, import_node_path21.join)(dir, "config"), { recursive: true });
  (0, import_node_fs23.mkdirSync)(appData(dir), { recursive: true });
  (0, import_node_fs23.writeFileSync)((0, import_node_path21.join)(appData(dir), "settings.json"), `${JSON.stringify(stage.apiKey ? { modelProvider: "gemini" } : {}, null, 2)}
`);
  for (const file2 of SIGN_IN_FILES) {
    if ((0, import_node_fs23.existsSync)((0, import_node_path21.join)(owner, file2))) linkAuth((0, import_node_path21.join)(owner, file2), (0, import_node_path21.dirname)((0, import_node_path21.join)(dir, file2)), "antigravity");
  }
  (0, import_node_fs23.rmSync)((0, import_node_path21.join)(dir, MCP_CONFIG), { force: true });
  (0, import_node_fs23.writeFileSync)((0, import_node_path21.join)(dir, MCP_CONFIG), `${JSON.stringify({ mcpServers: antigravityMcpServers(stage.servers ?? [], stage.bridgeTools ?? []) }, null, 2)}
`, { mode: 384 });
  if (stage.instructions) (0, import_node_fs23.writeFileSync)((0, import_node_path21.join)(dir, RULES), `${stage.instructions}
`);
  else (0, import_node_fs23.rmSync)((0, import_node_path21.join)(dir, RULES), { force: true });
}
function unstageSession(dir) {
  (0, import_node_fs23.rmSync)((0, import_node_path21.join)(dir, MCP_CONFIG), { force: true });
  (0, import_node_fs23.rmSync)((0, import_node_path21.join)(appData(dir), "bin"), { recursive: true, force: true });
}

// src/lib/antigravity/process.ts
var SIGNED_OUT2 = /authentication (required|failed)/i;
function spawnAgy(bin, opts) {
  const listeners = /* @__PURE__ */ new Set();
  let turn = null;
  let exited = null;
  let signedOut = false;
  let conversation = null;
  let started2;
  let failed;
  const ready = new Promise((resolve6, reject) => {
    started2 = resolve6;
    failed = reject;
  });
  ready.catch(() => {
  });
  const startup = setTimeout(() => failed(new Error(`Antigravity did not start within ${TIMEOUTS_MS.antigravityStart / 1e3}s`)), TIMEOUTS_MS.antigravityStart);
  const server = spawnJsonLines(bin, [
    `--gemini_dir=${opts.dir}`,
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    "--dangerously-skip-permissions",
    ...opts.model ? ["--model", opts.model] : [],
    ...opts.conversation ? ["--conversation", opts.conversation] : []
  ], { label: "antigravity", cwd: opts.cwd, env: opts.env, exitTimeoutMs: TIMEOUTS_MS.antigravityExit }, {
    message(msg) {
      if (msg.event === "init") {
        clearTimeout(startup);
        conversation = String(msg.conversation_id ?? "");
        started2(conversation);
      } else if (msg.event === "step_update") {
        for (const l of listeners) l(msg.step_update ?? {});
      } else if (msg.event === "result") {
        const result = msg.result ?? {};
        if (conversation === null) {
          const error = String(result.error ?? "").split("\n")[0];
          failed(new Error(SIGNED_OUT2.test(error) ? ANTIGRAVITY_NOT_SIGNED_IN : error || "Antigravity ended before the session started"));
        }
        turn?.resolve(result);
        turn = null;
      }
    },
    exit(err) {
      clearTimeout(startup);
      exited = signedOut ? new Error(ANTIGRAVITY_NOT_SIGNED_IN) : err;
      failed(exited);
      turn?.reject(exited);
      turn = null;
    },
    // Only while it starts: later the same words could be a tool's.
    stderr(text3) {
      if (signedOut || conversation !== null || !SIGNED_OUT2.test(text3)) return;
      signedOut = true;
      killTree(server.child);
    }
  });
  return {
    // The conversation agy opened or resumed.
    ready,
    onStep(fn) {
      listeners.add(fn);
    },
    // One user message to its result. A message written under a running turn would only queue
    // behind it, so there is no steering one.
    prompt(text3) {
      if (exited) return Promise.reject(exited);
      return new Promise((resolve6, reject) => {
        turn = { resolve: resolve6, reject };
        server.send({ event: "user", message: { content: text3 } });
      });
    },
    // SIGINT ends the running turn with a result and leaves the conversation saved.
    interrupt() {
      const pid = server.child.pid;
      if (pid === void 0) return;
      if (process.platform === "win32") return killTree(server.child);
      try {
        process.kill(-pid, "SIGINT");
      } catch {
      }
    },
    close: server.close
  };
}

// src/lib/antigravity/session.ts
var import_node_fs24 = require("node:fs");
var import_node_path22 = require("node:path");
var conversationsDir = (dir) => (0, import_node_path22.join)(appData(dir), "conversations");
var MIRRORED3 = [".db", ".db-wal"];
var STORE_FILES = [...MIRRORED3, ".db-shm"];
var HEAD3 = "tds_antigravity_session";
var FILE3 = "tds_antigravity_file";
var CONVERSATION_ID = /^[0-9a-f-]{36}$/i;
function dropConversation(dir, id) {
  for (const suffix of STORE_FILES) (0, import_node_fs24.rmSync)((0, import_node_path22.join)(conversationsDir(dir), id + suffix), { force: true });
}
function packSession3(dir, map) {
  const store = (suffix) => (0, import_node_path22.join)(conversationsDir(dir), map.id + suffix);
  if (!(0, import_node_fs24.existsSync)(store(".db"))) return null;
  const lines = [JSON.stringify({ [HEAD3]: map.id, leaf: map.leaf })];
  for (const suffix of MIRRORED3) {
    if ((0, import_node_fs24.existsSync)(store(suffix))) lines.push(JSON.stringify({ [FILE3]: suffix, base64: (0, import_node_fs24.readFileSync)(store(suffix)).toString("base64") }));
  }
  return lines.join("\n") + "\n";
}
function unpackSession3(dir, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD3}"`)) return null;
  const head = JSON.parse(lines[0]);
  const id = head[HEAD3] ?? "";
  if (!CONVERSATION_ID.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const suffix = record[FILE3];
    if (!suffix || !MIRRORED3.includes(suffix) || typeof record.base64 !== "string") return null;
    files.push([suffix, Buffer.from(record.base64, "base64")]);
  }
  dropConversation(dir, id);
  (0, import_node_fs24.mkdirSync)(conversationsDir(dir), { recursive: true });
  for (const [suffix, data] of files) (0, import_node_fs24.writeFileSync)((0, import_node_path22.join)(conversationsDir(dir), id + suffix), data);
  return { id, ...head.leaf ? { leaf: head.leaf } : {} };
}
function codec4(home, sessionId) {
  const dir = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession3(dir, map),
    unpack: (body) => unpackSession3(dir, body),
    drop: () => (0, import_node_fs24.rmSync)(dir, { recursive: true, force: true })
  };
}
var antigravitySession = sessionMirror("antigravity", codec4);

// src/lib/antigravity/stream.ts
var TOOL_NAMES = {
  run_command: "Bash",
  view_file: "Read",
  write_to_file: "Write",
  replace_file_content: "Edit",
  multi_replace_file_content: "Edit",
  grep_search: "Grep",
  find_by_name: "Glob",
  list_dir: "Glob",
  search_web: "WebSearch",
  read_url_content: "WebFetch",
  invoke_subagent: "Task"
};
var BRIDGE_TOOL = `mcp_${BRIDGE_SERVER_NAME}_`;
function toolStart4(name, params) {
  if (name === "call_mcp_tool") return [`${params.ServerName ?? "mcp"}/${params.ToolName ?? ""}`, ""];
  if (name.startsWith(BRIDGE_TOOL)) return [`${BRIDGE_SERVER_NAME}/${name.slice(BRIDGE_TOOL.length)}`, ""];
  const detail2 = Object.values(params).find((v) => typeof v === "string" && !!v) ?? "";
  return [TOOL_NAMES[name] ?? name, name === "run_command" ? detail2.slice(0, 100) : detail2];
}
function createAntigravityStream(pump, modelId) {
  const message = messageBuffer(pump);
  let held = "";
  const announced = /* @__PURE__ */ new Set();
  const counted = /* @__PURE__ */ new Set();
  const calls = [];
  const closeMessage = () => {
    message.close();
    held = "";
  };
  return {
    handle(step) {
      if (step.step_type === "agent_response") {
        const text3 = held + (step.text_delta ?? "");
        const body = text3.trimEnd();
        held = text3.slice(body.length);
        if (body) message.chunk(body);
        if (step.state !== "ACTIVE") closeMessage();
      } else if (step.step_type === "tool") {
        closeMessage();
        if (!announced.has(step.step_index)) {
          announced.add(step.step_index);
          pump.toolStart(...toolStart4(step.tool_name ?? step.tool_info?.name ?? "tool", step.tool_info?.parameters ?? {}));
        }
      }
      if (step.usage && step.state !== "ACTIVE" && !counted.has(step.step_index)) {
        counted.add(step.step_index);
        calls.push({
          provider: "antigravity",
          modelId,
          thinkingLevel: "",
          at: Date.now(),
          usage: {
            inputTokens: step.usage.input_tokens ?? 0,
            outputTokens: step.usage.output_tokens ?? 0,
            cacheReadTokens: step.usage.cache_read_tokens ?? 0,
            cacheWriteTokens: 0,
            costUsd: 0
          }
        });
      }
    },
    // The result is the turn's end; an interrupted answer never got its DONE.
    turnEnded: closeMessage,
    report: () => calls.length ? { modelCalls: calls } : {}
  };
}

// src/lib/antigravity/execute.ts
function antigravityDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveAntigravityExecutable() ? null : ANTIGRAVITY_MISSING,
    async run(ctx) {
      home = antigravityHome();
      const dir = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : await antigravitySession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const rewound = !!known && !!step.resumeSessionAt && known.leaf !== step.resumeSessionAt;
      if (rewound) console.warn(`[antigravity] rewind leaf ${step.resumeSessionAt} is not conversation ${known.id}'s latest turn \u2014 starting over`);
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const env = antigravityEnv(step.secretEnv);
      stageSession(dir, { apiKey: usesApiKey(env), servers: mcp.servers, bridgeTools: mcp.bridgeTools, instructions: turnInstructions(step, ctx.ephemeral) });
      const opts = { dir, cwd, env, model: step.agent.modelId, conversation: known && !rewound ? known.id : void 0 };
      const stream = createAntigravityStream(ctx.pump, step.agent.modelId);
      const listeners = [stream.handle];
      const start = () => {
        const agy2 = spawnAgy(resolveAntigravityExecutable(), opts);
        for (const fn of listeners) agy2.onStep(fn);
        return agy2;
      };
      let agy = start();
      const idle = idleWatch({ onNotification: (fn) => {
        listeners.push(fn);
        agy.onStep(fn);
      }, close: () => agy.close() }, "Antigravity");
      try {
        const conversation = await agy.ready.catch(async (err) => {
          if (err.message === ANTIGRAVITY_NOT_SIGNED_IN) throw err;
          console.warn(`[antigravity] start failed, retrying once: ${err.message}`);
          await agy.close();
          agy = start();
          return agy.ready;
        });
        if (known && known.id !== conversation) dropConversation(dir, known.id);
        const leaf = (0, import_node_crypto5.randomUUID)();
        if (!ctx.ephemeral) antigravitySession.maps(home).write(sessionId, { id: conversation, leaf, etag: known?.etag });
        let active = false;
        let error;
        ctx.onStop(() => {
          if (active) agy.interrupt();
        });
        await runSteeredTurns(ctx, step, {
          // The stream takes text only.
          prepare: (text3, images) => withImageFiles(text3, images, attachmentsDir2(dir), stepId),
          // A message sent under a running turn only queues behind it, so a steer waits for a
          // follow-up turn.
          inject: async () => false,
          async turn(text3) {
            active = true;
            idle.arm();
            try {
              const result = await agy.prompt(text3);
              if (result.status !== "SUCCESS" && !ctx.interrupted()) error = result.error || `Antigravity ended the turn as ${result.status}`;
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            return !error;
          }
        });
        return { error, leafId: leaf, ...stream.report() };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await agy.close();
        mcp.cleanup();
        if (ctx.ephemeral) (0, import_node_fs25.rmSync)(dir, { recursive: true, force: true });
        else unstageSession(dir);
      }
    },
    backup: (ctx) => antigravitySession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeAntigravityStep = externalStep(antigravityDriver);
var rewindAntigravitySession = (step) => antigravitySession.rewind(antigravityHome(), step, atLatestLeaf);

// src/lib/antigravity/usage.ts
var COMMAND_TIMEOUT_MS = 25e3;
var SIGNED_OUT_ERROR = /sign in/i;
function commandData(stdout) {
  return jsonObjectIn(stdout).command?.data ?? {};
}
function modelsFromAgyList(stdout) {
  const models = commandData(stdout).models ?? [];
  return models.flatMap((m) => typeof m.id === "string" && m.id ? [{ id: m.id, label: typeof m.label === "string" && m.label ? m.label : m.id, effortLevels: [] }] : []);
}
function windowsFromAgyUsage(stdout) {
  const groups = commandData(stdout).groups ?? [];
  return groups.flatMap((g) => (g.buckets ?? []).flatMap((b) => {
    if (!b.id || b.disabled) return [];
    const remaining = typeof b.remaining_fraction === "number" ? b.remaining_fraction : b.remaining_amount != null ? null : 0;
    return [{
      key: `limit:${b.id}`,
      label: g.name ?? null,
      windowMinutes: b.window === "weekly" ? 10080 : null,
      utilization: remaining == null ? null : pct((1 - remaining) * 100),
      resetsAt: msFromIso(b.reset_time)
    }];
  }));
}
async function probeAntigravityUsage(signal) {
  const bin = resolveAntigravityExecutable();
  if (!bin) throw new Error(ANTIGRAVITY_MISSING);
  const home = antigravityHome();
  const env = antigravityEnv();
  const dir = probeHome(home);
  const run = (args2) => cliOutput(bin, args2, { cwd: workdir(home), env, timeoutMs: COMMAND_TIMEOUT_MS, signal });
  stageSession(dir, { apiKey: usesApiKey(env) });
  const listed = await run([`--gemini_dir=${dir}`, "--output-format", "json", "models"]);
  if (listed.failed) {
    if (SIGNED_OUT_ERROR.test(listed.stderr)) return SIGNED_OUT;
    throw outdatedIfRejected(new Error(errorLine(listed.stderr)), ANTIGRAVITY_OUTDATED);
  }
  const models = modelsFromAgyList(listed.stdout);
  if (usesApiKey(env)) return { ...noLimits(null), models };
  const usage = await run([`--gemini_dir=${dir}`, "-p", "/usage", "--output-format", "json"]);
  let windows = [];
  try {
    if (!usage.failed) windows = windowsFromAgyUsage(usage.stdout);
  } catch {
  }
  return { status: "ok", account: null, windows, models };
}

// src/lib/devin/bin.ts
var DEVIN_MISSING = "Devin CLI is not installed on this machine \u2014 install it (curl -fsSL https://cli.devin.ai/install.sh | bash) and run `devin auth login`, or point TDS_DEVIN_BIN at the executable.";
function resolveDevinExecutable(lookup) {
  return resolveExecutable({ override: "TDS_DEVIN_BIN", command: "devin" }, lookup);
}

// src/lib/devin/execute.ts
var import_node_crypto6 = require("node:crypto");
var import_node_fs28 = require("node:fs");

// src/lib/devin/home.ts
var import_node_path23 = require("node:path");
var DEVIN_NOT_SIGNED_IN = "Devin CLI is not signed in on this machine \u2014 run `devin auth login` first (or set WINDSURF_API_KEY).";
var CONFIG_FILE = "config.json";
var CONFIG = `${JSON.stringify({
  version: 1,
  auto_update: false,
  attribution: false,
  read_config_from: { agents_standard: true, cursor: false, windsurf: false, claude: false, copilot: false, opencode: false, zed: false }
}, null, 2)}
`;
function devinHome() {
  return runtimeHome("devin-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
function ensureDevinHome() {
  const home = devinHome();
  ensureConfig(home, CONFIG_FILE, CONFIG);
  return home;
}
var configFile = (home) => (0, import_node_path23.join)(home, CONFIG_FILE);
var STORE_DB = "sessions.db";
function devinEnv(store) {
  return { ...process.env, CHISEL_SESSION_DB: (0, import_node_path23.join)(store, STORE_DB), CHISEL_LOG_STDERR: "0" };
}

// src/lib/devin/rpc.ts
var import_node_fs26 = require("node:fs");
function spawnDevinAgent(bin, opts) {
  (0, import_node_fs26.mkdirSync)(opts.store, { recursive: true });
  return spawnStdioRpc(bin, ["--config", configFile(opts.home), "acp"], {
    label: "devin",
    cwd: opts.cwd,
    env: { ...opts.env, ...devinEnv(opts.store) },
    // Bypass mode runs every tool; what still asks is an organization that took that mode away.
    autoReply: acpAutoReply(),
    callTimeoutMs: TIMEOUTS_MS.devinRpc,
    exitTimeoutMs: TIMEOUTS_MS.devinExit
  });
}
var handshake4 = (rpc) => acpInitialize(rpc);

// src/lib/devin/session.ts
var import_node_fs27 = require("node:fs");
var import_node_path24 = require("node:path");
var MIRRORED4 = [STORE_DB, `${STORE_DB}-wal`];
var HEAD4 = "tds_devin_session";
var FILE4 = "tds_devin_file";
var SESSION_ID3 = /^[\w-]{1,128}$/;
function packSession4(store, map) {
  if (!(0, import_node_fs27.existsSync)((0, import_node_path24.join)(store, STORE_DB))) return null;
  const lines = [JSON.stringify({ [HEAD4]: map.id, leaf: map.leaf, instructions: map.instructions })];
  for (const name of MIRRORED4) {
    if ((0, import_node_fs27.existsSync)((0, import_node_path24.join)(store, name))) lines.push(JSON.stringify({ [FILE4]: name, base64: (0, import_node_fs27.readFileSync)((0, import_node_path24.join)(store, name)).toString("base64") }));
  }
  return lines.join("\n") + "\n";
}
function unpackSession4(store, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD4}"`)) return null;
  const head = JSON.parse(lines[0]);
  const id = head[HEAD4] ?? "";
  if (!SESSION_ID3.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const name = record[FILE4];
    if (!name || !MIRRORED4.includes(name) || typeof record.base64 !== "string") return null;
    files.push([name, Buffer.from(record.base64, "base64")]);
  }
  (0, import_node_fs27.rmSync)(store, { recursive: true, force: true });
  (0, import_node_fs27.mkdirSync)(store, { recursive: true });
  for (const [name, data] of files) (0, import_node_fs27.writeFileSync)((0, import_node_path24.join)(store, name), data);
  return { id, ...head.leaf ? { leaf: head.leaf } : {}, ...head.instructions ? { instructions: head.instructions } : {} };
}
function codec5(home, sessionId) {
  const store = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession4(store, map),
    unpack: (body) => unpackSession4(store, body),
    drop: () => (0, import_node_fs27.rmSync)(store, { recursive: true, force: true })
  };
}
var devinSession = sessionMirror("devin", codec5);

// src/lib/devin/stream.ts
function toolStart5({ name, title, kind, input, path }) {
  switch (kind) {
    case "execute":
      return ["Bash", (detail(input, "command") || title).slice(0, 100)];
    case "read":
      return ["Read", path || title];
    case "edit":
      return [name === "write" ? "Write" : "Edit", path || title];
    case "fetch":
      return name === "web_search" ? ["WebSearch", detail(input, "query") || title] : ["WebFetch", detail(input, "url") || title];
    case "search": {
      const pattern = detail(input, "pattern", "query");
      if (name === "web_search") return ["WebSearch", pattern || title];
      if (name === "glob") return ["Glob", pattern || path || title];
      return ["Grep", pattern ? `"${pattern}"${path ? ` in ${path}` : ""}` : title];
    }
    // The rest (delete, move, MCP, todos, subagents) say it all in the title.
    default:
      return [title, ""];
  }
}
var started = (status) => typeof status === "string" && status !== "pending";
function createDevinStream(pump) {
  let live2 = false;
  const message = messageBuffer(pump);
  let failure2;
  const tools = /* @__PURE__ */ new Map();
  const announce = (call) => {
    if (call.announced) return;
    call.announced = true;
    pump.toolStart(...toolStart5(call));
  };
  const fill = (call, u) => {
    if (u.title) call.title = String(u.title);
    if (u.kind) call.kind = String(u.kind);
    if (u.rawInput && typeof u.rawInput === "object") call.input = u.rawInput;
    const name = u._meta?.["cognition.ai/inferenceToolName"];
    if (typeof name === "string") call.name = name;
    call.path = detail(call.input, "path", "file_path") || String(u.locations?.[0]?.path ?? "") || call.path;
  };
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      live2 = true;
    },
    // The prompt's response is the turn's end.
    turnEnded: () => {
      for (const call of tools.values()) announce(call);
      tools.clear();
      message.close();
    },
    // What stopped the agent, when it was an error.
    failure: () => failure2,
    handle(n) {
      if (!live2) return;
      if (n.method === "_cognition.ai/agent_stopped") {
        if (typeof n.params.errorMessage === "string" && n.params.errorMessage) failure2 = n.params.errorMessage;
        return;
      }
      if (n.method !== "session/update") return;
      const u = n.params.update ?? {};
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (t) message.chunk(t);
          break;
        }
        case "agent_thought_chunk":
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        // A card may open before its arguments are complete; the frame waits for the call to start.
        case "tool_call": {
          message.close();
          const call = { name: "", title: "tool", kind: "other", input: {}, path: "", announced: false };
          fill(call, u);
          tools.set(String(u.toolCallId), call);
          if (started(u.status)) announce(call);
          break;
        }
        case "tool_call_update": {
          const call = tools.get(String(u.toolCallId));
          if (!call) break;
          fill(call, u);
          if (started(u.status)) announce(call);
          break;
        }
        case "user_message_chunk":
          message.close();
          break;
      }
    }
  };
}

// src/lib/devin/execute.ts
var BYPASS = "bypass";
function resumable(known, resumeAt) {
  if (!known || !resumeAt || known.leaf === resumeAt) return known;
  console.warn(`[devin] rewind leaf ${resumeAt} is not session ${known.id}'s latest turn \u2014 starting over`);
  return null;
}
async function openSession3(rpc, cwd, known, mcpServers) {
  if (known) {
    try {
      const loaded = await rpc.call("session/load", { sessionId: known, cwd, mcpServers }, TIMEOUTS_MS.devinLoad);
      return { sessionId: known, fresh: false, configOptions: loaded?.configOptions ?? [] };
    } catch (err) {
      console.warn(`[devin] session/load ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  const created = await rpc.call("session/new", { cwd, mcpServers });
  return { sessionId: created.sessionId, fresh: true, configOptions: created.configOptions ?? [] };
}
async function bypassPermissions(rpc, { sessionId, configOptions }) {
  const mode = configOptions.find((o) => o.id === "mode");
  if (mode?.currentValue === BYPASS) return;
  if (!mode?.options?.some((o) => o.value === BYPASS)) {
    console.warn(`[devin] session ${sessionId} offers no ${BYPASS} mode \u2014 tools that ask for approval will be declined`);
    return;
  }
  await rpc.call("session/set_config_option", { sessionId, configId: "mode", value: BYPASS });
}
var asMessage = (text3) => text3.trimStart().startsWith("/") ? `Message:
${text3}` : text3;
function devinDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveDevinExecutable() ? null : DEVIN_MISSING,
    async run(ctx) {
      home = ensureDevinHome();
      const store = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const synced = ctx.ephemeral ? null : await devinSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const known = resumable(synced, step.resumeSessionAt);
      if (!known) (0, import_node_fs28.rmSync)(store, { recursive: true, force: true });
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const rpc = spawnDevinAgent(resolveDevinExecutable(), { home, store, cwd, env: step.secretEnv });
      const stream = createDevinStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Devin");
      try {
        await handshake4(rpc);
        const opened = await openSession3(rpc, cwd, known?.id ?? null, acpMcpServers(mcp.servers));
        const acpSessionId = opened.sessionId;
        await bypassPermissions(rpc, opened);
        await selectAcpModel(rpc, "Devin", opened, step.agent.modelId, step.agent.thinkingLevel);
        const instructions = turnInstructions(step, ctx.ephemeral);
        const stamp = instructions ? instructionsStamp(instructions) : void 0;
        let pending = opened.fresh || known?.instructions !== stamp ? instructions : "";
        const leaf = (0, import_node_crypto6.randomUUID)();
        if (!ctx.ephemeral) devinSession.maps(home).write(sessionId, { id: acpSessionId, leaf, instructions: stamp, etag: synced?.etag });
        let active = false;
        let error;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: acpSessionId });
        });
        await runSteeredTurns(ctx, step, {
          prepare: async (text3, images) => ({ text: text3, images }),
          // ACP has no call that adds to a running turn, so a steer waits for a follow-up turn.
          inject: async () => false,
          // The prompt response is the turn's end.
          async turn({ text: text3, images }) {
            const prompt = acpPrompt(pending ? withInstructions(pending, text3) : asMessage(text3), await downloadImages(images, stepId));
            pending = "";
            active = true;
            stream.turnStarted();
            idle.arm();
            try {
              const { stopReason } = await rpc.call("session/prompt", { sessionId: acpSessionId, prompt }, 0);
              if (stopReason === "refusal") error = "Devin refused the request";
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = isAcpAuthRequired(err) ? DEVIN_NOT_SIGNED_IN : err.rpc.message;
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            error ??= stream.failure();
            if (ctx.interrupted()) error = void 0;
            return !error;
          }
        });
        return { error, leafId: leaf };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        if (ctx.ephemeral) (0, import_node_fs28.rmSync)(store, { recursive: true, force: true });
      }
    },
    backup: (ctx) => devinSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeDevinStep = externalStep(devinDriver);
var rewindDevinSession = (step) => devinSession.rewind(devinHome(), step, atLatestLeaf);

// src/lib/devin/usage.ts
var import_node_fs29 = require("node:fs");
var RPC_TIMEOUT_MS4 = 3e4;
var STATUS_TIMEOUT_MS = 2e4;
function modelsFromDevinOptions(options) {
  const rows = options.find((o) => o.id === "model")?.options ?? [];
  return rows.flatMap((m) => typeof m.value === "string" && m.value ? [{ id: m.value, label: typeof m.name === "string" && m.name ? m.name : m.value, effortLevels: [] }] : []);
}
function readingFromDevinStatus(text3) {
  if (/Not logged in|Failed to load credentials/.test(text3)) return SIGNED_OUT;
  const email = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(text3)?.[0] ?? null;
  return { status: "ok", account: { id: email, email, plan: null }, windows: [] };
}
async function authStatus(bin, cwd, signal) {
  const status = await cliOutput(bin, ["auth", "status"], { cwd, timeoutMs: STATUS_TIMEOUT_MS, signal });
  return status.failed ? "" : status.stdout;
}
async function probeDevinUsage(signal) {
  const bin = resolveDevinExecutable();
  if (!bin) throw new Error(DEVIN_MISSING);
  const home = ensureDevinHome();
  const cwd = workdir(home);
  const reading = readingFromDevinStatus(await authStatus(bin, cwd, signal));
  if (reading.status === "signed_out" && !process.env.WINDSURF_API_KEY) return reading;
  const store = probeHome(home);
  const rpc = spawnDevinAgent(bin, { home, store, cwd });
  const stop = async () => {
    await rpc.close();
    (0, import_node_fs29.rmSync)(store, { recursive: true, force: true });
  };
  return withSpawned(signal, stop, async () => {
    await handshake4(rpc);
    const { configOptions } = await rpc.call("session/new", { cwd, mcpServers: [] }, RPC_TIMEOUT_MS4);
    return { ...reading, status: "ok", models: modelsFromDevinOptions(configOptions ?? []) };
  });
}

// src/lib/copilot/bin.ts
var COPILOT_MISSING = "GitHub Copilot CLI is not installed on this machine \u2014 install it (npm i -g @github/copilot) and run `copilot login`, or point TDS_COPILOT_BIN at the executable.";
function resolveCopilotExecutable(lookup) {
  return resolveExecutable({ override: "TDS_COPILOT_BIN", command: "copilot" }, lookup);
}

// src/lib/copilot/execute.ts
var import_node_fs32 = require("node:fs");

// src/lib/copilot/home.ts
var import_node_fs30 = require("node:fs");
var import_node_os8 = require("node:os");
var import_node_path25 = require("node:path");

// src/lib/jsonc.ts
function parseJsonc(text3) {
  let out = "";
  for (let i = 0; i < text3.length; i++) {
    const ch = text3[i];
    if (ch === '"') {
      const start = i;
      for (i++; i < text3.length && text3[i] !== '"'; i++) if (text3[i] === "\\") i++;
      out += text3.slice(start, i + 1);
    } else if (ch === "/" && text3[i + 1] === "/") {
      while (i < text3.length && text3[i] !== "\n") i++;
    } else if (ch === "/" && text3[i + 1] === "*") {
      i = text3.indexOf("*/", i + 2);
      if (i === -1) break;
      i++;
    } else if (ch === "}" || ch === "]") {
      out = out.replace(/,\s*$/, "") + ch;
    } else {
      out += ch;
    }
  }
  return JSON.parse(out);
}
var isJsonObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function readJsoncObject(read) {
  try {
    const parsed = parseJsonc(read());
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// src/lib/copilot/home.ts
var COPILOT_NOT_SIGNED_IN = "GitHub Copilot CLI is not signed in on this machine \u2014 run `copilot login` first (or set COPILOT_GITHUB_TOKEN).";
function userCopilotHome() {
  return process.env.COPILOT_HOME || (0, import_node_path25.join)((0, import_node_os8.homedir)(), ".copilot");
}
var SIGN_IN_KEYS = ["loggedInUsers", "lastLoggedInUser", "authTokens", "copilotTokens", "logged_in_users", "last_logged_in_user", "copilot_tokens"];
var readConfig = (path) => readJsoncObject(() => (0, import_node_fs30.readFileSync)(path, "utf8")) ?? {};
function copilotHome() {
  return runtimeHome("copilot-home", ["workdir", "tds-sessions", "session-state"]);
}
function ensureCopilotHome() {
  const home = copilotHome();
  const path = (0, import_node_path25.join)(home, "config.json");
  const user = readConfig((0, import_node_path25.join)(userCopilotHome(), "config.json"));
  const own = readConfig(path);
  const next = { ...own };
  for (const key of SIGN_IN_KEYS) {
    if (key in user) next[key] = user[key];
    else delete next[key];
  }
  if (JSON.stringify(next) !== JSON.stringify(own)) {
    atomicWriteFileSync(path, JSON.stringify(next, null, 2) + "\n", { mode: 384 });
  }
  return home;
}
function copilotEnv(home, secrets = {}) {
  return { ...process.env, ...secrets, COPILOT_HOME: home };
}
function probeLogDir(home) {
  return (0, import_node_path25.join)(home, "probe-logs");
}

// src/lib/copilot/rpc.ts
var import_node_path26 = require("node:path");
var COPILOT_OUTDATED = "GitHub Copilot CLI on this machine is too old to be driven by tds \u2014 update it (`copilot update`).";
var PROTOCOL_VERSION = 3;
function spawnCopilotServer(bin, opts) {
  const logDir = opts.logDir ? ["--log-dir", (0, import_node_path26.relative)(opts.cwd, opts.logDir)] : [];
  return spawnStdioRpc(bin, ["--headless", "--no-auto-update", ...logDir, "--stdio"], {
    label: "copilot",
    cwd: opts.cwd,
    env: copilotEnv(opts.home, opts.env),
    framed: true,
    autoReply: () => null,
    callTimeoutMs: TIMEOUTS_MS.copilotRpc,
    exitTimeoutMs: TIMEOUTS_MS.copilotExit
  });
}
async function handshake5(rpc) {
  let version;
  try {
    version = (await rpc.call("connect", {})).protocolVersion;
  } catch (err) {
    if (!isRpcError(err)) throw err;
  }
  if (!version || version < PROTOCOL_VERSION) throw new Error(COPILOT_OUTDATED);
}
function authStatus2(rpc, timeoutMs) {
  return rpc.call("auth.getStatus", {}, timeoutMs);
}

// src/lib/copilot/session.ts
var import_node_fs31 = require("node:fs");
var import_node_path27 = require("node:path");
var sessionDir3 = (home, id) => (0, import_node_path27.join)(home, "session-state", id);
var MIRRORED5 = ["events.jsonl", "workspace.yaml", "plan.md"];
var MIRRORED_DIRS2 = ["checkpoints"];
function mirroredFiles2(dir) {
  const out = MIRRORED5.filter((f) => (0, import_node_fs31.existsSync)((0, import_node_path27.join)(dir, f)));
  for (const sub of MIRRORED_DIRS2) {
    if (!(0, import_node_fs31.existsSync)((0, import_node_path27.join)(dir, sub))) continue;
    for (const name of (0, import_node_fs31.readdirSync)((0, import_node_path27.join)(dir, sub)).sort()) {
      if ((0, import_node_fs31.statSync)((0, import_node_path27.join)(dir, sub, name)).isFile()) out.push(`${sub}/${name}`);
    }
  }
  return out;
}
var HEAD5 = "tds_copilot_session";
var FILE5 = "tds_copilot_file";
var SESSION_ID4 = /^[0-9a-f-]{36}$/i;
function packSession5(home, id) {
  const dir = sessionDir3(home, id);
  if (!(0, import_node_fs31.existsSync)((0, import_node_path27.join)(dir, "events.jsonl"))) return null;
  const lines = [JSON.stringify({ [HEAD5]: id })];
  for (const rel of mirroredFiles2(dir)) lines.push(JSON.stringify({ [FILE5]: rel, text: (0, import_node_fs31.readFileSync)((0, import_node_path27.join)(dir, rel), "utf8") }));
  return lines.join("\n") + "\n";
}
function unpackSession5(home, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD5}"`)) return null;
  const id = String(JSON.parse(lines[0])[HEAD5] ?? "");
  if (!SESSION_ID4.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const rel = record[FILE5];
    if (!rel || rel.startsWith("/") || rel.split("/").includes("..") || typeof record.text !== "string") return null;
    files.push([rel, record.text]);
  }
  const dir = sessionDir3(home, id);
  (0, import_node_fs31.rmSync)(dir, { recursive: true, force: true });
  for (const [rel, text3] of files) {
    (0, import_node_fs31.mkdirSync)((0, import_node_path27.dirname)((0, import_node_path27.join)(dir, rel)), { recursive: true });
    (0, import_node_fs31.writeFileSync)((0, import_node_path27.join)(dir, rel), text3);
  }
  return id;
}
function rewindCut(home, id, leaf) {
  let text3;
  try {
    text3 = (0, import_node_fs31.readFileSync)((0, import_node_path27.join)(sessionDir3(home, id), "events.jsonl"), "utf8");
  } catch {
    return void 0;
  }
  let found2 = false;
  for (const line of text3.split("\n")) {
    if (!line) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (found2 && event.type === "user.message" && event.id) return event.id;
    if (event.id === leaf) found2 = true;
  }
  return found2 ? null : void 0;
}
function codec6(home) {
  return {
    pack: (map) => packSession5(home, map.id),
    unpack: (body) => {
      const id = unpackSession5(home, body);
      return id ? { id } : null;
    },
    drop: (map) => (0, import_node_fs31.rmSync)(sessionDir3(home, map.id), { recursive: true, force: true })
  };
}
var copilotSession = sessionMirror("copilot", codec6);

// src/lib/copilot/stream.ts
function patchedFiles(patch) {
  const paths2 = typeof patch === "string" ? [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((m) => m[1].trim()) : [];
  return paths2.length ? `${paths2[0]}${paths2.length > 1 ? ` +${paths2.length - 1}` : ""}` : "";
}
function toolStart6(d) {
  if (d.mcpServerName) return [`${d.mcpServerName}/${d.mcpToolName ?? d.toolName}`, ""];
  const input = d.arguments;
  switch (d.toolName) {
    case "bash":
    case "powershell":
      return ["Bash", detail(input, "command").slice(0, 100)];
    case "view":
      return ["Read", detail(input, "path")];
    case "create":
      return ["Write", detail(input, "path")];
    case "edit":
    case "str_replace_editor":
      return ["Edit", detail(input, "path")];
    case "apply_patch":
      return ["Edit", patchedFiles(input)];
    case "grep":
    case "rg": {
      const path = detail(input, "paths", "path");
      return ["Grep", `"${detail(input, "pattern")}"${path ? ` in ${path}` : ""}`];
    }
    case "glob":
      return ["Glob", detail(input, "pattern")];
    case "web_fetch":
      return ["WebFetch", detail(input, "url")];
    case "web_search":
      return ["WebSearch", detail(input, "query")];
    case "task":
      return ["Task", detail(input, "description")];
    default:
      return [String(d.toolName ?? "tool"), detail(input, "path", "command", "pattern", "query", "url", "description")];
  }
}
function createCopilotStream(pump, modelId, thinkingLevel) {
  let started2 = false;
  let message;
  let leaf;
  let error;
  let retries = 0;
  let context;
  const calls = [];
  return {
    // Only the turn's own events count, not what opening the session reports.
    turnStarted: () => {
      started2 = true;
    },
    // The last event the session's log keeps: where a rewind to this step cuts.
    leaf: () => leaf,
    // What ended the run, unless the model went on answering after it.
    error: () => error,
    handle(n) {
      if (!started2 || n.method !== "session.event") return;
      const event = n.params.event ?? {};
      const d = event.data ?? {};
      const root = !event.agentId;
      if (root && !event.ephemeral && event.id) leaf = String(event.id);
      switch (event.type) {
        // A steer taken mid-run, or a tool call between two answers, starts a further message.
        case "assistant.message_delta": {
          const t = String(d.deltaContent ?? "");
          if (!root || !t) break;
          if (d.messageId !== message) {
            message = d.messageId;
            pump.gap();
          }
          error = void 0;
          pump.text(t);
          break;
        }
        // The finished message; one that only calls tools has no content.
        case "assistant.message":
          if (!root || !d.content) break;
          if (d.messageId !== message) {
            message = d.messageId;
            pump.gap();
          }
          error = void 0;
          pump.textDone(String(d.content));
          break;
        case "assistant.reasoning_delta":
          if (root) pump.thinking(String(d.deltaContent ?? ""));
          break;
        case "tool.execution_start":
          pump.toolStart(...toolStart6(d));
          break;
        // The CLI retries a failed model call itself; one it gives up on ends in session.error.
        case "model.call_failure":
          if (root) pump.retry(++retries, 0);
          break;
        case "session.error":
          if (root) error = String(d.message ?? "GitHub Copilot returned an error");
          break;
        case "session.usage_info":
          if (root && typeof d.currentTokens === "number" && d.tokenLimit > 0) context = { tokens: d.currentTokens, contextWindow: d.tokenLimit };
          break;
        case "assistant.usage": {
          const read = Number(d.cacheReadTokens ?? 0);
          const written = Number(d.cacheWriteTokens ?? 0);
          calls.push({
            provider: "copilot",
            modelId: typeof d.model === "string" && d.model ? d.model : modelId,
            thinkingLevel: thinkingLevel ?? "",
            at: Date.now(),
            usage: {
              // inputTokens counts cache reads and writes too; keep the platform's split.
              inputTokens: Math.max(0, Number(d.inputTokens ?? 0) - read - written),
              outputTokens: Number(d.outputTokens ?? 0),
              cacheReadTokens: read,
              cacheWriteTokens: written,
              costUsd: 0
            }
          });
          break;
        }
      }
    },
    report() {
      if (!calls.length) return {};
      return { modelCalls: calls, ...context ? { contextUsage: context } : {} };
    }
  };
}

// src/lib/copilot/execute.ts
function sessionOptions(cwd, step, ephemeral = false, mcpServers = {}) {
  const instructions = step ? turnInstructions(step, ephemeral) : "";
  return {
    workingDirectory: cwd,
    streaming: true,
    requestPermission: true,
    includeSubAgentStreamingEvents: false,
    memory: { enabled: false },
    // An MCP server's env holds the values themselves, not the names of variables to read.
    envValueMode: "direct",
    ...step?.agent.modelId ? { model: step.agent.modelId } : {},
    ...step?.agent.thinkingLevel ? { reasoningEffort: step.agent.thinkingLevel } : {},
    ...instructions ? { systemMessage: { mode: step?.systemPrompt ? "replace" : "append", content: instructions } } : {},
    ...Object.keys(mcpServers).length ? { mcpServers } : {}
  };
}
async function openSession4(rpc, home, known, options, resumeAt) {
  const cut = known && resumeAt ? rewindCut(home, known, resumeAt) : null;
  if (known && cut === void 0) {
    console.warn(`[copilot] rewind leaf ${resumeAt} not in session ${known} \u2014 starting over`);
  } else if (known) {
    try {
      await rpc.call("session.resume", { sessionId: known, ...options }, TIMEOUTS_MS.copilotResume);
      if (cut) await rpc.call("session.history.truncate", { sessionId: known, eventId: cut });
      return known;
    } catch (err) {
      console.warn(`[copilot] resuming session ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  const { sessionId } = await rpc.call("session.create", options);
  return sessionId;
}
function createRuns(rpc, sessionId) {
  let sending = 0;
  let idle = false;
  let finish = null;
  const settle = () => {
    if (!finish || !idle || sending) return;
    const done = finish;
    finish = null;
    done();
  };
  const died = rpc.waitFor(() => void 0);
  died.catch(() => {
  });
  const send = async (input, steer) => {
    sending++;
    try {
      await rpc.call("session.send", { sessionId, prompt: input.text, ...input.attachments.length ? { attachments: input.attachments } : {}, ...steer ? { mode: "immediate" } : {} }, 0);
      idle = false;
    } finally {
      sending--;
      settle();
    }
  };
  return {
    handle(n) {
      const event = n.params.event ?? {};
      if (event.agentId) return;
      if (event.type === "session.idle") {
        idle = true;
        settle();
      } else if (event.type === "permission.requested" && !event.data?.resolvedByHook) {
        void rpc.call("session.permissions.handlePendingPermissionRequest", { sessionId, requestId: event.data?.requestId, result: { kind: "user-not-available" } }).catch(() => {
        });
      }
    },
    active: () => !!finish,
    // One run to its end.
    async run(input) {
      idle = false;
      const done = new Promise((resolve6) => {
        finish = resolve6;
      });
      try {
        await send(input, false);
        await Promise.race([done, died]);
      } finally {
        finish = null;
      }
    },
    // Steer the run in flight; false when there is none or the server refused the message.
    async steer(input) {
      if (!finish) return false;
      try {
        await send(input, true);
        return true;
      } catch (err) {
        if (isRpcError(err)) return false;
        throw err;
      }
    }
  };
}
async function userInput2(text3, images, stepId) {
  const downloaded = await downloadImages(images, stepId);
  return {
    text: text3,
    attachments: downloaded.map((img, i) => ({ type: "blob", data: img.data, mimeType: img.mimeType, displayName: `image-${i + 1}.${img.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin"}` }))
  };
}
function copilotDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveCopilotExecutable() ? null : COPILOT_MISSING,
    async run(ctx) {
      home = ensureCopilotHome();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : (await copilotSession.sync(home, sessionId, step.sessionRestoreUrl, stepId))?.id ?? null;
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const rpc = spawnCopilotServer(resolveCopilotExecutable(), { home, cwd, env: step.secretEnv });
      const stream = createCopilotStream(ctx.pump, step.agent.modelId, step.agent.thinkingLevel);
      const idle = idleWatch(rpc, "GitHub Copilot");
      let copilotSessionId = "";
      try {
        await handshake5(rpc);
        if (!(await authStatus2(rpc)).isAuthenticated) throw new Error(COPILOT_NOT_SIGNED_IN);
        const opened = await openSession4(rpc, home, known, sessionOptions(cwd, step, ctx.ephemeral, copilotMcpServers(mcp.servers)), step.resumeSessionAt);
        copilotSessionId = opened;
        if (!ctx.ephemeral && opened !== known) copilotSession.maps(home).write(sessionId, { ...copilotSession.maps(home).read(sessionId), id: opened });
        await Promise.all([
          rpc.call("session.permissions.setApproveAll", { sessionId: opened, enabled: true }),
          rpc.call("session.options.update", { sessionId: opened, coauthorEnabled: false })
        ]);
        const runs = createRuns(rpc, opened);
        rpc.onNotification((n) => {
          if (n.method !== "session.event" || n.params.sessionId !== opened) return;
          stream.handle(n);
          runs.handle(n);
        });
        ctx.onStop(() => {
          if (runs.active()) void rpc.call("session.abort", { sessionId: opened }).catch(() => {
          });
        });
        await runSteeredTurns(ctx, step, {
          prepare: (text3, images) => userInput2(text3, images, stepId),
          inject: (input) => runs.steer(input),
          async turn(input) {
            stream.turnStarted();
            idle.arm();
            try {
              await runs.run(input);
            } finally {
              idle.disarm();
            }
            return !stream.error();
          }
        });
        return { error: stream.error(), leafId: stream.leaf(), ...stream.report() };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        if (ctx.ephemeral && copilotSessionId) (0, import_node_fs32.rmSync)(sessionDir3(home, copilotSessionId), { recursive: true, force: true });
      }
    },
    backup: (ctx) => copilotSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeCopilotStep = externalStep(copilotDriver);
async function rewindCopilotSession(step) {
  const { stepId, sessionId } = step;
  if (!sessionId) return;
  const leaf = step.restore?.sessionLeafEntryId;
  if (!leaf) return copilotSession.reset(copilotHome(), sessionId, step.sessionBackupUrl, stepId);
  const home = ensureCopilotHome();
  const known = (await copilotSession.sync(home, sessionId, step.sessionRestoreUrl, stepId))?.id;
  if (!known) return;
  const cut = rewindCut(home, known, leaf);
  if (cut === null) return;
  if (cut === void 0) return copilotSession.reset(home, sessionId, step.sessionBackupUrl, stepId);
  const bin = resolveCopilotExecutable();
  if (!bin) throw new Error(COPILOT_MISSING);
  const cwd = workdir(home);
  const rpc = spawnCopilotServer(bin, { home, cwd });
  try {
    await handshake5(rpc);
    await rpc.call("session.resume", { sessionId: known, ...sessionOptions(cwd) }, TIMEOUTS_MS.copilotResume);
    await rpc.call("session.history.truncate", { sessionId: known, eventId: cut });
  } finally {
    await rpc.close();
  }
  await copilotSession.backup(home, sessionId, step.sessionBackupUrl, void 0, stepId);
}

// src/lib/copilot/usage.ts
var import_node_fs33 = require("node:fs");
var RPC_TIMEOUT_MS5 = 2e4;
var QUOTA_LABELS = { premium_interactions: "Premium requests", chat: "Chat", completions: "Completions" };
function modelsFromCopilotList(models) {
  return models.flatMap((m) => {
    if (typeof m.id !== "string" || !m.id || m.policy?.state === "disabled") return [];
    const efforts = Array.isArray(m.supportedReasoningEfforts) ? m.supportedReasoningEfforts.filter((e) => typeof e === "string" && !!e) : [];
    return [{ id: m.id, label: typeof m.name === "string" && m.name ? m.name : m.id, effortLevels: efforts }];
  });
}
function readingFromCopilotQuota(auth, plan, quota) {
  if (!auth.isAuthenticated) return SIGNED_OUT;
  const login = auth.login ?? null;
  const account = { id: login, email: login, plan };
  if (!quota) return { status: "ok", account, windows: [] };
  const metered = Object.entries(quota.quotaSnapshots ?? {}).filter((e) => !!e[1] && !e[1].isUnlimitedEntitlement).sort(([a], [b]) => Number(b === "premium_interactions") - Number(a === "premium_interactions"));
  if (!metered.length) return noLimits(account);
  const windows = metered.map(([type, snap]) => ({
    key: `limit:${type}`,
    label: QUOTA_LABELS[type] ?? type.replace(/_/g, " "),
    utilization: typeof snap.remainingPercentage === "number" ? pct(100 - snap.remainingPercentage) : null,
    resetsAt: msFromIso(snap.resetDate)
  }));
  return { status: "ok", account, windows };
}
async function planOf(rpc) {
  try {
    const { authInfo } = await rpc.call("account.getCurrentAuth", {}, RPC_TIMEOUT_MS5);
    const plan = authInfo?.copilotUser?.copilot_plan;
    return typeof plan === "string" && plan ? plan : null;
  } catch {
    return null;
  }
}
async function probeCopilotUsage(signal) {
  const bin = resolveCopilotExecutable();
  if (!bin) throw new Error(COPILOT_MISSING);
  const home = ensureCopilotHome();
  const logDir = probeLogDir(home);
  const rpc = spawnCopilotServer(bin, { home, cwd: workdir(home), logDir });
  const stop = async () => {
    await rpc.close();
    (0, import_node_fs33.rmSync)(logDir, { recursive: true, force: true });
  };
  return withSpawned(signal, stop, async () => {
    await handshake5(rpc);
    const auth = await authStatus2(rpc, RPC_TIMEOUT_MS5);
    if (!auth.isAuthenticated) return SIGNED_OUT;
    const [listed, quota, plan] = await Promise.all([
      rpc.call("models.list", {}, RPC_TIMEOUT_MS5),
      rpc.call("account.getQuota", {}, RPC_TIMEOUT_MS5).catch(() => null),
      planOf(rpc)
    ]);
    return { ...readingFromCopilotQuota(auth, plan, quota), models: modelsFromCopilotList(listed.models ?? []) };
  });
}

// src/lib/gemini-cli/bin.ts
var GEMINI_MISSING = "Gemini CLI is not installed on this machine \u2014 install it (npm install -g @google/gemini-cli) and run `gemini` once to sign in, or point TDS_GEMINI_CLI_BIN at the executable.";
var GEMINI_OUTDATED = "Gemini CLI on this machine is too old to be driven by tds \u2014 update it (npm install -g @google/gemini-cli@latest).";
function resolveGeminiExecutable(lookup) {
  return resolveExecutable({ override: "TDS_GEMINI_CLI_BIN", command: "gemini" }, lookup);
}

// src/lib/gemini-cli/execute.ts
var import_node_fs36 = require("node:fs");

// src/lib/gemini-cli/home.ts
var import_node_fs34 = require("node:fs");
var import_node_os9 = require("node:os");
var import_node_path28 = require("node:path");
var GEMINI_NOT_SIGNED_IN = "Gemini CLI is not signed in on this machine \u2014 run `gemini` once and sign in first (or set GEMINI_API_KEY).";
function geminiHome() {
  return runtimeHome("gemini-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
var configDir = (dir) => (0, import_node_path28.join)(dir, ".gemini");
var PROJECT = "tds";
var chatsDir = (dir) => (0, import_node_path28.join)(configDir(dir), "tmp", PROJECT, "chats");
var projectKey = (cwd) => process.platform === "win32" ? (0, import_node_path28.resolve)(cwd).toLowerCase() : (0, import_node_path28.resolve)(cwd);
var GOOGLE_SIGN_IN = "oauth-personal";
var GOOGLE_CREDENTIALS = "oauth_creds.json";
var SIGN_IN_FILES2 = [GOOGLE_CREDENTIALS, "google_accounts.json", ".env"];
function ownerConfigDir() {
  return configDir(process.env.GEMINI_CLI_HOME || (0, import_node_os9.homedir)());
}
function signInMethod(owner = ownerConfigDir()) {
  try {
    const selected = JSON.parse((0, import_node_fs34.readFileSync)((0, import_node_path28.join)(owner, "settings.json"), "utf8")).security?.auth?.selectedType;
    if (typeof selected === "string" && selected) return selected;
  } catch {
  }
  return (0, import_node_fs34.existsSync)((0, import_node_path28.join)(owner, GOOGLE_CREDENTIALS)) ? GOOGLE_SIGN_IN : null;
}
function signedIn2(method, env, owner = ownerConfigDir()) {
  if (method === GOOGLE_SIGN_IN) return (0, import_node_fs34.existsSync)((0, import_node_path28.join)(owner, GOOGLE_CREDENTIALS));
  return !!method || !!env.GEMINI_API_KEY;
}
var usesGoogleSignIn = (method) => method === GOOGLE_SIGN_IN;
function geminiEnv(dir, secrets) {
  return { ...process.env, ...secrets, GEMINI_CLI_HOME: dir, GEMINI_CLI_TRUST_WORKSPACE: "true", NO_BROWSER: "true" };
}
var settings = (method) => ({
  general: { enableAutoUpdate: false, enableAutoUpdateNotification: false, sessionRetention: { enabled: false } },
  context: { fileName: ["GEMINI.md", "AGENTS.md"] },
  ...method ? { security: { auth: { selectedType: method } } } : {}
});
function stageSession2(dir, stage, owner = ownerConfigDir()) {
  const config = configDir(dir);
  (0, import_node_fs34.mkdirSync)(config, { recursive: true });
  (0, import_node_fs34.writeFileSync)((0, import_node_path28.join)(config, "settings.json"), `${JSON.stringify(settings(stage.method), null, 2)}
`);
  for (const file2 of SIGN_IN_FILES2) {
    if ((0, import_node_fs34.existsSync)((0, import_node_path28.join)(owner, file2))) linkAuth((0, import_node_path28.join)(owner, file2), config, "gemini");
  }
  (0, import_node_fs34.writeFileSync)((0, import_node_path28.join)(config, "projects.json"), `${JSON.stringify({ projects: { [projectKey(stage.cwd)]: PROJECT } }, null, 2)}
`);
  for (const base of ["tmp", "history"]) (0, import_node_fs34.rmSync)((0, import_node_path28.join)(config, base, PROJECT, ".project_root"), { force: true });
  if (stage.instructions) (0, import_node_fs34.writeFileSync)((0, import_node_path28.join)(config, "GEMINI.md"), `${stage.instructions}
`);
  else (0, import_node_fs34.rmSync)((0, import_node_path28.join)(config, "GEMINI.md"), { force: true });
}

// src/lib/gemini-cli/rpc.ts
var import_promises6 = require("node:timers/promises");
var RENAMED_TOOLS = { ask_user: "ask_the_user" };
var SIGN_IN_PROMPT = /Please visit the following URL to authorize|Enter the authorization code/;
function spawnGeminiAgent(bin, opts) {
  let signedOut = false;
  let lastUpdate = 0;
  const rpc = spawnStdioRpc(bin, ["--acp", "--approval-mode", "yolo", ...opts.model ? ["--model", opts.model] : []], {
    label: "gemini",
    cwd: opts.cwd,
    env: geminiEnv(opts.dir, opts.env),
    // YOLO mode runs every tool; what still asks is a policy that wants a human.
    autoReply: acpAutoReply(),
    callTimeoutMs: TIMEOUTS_MS.geminiRpc,
    exitTimeoutMs: TIMEOUTS_MS.geminiExit,
    text(line) {
      if (signedOut || !SIGN_IN_PROMPT.test(line)) return;
      signedOut = true;
      void rpc.close();
    }
  });
  rpc.onNotification(() => {
    lastUpdate = Date.now();
  });
  return {
    ...rpc,
    signedOut: () => signedOut,
    // session/load answers while the history it replays is still streaming out, and a replayed
    // update reads exactly like a turn's own: wait until they have stopped.
    async replayed() {
      for (; ; ) {
        const quiet = Date.now() - lastUpdate;
        if (quiet >= TIMEOUTS_MS.geminiReplayQuiet) return;
        await (0, import_promises6.setTimeout)(TIMEOUTS_MS.geminiReplayQuiet - quiet);
      }
    }
  };
}
async function handshake6(rpc) {
  try {
    await acpInitialize(rpc);
  } catch (err) {
    if (rpc.signedOut()) throw new Error(GEMINI_NOT_SIGNED_IN);
    if (err instanceof RpcServerExit || isRpcError(err)) throw err;
    throw new Error(`Gemini CLI did not start within ${TIMEOUTS_MS.geminiRpc / 1e3}s \u2014 it signs in before it answers, so check its sign-in (run \`gemini\`) and the network it reaches Google over.`);
  }
}
var signInError = (err) => new Error(`${err.rpc.message.replace(/[.\s]+$/, "")}. ${GEMINI_NOT_SIGNED_IN}`);
async function openSession5(rpc, cwd, known, mcpServers) {
  if (known) {
    try {
      await rpc.call("session/load", { sessionId: known, cwd, mcpServers }, TIMEOUTS_MS.geminiLoad);
      await rpc.replayed();
      return known;
    } catch (err) {
      if (isAcpAuthRequired(err)) throw signInError(err);
      console.warn(`[gemini] session/load ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  try {
    return (await rpc.call("session/new", { cwd, mcpServers })).sessionId;
  } catch (err) {
    throw isAcpAuthRequired(err) ? signInError(err) : err;
  }
}

// src/lib/gemini-cli/session.ts
var import_node_fs35 = require("node:fs");
var import_node_path29 = require("node:path");
var ownLog = (dir, id) => (0, import_node_path29.join)(chatsDir(dir), `session-${id}.jsonl`);
var isLog = (name) => name.startsWith("session-") && name.endsWith(".jsonl");
function logs(dir) {
  try {
    return (0, import_node_fs35.readdirSync)(chatsDir(dir)).filter(isLog);
  } catch {
    return [];
  }
}
function sessionOf(path) {
  const head = Buffer.alloc(4096);
  const fd = (0, import_node_fs35.openSync)(path, "r");
  try {
    const line = head.toString("utf8", 0, (0, import_node_fs35.readSync)(fd, head, 0, head.length, 0)).split("\n")[0];
    return String(JSON.parse(line).sessionId ?? "") || null;
  } catch {
    return null;
  } finally {
    (0, import_node_fs35.closeSync)(fd);
  }
}
function logOf(dir, id) {
  const sized = logs(dir).map((name) => (0, import_node_path29.join)(chatsDir(dir), name)).filter((path) => path === ownLog(dir, id) || sessionOf(path) === id).map((path) => ({ path, own: path === ownLog(dir, id), size: (0, import_node_fs35.statSync)(path).size }));
  return sized.sort((a, b) => Number(b.own) - Number(a.own) || b.size - a.size)[0]?.path ?? null;
}
var isMessage = (record) => typeof record?.id === "string";
function readLog(path) {
  let metadata = {};
  const messages = /* @__PURE__ */ new Map();
  const replace = (list) => {
    if (!Array.isArray(list)) return;
    messages.clear();
    for (const m of list) if (isMessage(m)) messages.set(m.id, m);
  };
  for (const line of (0, import_node_fs35.readFileSync)(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      return null;
    }
    if (typeof record?.$rewindTo === "string") {
      const ids = [...messages.keys()];
      const from = ids.indexOf(record.$rewindTo);
      for (const id of from === -1 ? ids : ids.slice(from)) messages.delete(id);
    } else if (isMessage(record)) {
      messages.set(record.id, record);
    } else if (record?.$set && typeof record.$set === "object") {
      const { messages: snapshot, ...rest2 } = record.$set;
      replace(snapshot);
      metadata = { ...metadata, ...rest2 };
    } else if (typeof record?.sessionId === "string" && typeof record.projectHash === "string") {
      const { messages: initial, ...rest2 } = record;
      replace(initial);
      metadata = { ...metadata, ...rest2 };
    } else {
      return null;
    }
  }
  return { metadata, messages: [...messages.values()] };
}
function writeLog(path, { metadata: { memoryScratchpad: _, ...metadata }, messages }) {
  atomicWriteFileSync(path, `${JSON.stringify(metadata)}
${JSON.stringify({ $set: { messages } })}
`);
}
function withoutEchoedResponses(messages) {
  const answered = new Set(messages.flatMap((m) => (m.toolCalls ?? []).filter((c) => c.result).map((c) => c.id)));
  const echoes = (m) => m.type === "user" && Array.isArray(m.content) && m.content.length > 0 && m.content.every((part) => answered.has(part?.functionResponse?.id));
  return messages.filter((m) => !echoes(m));
}
function settleSession(dir, id) {
  const found2 = logOf(dir, id);
  for (const name of logs(dir)) {
    if ((0, import_node_path29.join)(chatsDir(dir), name) !== found2) (0, import_node_fs35.rmSync)((0, import_node_path29.join)(chatsDir(dir), name), { force: true });
  }
  if (!found2) return void 0;
  if (found2 !== ownLog(dir, id)) (0, import_node_fs35.renameSync)(found2, ownLog(dir, id));
  const log = readLog(ownLog(dir, id));
  if (!log) return void 0;
  const messages = withoutEchoedResponses(log.messages);
  writeLog(ownLog(dir, id), { ...log, messages });
  const last = messages.at(-1);
  return last && `${id}@${last.id}`;
}
function rewindSession(dir, id, leaf) {
  const at = leaf.lastIndexOf("@");
  const path = logOf(dir, id);
  const log = path && leaf.slice(0, at) === id ? readLog(path) : null;
  const kept = log ? log.messages.findIndex((m) => m.id === leaf.slice(at + 1)) + 1 : 0;
  if (!path || !log || !kept) return false;
  if (kept < log.messages.length) writeLog(path, { ...log, messages: log.messages.slice(0, kept) });
  return true;
}
var HEAD6 = "tds_gemini_session";
var SESSION_ID5 = /^[0-9a-f-]{36}$/i;
function packSession6(dir, map) {
  const log = logOf(dir, map.id);
  return log ? `${JSON.stringify({ [HEAD6]: map.id })}
${(0, import_node_fs35.readFileSync)(log, "utf8")}` : null;
}
function unpackSession6(dir, body) {
  const end = body.indexOf("\n");
  const head = end === -1 ? body : body.slice(0, end);
  if (!head.startsWith(`{"${HEAD6}"`)) return null;
  const id = String(JSON.parse(head)[HEAD6] ?? "");
  if (!SESSION_ID5.test(id)) return null;
  (0, import_node_fs35.rmSync)(chatsDir(dir), { recursive: true, force: true });
  (0, import_node_fs35.mkdirSync)(chatsDir(dir), { recursive: true });
  (0, import_node_fs35.writeFileSync)(ownLog(dir, id), end === -1 ? "" : body.slice(end + 1));
  return { id };
}
function codec7(home, sessionId) {
  const dir = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession6(dir, map),
    unpack: (body) => unpackSession6(dir, body),
    drop: () => (0, import_node_fs35.rmSync)(dir, { recursive: true, force: true })
  };
}
var geminiSession = sessionMirror("gemini", codec7);

// src/lib/gemini-cli/stream.ts
var TOOL_NAMES2 = {
  run_shell_command: "Bash",
  read_file: "Read",
  read_many_files: "Read",
  write_file: "Write",
  replace: "Edit",
  grep_search: "Grep",
  glob: "Glob",
  list_directory: "Glob",
  google_web_search: "WebSearch",
  web_fetch: "WebFetch",
  invoke_agent: "Task"
};
var BRIDGE_TOOL2 = `mcp_${BRIDGE_SERVER_NAME}_`;
var PLATFORM_NAMES = Object.fromEntries(Object.entries(RENAMED_TOOLS).map(([name, served]) => [served, name]));
var MODE_UPDATE = /^\[MODE_UPDATE\] /;
function toolStart7(u) {
  const id = String(u.toolCallId ?? "");
  const name = id.includes("__") ? id.slice(0, id.indexOf("__")) : "";
  const title = String(u.title ?? "");
  if (name.startsWith(BRIDGE_TOOL2)) {
    const tool = name.slice(BRIDGE_TOOL2.length);
    return [`${BRIDGE_SERVER_NAME}/${PLATFORM_NAMES[tool] ?? tool}`, ""];
  }
  const mapped = TOOL_NAMES2[name];
  if (!mapped) return name ? [name, title.slice(0, 100)] : [title || "tool", ""];
  if (mapped === "Bash") return [mapped, title.slice(0, 100)];
  const path = u.locations?.[0]?.path;
  return [mapped, typeof path === "string" && path ? path : title];
}
function createGeminiStream(pump) {
  let started2 = false;
  const message = messageBuffer(pump);
  const calls = [];
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      started2 = true;
    },
    // The prompt's response is the turn's end.
    turnEnded: message.close,
    handle(n) {
      if (!started2 || n.method !== "session/update") return;
      const u = n.params.update ?? {};
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (t && !MODE_UPDATE.test(t)) message.chunk(t);
          break;
        }
        // A thought comes whole — its subject, then its text — so the next one starts apart.
        case "agent_thought_chunk":
          message.close();
          pump.thinking(`${String(u.content?.text ?? "")}

`);
          break;
        // A call's later updates (its result, a failure) say nothing the frame carries.
        case "tool_call":
          message.close();
          pump.toolStart(...toolStart7(u));
          break;
      }
    },
    // One ledger entry per model a prompt ran on, under the name the CLI gives it.
    count(quota, modelId) {
      for (const used of quota?.model_usage ?? []) {
        calls.push({
          provider: "gemini-cli",
          modelId: used.model || modelId,
          thinkingLevel: "",
          at: Date.now(),
          usage: {
            inputTokens: used.token_count?.input_tokens ?? 0,
            outputTokens: used.token_count?.output_tokens ?? 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            costUsd: 0
          }
        });
      }
    },
    report: () => calls.length ? { modelCalls: calls } : {}
  };
}

// src/lib/gemini-cli/execute.ts
var STOPPED = {
  max_tokens: "Gemini CLI stopped the turn: the session no longer fits the model's context window",
  max_turn_requests: "Gemini CLI stopped the turn: it reached its turn limit or found itself in a loop",
  refusal: "Gemini CLI refused the request"
};
var ZERO_WIDTH_SPACE = String.fromCharCode(8203);
var asMessage2 = (text3) => /^\s*[/$?]/.test(text3) ? ZERO_WIDTH_SPACE + text3 : text3;
function geminiInstructions(step, ephemeral, bridgeTools2) {
  const renamed = Object.entries(RENAMED_TOOLS).filter(([, served]) => bridgeTools2.includes(served)).map(([name, served]) => `This runtime cannot list a tool named ${name}, so the platform's ${name} tool is served as ${served} here: call that one wherever these notes say ${name}.`);
  return [turnInstructions(step, ephemeral), ...renamed].filter(Boolean).join("\n\n");
}
function geminiDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveGeminiExecutable() ? null : GEMINI_MISSING,
    async run(ctx) {
      home = geminiHome();
      const dir = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = (0, import_node_fs36.realpathSync)(step.workspace ? ctx.cwd : workdir(home));
      const method = signInMethod();
      if (!signedIn2(method, { ...process.env, ...step.secretEnv })) throw new Error(GEMINI_NOT_SIGNED_IN);
      const known = ctx.ephemeral ? null : await geminiSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const kept = !!known && (!step.resumeSessionAt || rewindSession(dir, known.id, step.resumeSessionAt));
      if (known && !kept) console.warn(`[gemini] rewind leaf ${step.resumeSessionAt} is not in session ${known.id} \u2014 starting over`);
      const mcp = turnMcpServers(step, serverUrl, token, cwd, RENAMED_TOOLS);
      stageSession2(dir, { method, cwd, instructions: geminiInstructions(step, ctx.ephemeral, mcp.bridgeTools) });
      const rpc = spawnGeminiAgent(resolveGeminiExecutable(), { dir, cwd, model: step.agent.modelId, env: step.secretEnv });
      const stream = createGeminiStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Gemini CLI");
      let session3 = "";
      let error;
      let leaf;
      try {
        await handshake6(rpc);
        session3 = await openSession5(rpc, cwd, known && kept ? known.id : null, acpMcpServers(mcp.servers));
        if (!ctx.ephemeral && session3 !== known?.id) geminiSession.maps(home).write(sessionId, { id: session3, etag: known?.etag });
        let active = false;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: session3 });
        });
        await runSteeredTurns(ctx, step, {
          prepare: async (text3, images) => ({ text: text3, images }),
          // A prompt sent under a running one cancels it, so a steer waits for a follow-up turn.
          inject: async () => false,
          // The prompt response is the turn's end.
          async turn({ text: text3, images }) {
            const prompt = acpPrompt(asMessage2(text3), await downloadImages(images, stepId));
            active = true;
            stream.turnStarted();
            idle.arm();
            try {
              const result = await rpc.call("session/prompt", { sessionId: session3, prompt }, 0);
              stream.count(result._meta?.quota, step.agent.modelId);
              error = STOPPED[result.stopReason ?? ""];
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = err.rpc.message;
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            return !error;
          }
        });
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        if (ctx.ephemeral) (0, import_node_fs36.rmSync)(dir, { recursive: true, force: true });
        else if (session3) leaf = settleSession(dir, session3);
      }
      return { error, leafId: leaf, ...stream.report() };
    },
    backup: (ctx) => geminiSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeGeminiStep = externalStep(geminiDriver);
function rewindGeminiSession(step) {
  const home = geminiHome();
  return geminiSession.rewind(home, step, (map, leaf, sessionId) => rewindSession(sessionHome(home, sessionId), map.id, leaf));
}

// src/lib/gemini-cli/usage.ts
var import_node_fs37 = require("node:fs");
var import_node_path30 = require("node:path");
var RPC_TIMEOUT_MS6 = 3e4;
function modelsFromGeminiSession(models) {
  return models.flatMap((m) => typeof m.modelId === "string" && m.modelId ? [{ id: m.modelId, label: typeof m.name === "string" && m.name ? m.name : m.modelId, effortLevels: [] }] : []);
}
function accountFromGoogleAccounts(text3) {
  try {
    const active = JSON.parse(text3).active;
    return typeof active === "string" && active ? { id: active, email: active, plan: null } : null;
  } catch {
    return null;
  }
}
function googleAccount() {
  try {
    return accountFromGoogleAccounts((0, import_node_fs37.readFileSync)((0, import_node_path30.join)(ownerConfigDir(), "google_accounts.json"), "utf8"));
  } catch {
    return null;
  }
}
async function probeGeminiUsage(signal) {
  const bin = resolveGeminiExecutable();
  if (!bin) throw new Error(GEMINI_MISSING);
  const method = signInMethod();
  if (!signedIn2(method, process.env)) return SIGNED_OUT;
  const home = geminiHome();
  const dir = probeHome(home);
  const cwd = (0, import_node_fs37.realpathSync)(workdir(home));
  stageSession2(dir, { method, cwd });
  const rpc = spawnGeminiAgent(bin, { dir, cwd });
  try {
    return await withSpawned(signal, () => rpc.close(), async () => {
      let opened;
      try {
        await handshake6(rpc);
        opened = await rpc.call("session/new", { cwd, mcpServers: [] }, RPC_TIMEOUT_MS6);
      } catch (err) {
        if (rpc.signedOut() || isAcpAuthRequired(err)) return SIGNED_OUT;
        throw outdatedIfRejected(err, GEMINI_OUTDATED);
      }
      const models = modelsFromGeminiSession(opened?.models?.availableModels ?? []);
      if (!usesGoogleSignIn(method)) return { ...noLimits(null), models };
      return { status: "ok", account: googleAccount(), windows: [], models };
    });
  } finally {
    (0, import_node_fs37.rmSync)(chatsDir(dir), { recursive: true, force: true });
  }
}

// src/lib/omp/bin.ts
var OMP_MISSING = "omp is not installed on this machine \u2014 install it (curl -fsSL https://omp.sh/install | sh) and run `omp login`, or point TDS_OMP_BIN at the executable.";
var OMP_OUTDATED = "omp on this machine is too old to be driven by tds \u2014 update it to 17 or later (curl -fsSL https://omp.sh/install | sh).";
function resolveOmpExecutable(lookup) {
  return resolveExecutable({ override: "TDS_OMP_BIN", command: "omp", homeDirs: [[".bun", "bin"]] }, lookup);
}

// src/lib/omp/execute.ts
var import_node_fs40 = require("node:fs");
var import_node_path33 = require("node:path");

// src/lib/omp/home.ts
var import_node_fs38 = require("node:fs");
var import_node_os10 = require("node:os");
var import_node_path31 = require("node:path");
var OMP_NOT_SIGNED_IN = "omp has no model provider signed in on this machine \u2014 run `omp login` first (or set a provider API key such as ANTHROPIC_API_KEY).";
var CONFIG_YML = `# Written by tds. The agent's omp home: only your sign-in is shared with your own ~/.omp.
interruptMode: wait
retry:
  modelFallback: false
`;
function ompHome() {
  return runtimeHome("omp-home", ["agent", "workdir", "tds-sessions", "sessions", "prompts"]);
}
var agentDir = (home) => (0, import_node_path31.join)(home, "agent");
function userOmp(env) {
  const base = (0, import_node_path31.join)((0, import_node_os10.homedir)(), env.PI_CONFIG_DIR || ".omp");
  const profile = (env.OMP_PROFILE ?? env.PI_PROFILE ?? "").trim();
  if (profile && profile !== "default") {
    const root = (0, import_node_path31.join)(base, "profiles", profile);
    return { root, agent: (0, import_node_path31.join)(root, "agent"), data: (0, import_node_path31.join)(root, "agent") };
  }
  if (env.PI_CODING_AGENT_DIR) return { root: base, agent: env.PI_CODING_AGENT_DIR, data: env.PI_CODING_AGENT_DIR };
  const xdg = process.platform !== "win32" && env.XDG_DATA_HOME ? (0, import_node_path31.join)(env.XDG_DATA_HOME, "omp") : "";
  return { root: base, agent: (0, import_node_path31.join)(base, "agent"), data: xdg && (0, import_node_fs38.existsSync)(xdg) ? xdg : (0, import_node_path31.join)(base, "agent") };
}
function signInFiles(home, env) {
  const user = userOmp(env);
  return [
    [(0, import_node_path31.join)(user.data, "agent.db"), (0, import_node_path31.join)(agentDir(home), "agent.db")],
    [(0, import_node_path31.join)(user.agent, "models.yml"), (0, import_node_path31.join)(agentDir(home), "models.yml")],
    [(0, import_node_path31.join)(user.agent, "models.yaml"), (0, import_node_path31.join)(agentDir(home), "models.yaml")],
    [(0, import_node_path31.join)(user.agent, ".env"), (0, import_node_path31.join)(agentDir(home), ".env")],
    [(0, import_node_path31.join)(user.root, ".env"), (0, import_node_path31.join)(home, ".env")]
  ];
}
function lstat2(path) {
  try {
    return (0, import_node_fs38.lstatSync)(path);
  } catch {
    return null;
  }
}
function shareFile(source, target) {
  if (!(0, import_node_fs38.existsSync)(source)) return;
  const existing = lstat2(target);
  if (existing?.isSymbolicLink()) return;
  try {
    const staged = `${target}.tds-link`;
    (0, import_node_fs38.rmSync)(staged, { force: true });
    (0, import_node_fs38.symlinkSync)(source, staged);
    (0, import_node_fs38.renameSync)(staged, target);
    for (const suffix of ["-wal", "-shm"]) (0, import_node_fs38.rmSync)(target + suffix, { force: true });
  } catch (err) {
    if (existing && existing.mtimeMs >= (0, import_node_fs38.statSync)(source).mtimeMs) return;
    console.warn(`[omp] ${target} symlink failed (${err.message}) \u2014 copying instead; a refreshed token will not propagate`);
    (0, import_node_fs38.copyFileSync)(source, target);
  }
}
function ensureOmpHome(env = process.env) {
  const home = ompHome();
  ensureConfig(agentDir(home), "config.yml", CONFIG_YML);
  for (const [source, target] of signInFiles(home, env)) shareFile(source, target);
  return home;
}
function ompEnv(home, bin) {
  const root = (0, import_node_path31.relative)((0, import_node_os10.homedir)(), home);
  return {
    ...process.env,
    ...(0, import_node_path31.isAbsolute)(root) ? {} : { PI_CONFIG_DIR: root },
    PI_CODING_AGENT_DIR: agentDir(home),
    OMP_PROFILE: "",
    ...process.platform === "win32" ? {} : { PATH: [(0, import_node_path31.dirname)(bin), process.env.PATH].filter(Boolean).join(import_node_path31.delimiter) }
  };
}

// src/lib/omp/rpc.ts
var OmpCommandError = class extends Error {
};
function isCommandError(err) {
  return err instanceof OmpCommandError;
}
var SIGNED_OUT3 = /No models available/;
var literal = (text3) => text3.startsWith("/") ? ` ${text3}` : text3;
function spawnOmp(bin, opts) {
  let nextId = 0;
  const pending = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const waiters = /* @__PURE__ */ new Set();
  const chunks = [];
  const open = /* @__PURE__ */ new Set();
  let quiet = true;
  let failure2;
  let exited = null;
  let isReady = false;
  let signedOut = false;
  let started2;
  let failed;
  const ready = new Promise((resolve6, reject) => {
    started2 = resolve6;
    failed = reject;
  });
  ready.catch(() => {
  });
  const startup = setTimeout(() => failed(new Error(`omp did not start within ${TIMEOUTS_MS.ompStart / 1e3}s`)), TIMEOUTS_MS.ompStart);
  const server = spawnJsonLines(bin, [
    "--mode",
    "rpc",
    "--no-ui",
    "--yolo",
    ...opts.sessionDir ? ["--session-dir", opts.sessionDir, "--continue"] : ["--no-session"],
    ...opts.systemPrompt ? ["--system-prompt", opts.systemPrompt] : [],
    ...opts.appendSystemPrompt ? ["--append-system-prompt", opts.appendSystemPrompt] : []
  ], { label: "omp", cwd: opts.cwd, env: { ...opts.env, ...ompEnv(opts.home, bin) }, exitTimeoutMs: TIMEOUTS_MS.ompExit }, {
    message(msg) {
      if (msg.type === "rpc_chunk") {
        chunks.push(Buffer.from(String(msg.data), "base64"));
        if (msg.index !== msg.count - 1) return;
        try {
          msg = JSON.parse(Buffer.concat(chunks.splice(0)).toString("utf8"));
        } catch {
          return;
        }
      }
      if (msg.type === "ready") {
        clearTimeout(startup);
        isReady = true;
        started2();
      } else if (msg.type === "response") {
        if (msg.command === "prompt" && (!msg.success || msg.data?.agentInvoked === false)) open.delete(msg.id);
        const p = pending.get(msg.id);
        if (p) {
          pending.delete(msg.id);
          clearTimeout(p.timer);
          if (msg.success) p.resolve(msg.data);
          else p.reject(new OmpCommandError(String(msg.error ?? `${msg.command} failed`)));
        }
      } else {
        if (msg.type === "prompt_result") {
          open.delete(msg.id);
          quiet = msg.sessionSettled !== false;
          if (msg.status === "error") failure2 ??= String(msg.error?.message ?? "omp failed the turn");
        } else if (msg.type === "session_settled") {
          quiet = true;
        }
        for (const l of listeners) l(msg);
      }
      for (const w of waiters) {
        const v = w.check();
        if (v !== void 0) {
          waiters.delete(w);
          w.resolve(v);
        }
      }
    },
    exit(err) {
      clearTimeout(startup);
      exited = signedOut ? new Error(OMP_NOT_SIGNED_IN) : err;
      failed(exited);
      for (const p of pending.values()) {
        clearTimeout(p.timer);
        p.reject(exited);
      }
      pending.clear();
      for (const w of waiters) w.reject(exited);
      waiters.clear();
    },
    // Only while it starts: later the same words could be a tool's.
    stderr(text3) {
      if (!isReady && SIGNED_OUT3.test(text3)) signedOut = true;
    }
  });
  function request2(id, command2, timeoutMs) {
    if (exited) return Promise.reject(exited);
    return new Promise((resolve6, reject) => {
      const timer = timeoutMs ? setTimeout(() => {
        pending.delete(id);
        reject(new Error(`omp ${command2.type} timed out after ${timeoutMs}ms`));
      }, timeoutMs) : void 0;
      pending.set(id, { resolve: resolve6, reject, timer });
      server.send({ id, ...command2 });
    });
  }
  return {
    // The ready frame: omp found a provider and is taking commands.
    ready,
    call(type, params = {}, timeoutMs = TIMEOUTS_MS.ompRpc) {
      return request2(`c${++nextId}`, { type, ...params }, timeoutMs);
    },
    // A frame that takes no answer: a host tool's result.
    send: server.send,
    onFrame(fn) {
      listeners.add(fn);
    },
    // One user message, admitted. Under a running turn it is a steer: omp hands it to the model
    // at the next tool boundary, and it gets a result of its own like any other prompt.
    async prompt(input, steer = false) {
      const id = `p${++nextId}`;
      open.add(id);
      try {
        await request2(id, { type: "prompt", message: literal(input.message), ...input.images?.length ? { images: input.images } : {}, ...steer ? { streamingBehavior: "steer" } : {} }, 0);
      } catch (err) {
        open.delete(id);
        throw err;
      }
    },
    // A prompt is in flight, so a message sent now joins its turn.
    busy: () => open.size > 0,
    // Every admitted prompt has its result and nothing omp left running can wake the session
    // again. Resolves with the first failure among those results; rejects when omp exits first.
    settled() {
      const over = () => {
        if (open.size || !quiet) return void 0;
        const error = failure2;
        failure2 = void 0;
        return { error };
      };
      const now = over();
      if (now) return Promise.resolve(now.error);
      if (exited) return Promise.reject(exited);
      return new Promise((resolve6, reject) => {
        waiters.add({ check: over, resolve: resolve6, reject });
      }).then((r) => r.error);
    },
    close: server.close
  };
}
async function handshake7(omp) {
  await omp.ready;
  await omp.call("negotiate_protocol", { protocolVersion: 2 });
  await omp.call("set_event_filter", { events: null, messageUpdates: "delta" });
}
function splitModelId(modelId) {
  const at = modelId.indexOf("/");
  return at < 0 ? { provider: "", modelId } : { provider: modelId.slice(0, at), modelId: modelId.slice(at + 1) };
}
async function selectModel(omp, modelId, effort) {
  if (modelId) {
    try {
      await omp.call("set_model", splitModelId(modelId));
    } catch (err) {
      throw isCommandError(err) ? new Error(`omp cannot run the model ${modelId}: ${err.message}`) : err;
    }
  }
  if (!effort) return;
  const { levels } = await omp.call("get_available_thinking_levels");
  if (levels?.includes(effort)) await omp.call("set_thinking_level", { level: effort });
}

// src/lib/omp/session.ts
var import_node_fs39 = require("node:fs");
var import_node_path32 = require("node:path");
var sessionDir4 = (home, sessionId) => (0, import_node_path32.join)(home, "sessions", sessionId);
var blobsDir = (home) => (0, import_node_path32.join)(agentDir(home), "blobs");
function sessionFile(dir) {
  try {
    const name = (0, import_node_fs39.readdirSync)(dir).filter((f) => f.endsWith(".jsonl") && !f.startsWith(".")).sort().pop();
    return name ? (0, import_node_path32.join)(dir, name) : null;
  } catch {
    return null;
  }
}
var HEAD7 = "tds_omp_session";
var BLOB = "tds_omp_blob";
var SESSION_FILE = /^[\w.-]+\.jsonl$/;
var BLOB_HASH = /^[a-f0-9]{64}$/;
var BLOB_REF = /blob:sha256:([a-f0-9]{64})/g;
function packSession7(home, dir, map) {
  let text3;
  try {
    text3 = (0, import_node_fs39.readFileSync)((0, import_node_path32.join)(dir, map.id), "utf8");
  } catch {
    return null;
  }
  const lines = [JSON.stringify({ [HEAD7]: map.id })];
  for (const hash of new Set([...text3.matchAll(BLOB_REF)].map((m) => m[1]))) {
    const blob = (0, import_node_path32.join)(blobsDir(home), hash);
    if ((0, import_node_fs39.existsSync)(blob)) lines.push(JSON.stringify({ [BLOB]: hash, base64: (0, import_node_fs39.readFileSync)(blob).toString("base64") }));
  }
  return `${lines.join("\n")}
${text3}`;
}
function unpackSession7(home, dir, body) {
  if (!body.startsWith(`{"${HEAD7}"`)) return null;
  let rest2 = body;
  const line = () => {
    const end = rest2.indexOf("\n");
    const head = end < 0 ? rest2 : rest2.slice(0, end);
    rest2 = end < 0 ? "" : rest2.slice(end + 1);
    return head;
  };
  const id = JSON.parse(line())[HEAD7] ?? "";
  if (!SESSION_FILE.test(id)) return null;
  const blobs = [];
  while (rest2.startsWith(`{"${BLOB}"`)) {
    const record = JSON.parse(line());
    const hash = record[BLOB] ?? "";
    if (!BLOB_HASH.test(hash) || typeof record.base64 !== "string") return null;
    blobs.push([hash, Buffer.from(record.base64, "base64")]);
  }
  (0, import_node_fs39.rmSync)(dir, { recursive: true, force: true });
  (0, import_node_fs39.mkdirSync)(dir, { recursive: true });
  (0, import_node_fs39.writeFileSync)((0, import_node_path32.join)(dir, id), rest2);
  (0, import_node_fs39.mkdirSync)(blobsDir(home), { recursive: true });
  for (const [hash, data] of blobs) {
    if (!(0, import_node_fs39.existsSync)((0, import_node_path32.join)(blobsDir(home), hash))) (0, import_node_fs39.writeFileSync)((0, import_node_path32.join)(blobsDir(home), hash), data);
  }
  return { id };
}
function parseEntry2(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
function sessionLeaf(file2) {
  if (!file2) return void 0;
  let lines;
  try {
    lines = (0, import_node_fs39.readFileSync)(file2, "utf8").split("\n");
  } catch {
    return void 0;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    const entry = lines[i] ? parseEntry2(lines[i]) : null;
    if (entry?.id && entry.type !== "session") return entry.id;
  }
  return void 0;
}
function truncateSession(file2, leaf) {
  const lines = (0, import_node_fs39.readFileSync)(file2, "utf8").split("\n").filter(Boolean);
  const at = lines.findIndex((l) => {
    if (!l.includes(leaf)) return false;
    const entry = parseEntry2(l);
    return entry?.id === leaf && entry.type !== "session";
  });
  if (at === -1) return false;
  if (at < lines.length - 1) atomicWriteFileSync(file2, `${lines.slice(0, at + 1).join("\n")}
`);
  return true;
}
function codec8(home, sessionId) {
  const dir = sessionDir4(home, sessionId);
  return {
    pack: (map) => packSession7(home, dir, map),
    unpack: (body) => unpackSession7(home, dir, body),
    drop: () => (0, import_node_fs39.rmSync)(dir, { recursive: true, force: true })
  };
}
var ompSession = sessionMirror("omp", codec8);

// src/lib/omp/stream.ts
function toolStart8(name, args2) {
  switch (name) {
    case "bash":
      return ["Bash", detail(args2, "command").slice(0, 100)];
    case "read": {
      const path = detail(args2, "path");
      return [/^https?:\/\//.test(path) ? "WebFetch" : "Read", path];
    }
    case "write":
      return ["Write", detail(args2, "path")];
    // An edit names its files inside the patch: `[path#tag]` heads each section.
    case "edit":
      return ["Edit", detail(args2, "path") || (/^\[([^#\]\n]+)/m.exec(detail(args2, "input"))?.[1] ?? "")];
    case "ast_edit":
      return ["Edit", Array.isArray(args2.paths) ? args2.paths.join(", ") : ""];
    case "grep":
    case "ast_grep": {
      const path = detail(args2, "path");
      return ["Grep", `"${detail(args2, "pattern", "pat")}"${path ? ` in ${path}` : ""}`];
    }
    case "glob":
      return ["Glob", detail(args2, "path")];
    case "find":
      return ["Grep", `"${detail(args2, "query")}"`];
    case "web_search":
      return ["WebSearch", detail(args2, "query")];
    case "task":
      return ["Task", detail(args2, "name", "agent", "task").slice(0, 100)];
    default: {
      const mcp = /^mcp__(.+?)__(.+)$/.exec(name);
      return mcp ? [`${mcp[1]}/${mcp[2]}`, ""] : [name, detail(args2, "path", "title", "op", "action", "query").slice(0, 100)];
    }
  }
}
function createOmpStream(pump, thinkingLevel) {
  let message = "";
  const calls = [];
  return {
    handle(f) {
      switch (f.type) {
        case "message_update": {
          const e = f.assistantMessageEvent ?? {};
          const t = String(e.delta ?? "");
          if (!t) break;
          if (e.type === "thinking_delta") pump.thinking(t);
          else if (e.type === "text_delta") {
            if (!message) pump.gap();
            message += t;
            pump.text(t);
          }
          break;
        }
        case "message_end": {
          const m = f.message ?? {};
          if (m.role !== "assistant") break;
          const blocks2 = Array.isArray(m.content) ? m.content : [];
          const full = blocks2.filter((c) => c?.type === "text").map((c) => String(c.text ?? "")).join("");
          const text3 = full.startsWith(message) ? full : message;
          if (text3) {
            if (!message) pump.gap();
            pump.textDone(text3);
          }
          message = "";
          const usage = m.usage;
          if (usage && (usage.input || usage.output || usage.cacheRead || usage.cacheWrite)) {
            calls.push({
              provider: "omp",
              // The model that answered: a subagent or a role of omp's own may run another one.
              modelId: `${m.provider}/${m.model}`,
              thinkingLevel: thinkingLevel ?? "",
              at: Date.now(),
              usage: {
                inputTokens: usage.input ?? 0,
                outputTokens: usage.output ?? 0,
                cacheReadTokens: usage.cacheRead ?? 0,
                cacheWriteTokens: usage.cacheWrite ?? 0,
                costUsd: usage.cost?.total ?? 0
              }
            });
          }
          break;
        }
        case "tool_execution_start":
          pump.toolStart(...toolStart8(String(f.toolName ?? "tool"), f.args ?? {}));
          break;
        case "auto_retry_start":
          pump.retry(Number(f.attempt) || 1, Number(f.maxAttempts) || 0);
          break;
        case "auto_retry_end":
          pump.retryDone();
          break;
      }
    },
    // `context` is the window's occupancy as get_session_stats reports it after the last turn.
    report(context) {
      if (!calls.length) return {};
      const contextWindow = context?.contextWindow ?? 0;
      return { modelCalls: calls, ...contextWindow > 0 ? { contextUsage: { tokens: context?.tokens ?? null, contextWindow } } : {} };
    }
  };
}

// src/lib/omp/tools.ts
async function turnTools(step, serverUrl, token, cwd) {
  const staged = stagedBridge(step, cwd);
  const platform2 = staged ? bridgeTools(staged, serverUrl, token) : [];
  const conns = step.mcpServers?.length ? await connectMcpServers(step.mcpServers, step.mcpServerCredentials ?? []) : [];
  const mcp = conns.length ? await mcpToolDefinitions(conns, platform2.map((t) => t.name)) : [];
  return { tools: [...platform2, ...mcp], close: () => closeMcpConnections(conns) };
}
var CONFLICT = /host tool "([^"]+)" conflicts/;
async function serveHostTools(omp, tools) {
  if (!tools.length) return;
  const byName = new Map(tools.map((t) => [t.name, t]));
  const running = /* @__PURE__ */ new Map();
  omp.onFrame((f) => {
    if (f.type === "host_tool_cancel") return running.get(String(f.targetId))?.abort();
    if (f.type !== "host_tool_call") return;
    const id = String(f.id);
    const tool = byName.get(String(f.toolName));
    const failed = (text3) => omp.send({ type: "host_tool_result", id, isError: true, result: { content: [{ type: "text", text: text3 }] } });
    if (!tool) return failed(`Unknown tool: ${f.toolName}`);
    const abort = new AbortController();
    running.set(id, abort);
    void Promise.resolve().then(() => tool.execute(String(f.toolCallId), f.arguments ?? {}, abort.signal, void 0, void 0)).then((result) => omp.send({ type: "host_tool_result", id, result: { content: result.content } }), (err) => failed(err instanceof Error ? err.message : String(err))).finally(() => running.delete(id));
  });
  let offered = tools;
  while (offered.length) {
    try {
      await omp.call("set_host_tools", {
        tools: offered.map((t) => ({ name: t.name, label: t.label, description: t.description, parameters: t.parameters, loadMode: "essential" }))
      });
      return;
    } catch (err) {
      const taken = isCommandError(err) ? CONFLICT.exec(err.message)?.[1] : void 0;
      if (!taken || !offered.some((t) => t.name === taken)) throw err;
      console.warn(`[omp] ${taken} is a tool of omp's own \u2014 the platform's is not offered this turn`);
      offered = offered.filter((t) => t.name !== taken);
    }
  }
}

// src/lib/omp/execute.ts
function stagePrompts(home, step, ephemeral) {
  const notes = [step.appendSystemPrompt, ephemeral ? REVIEW_NOTE : ""].filter(Boolean).join("\n\n");
  const stage = (kind, text3) => {
    if (!text3) return void 0;
    const file2 = (0, import_node_path33.join)(home, "prompts", `${step.stepId}.${kind}.md`);
    (0, import_node_fs40.writeFileSync)(file2, text3);
    return file2;
  };
  const systemPrompt = stage("system", step.systemPrompt);
  const appendSystemPrompt = stage("append", notes);
  return { systemPrompt, appendSystemPrompt, cleanup: () => {
    for (const f of [systemPrompt, appendSystemPrompt]) if (f) (0, import_node_fs40.rmSync)(f, { force: true });
  } };
}
function prepareSession(dir, known, resumeAt) {
  const file2 = known ? sessionFile(dir) : null;
  if (file2 && (!resumeAt || truncateSession(file2, resumeAt))) return;
  if (file2) console.warn(`[omp] rewind leaf ${resumeAt} is not in session ${known.id} \u2014 starting over`);
  (0, import_node_fs40.rmSync)(dir, { recursive: true, force: true });
}
function ompDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveOmpExecutable() ? null : OMP_MISSING,
    async run(ctx) {
      home = ensureOmpHome();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const dir = sessionDir4(home, sessionId);
      const known = ctx.ephemeral ? null : await ompSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      if (!ctx.ephemeral) prepareSession(dir, known, step.resumeSessionAt);
      const remember = (file2) => {
        if (file2 && !ctx.ephemeral) ompSession.maps(home).write(sessionId, { id: (0, import_node_path33.basename)(file2), etag: known?.etag });
      };
      const prompts = stagePrompts(home, step, ctx.ephemeral);
      const omp = spawnOmp(resolveOmpExecutable(), { home, cwd, env: step.secretEnv, sessionDir: ctx.ephemeral ? void 0 : dir, systemPrompt: prompts.systemPrompt, appendSystemPrompt: prompts.appendSystemPrompt });
      const stream = createOmpStream(ctx.pump, step.agent.thinkingLevel);
      omp.onFrame(stream.handle);
      const idle = idleWatch({ onNotification: omp.onFrame, close: omp.close }, "omp");
      let tools;
      try {
        await handshake7(omp);
        await selectModel(omp, step.agent.modelId, step.agent.thinkingLevel);
        tools = await turnTools(step, serverUrl, token, cwd);
        await serveHostTools(omp, tools.tools);
        remember((await omp.call("get_session_stats")).sessionFile);
        let error;
        ctx.onStop(() => {
          if (omp.busy()) void omp.call("abort").catch(() => {
          });
        });
        await runSteeredTurns(ctx, step, {
          prepare: async (text3, images) => ({ message: text3, images: await downloadImages(images, stepId) }),
          // With no turn running omp would start one nobody waits for, so the steer waits for a
          // follow-up turn.
          async inject(input) {
            if (!omp.busy()) return false;
            try {
              await omp.prompt(input, true);
              return true;
            } catch (err) {
              if (isCommandError(err)) return false;
              throw err;
            }
          },
          // To the result of the prompt and of every steer it took, background work included.
          async turn(input) {
            idle.arm();
            try {
              await omp.prompt(input);
              error = await omp.settled();
            } catch (err) {
              if (!isCommandError(err)) throw err;
              error = err.message;
            } finally {
              idle.disarm();
            }
            return !error;
          }
        });
        const stats = await omp.call("get_session_stats").catch(() => null);
        await omp.close();
        const file2 = sessionFile(dir);
        remember(file2);
        return { error, leafId: sessionLeaf(file2), ...stream.report(stats?.contextUsage) };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await omp.close();
        await tools?.close();
        prompts.cleanup();
      }
    },
    backup: (ctx) => ompSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeOmpStep = externalStep(ompDriver);
function rewindOmpSession(step) {
  const home = ompHome();
  return ompSession.rewind(home, step, (_map, leaf, sessionId) => {
    const file2 = sessionFile(sessionDir4(home, sessionId));
    return !!file2 && truncateSession(file2, leaf);
  }, { backup: true });
}

// src/lib/omp/usage.ts
var RPC_TIMEOUT_MS7 = 3e4;
var USAGE_TIMEOUT_MS = 25e3;
var selector = (m) => `${m.provider}/${m.id}`;
var revision = (m) => typeof m.identity?.revision === "string" ? m.identity.revision.split(".").map(Number) : [];
function byRevision(a, b) {
  const [x, y] = [revision(a), revision(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] ?? -1) - (x[i] ?? -1);
    if (d) return d;
  }
  return 0;
}
function ranked(models, current) {
  const providers = /* @__PURE__ */ new Map();
  for (const m of models) {
    const list = providers.get(m.provider);
    if (list) list.push(m);
    else providers.set(m.provider, [m]);
  }
  const lists = [...providers.values()].map((list) => list.sort(byRevision));
  const out = current ? [current] : [];
  for (let i = 0; lists.some((list) => i < list.length); i++) {
    for (const list of lists) {
      if (list[i] && (!current || selector(list[i]) !== selector(current))) out.push(list[i]);
    }
  }
  return out;
}
function modelsFromOmpList(models, current) {
  return ranked(models, current).flatMap((m) => {
    if (typeof m.provider !== "string" || !m.provider || typeof m.id !== "string" || !m.id) return [];
    const efforts = m.reasoning && Array.isArray(m.thinking?.efforts) ? m.thinking.efforts : [];
    return [{
      id: selector(m),
      label: `${typeof m.name === "string" && m.name ? m.name : m.id} \xB7 ${m.provider}`,
      effortLevels: efforts.filter((e) => typeof e === "string" && !!e)
    }];
  }).slice(0, RUNTIME_MODELS_MAX);
}
function utilization(amount) {
  if (!amount) return null;
  if (typeof amount.usedFraction === "number") return pct(amount.usedFraction * 100);
  if (typeof amount.used === "number" && typeof amount.limit === "number" && amount.limit > 0) return pct(amount.used / amount.limit * 100);
  if (amount.unit === "percent" && typeof amount.used === "number") return pct(amount.used);
  if (typeof amount.remainingFraction === "number") return pct((1 - amount.remainingFraction) * 100);
  return null;
}
function windowsFromOmpUsage(stdout) {
  const reports = jsonObjectIn(stdout).reports ?? [];
  const seen = /* @__PURE__ */ new Set();
  return reports.flatMap((r) => (r.limits ?? []).flatMap((l) => {
    const key = `limit:${r.provider}:${l.id}`;
    if (!r.provider || !l.id || seen.has(key)) return [];
    seen.add(key);
    return [{
      key,
      label: `${r.provider} \xB7 ${l.label ?? l.id}`,
      windowMinutes: typeof l.window?.durationMs === "number" ? Math.round(l.window.durationMs / 6e4) : null,
      utilization: utilization(l.amount),
      resetsAt: typeof l.window?.resetsAt === "number" ? l.window.resetsAt : null
    }];
  }));
}
async function usageWindows(bin, home, signal) {
  const out = await cliOutput(bin, ["usage", "--json"], { cwd: workdir(home), env: ompEnv(home, bin), timeoutMs: USAGE_TIMEOUT_MS, signal, maxBuffer: 16 * 1024 * 1024 });
  try {
    return out.failed ? [] : windowsFromOmpUsage(out.stdout);
  } catch {
    return [];
  }
}
async function probeOmpUsage(signal) {
  const bin = resolveOmpExecutable();
  if (!bin) throw new Error(OMP_MISSING);
  const home = ensureOmpHome();
  const omp = spawnOmp(bin, { home, cwd: workdir(home) });
  let models;
  try {
    models = await withSpawned(signal, () => omp.close(), async () => {
      await handshake7(omp);
      const state = await omp.call("get_state", {}, RPC_TIMEOUT_MS7);
      const listed = await omp.call("get_available_models", {}, RPC_TIMEOUT_MS7);
      return modelsFromOmpList(listed.models ?? [], state.model);
    });
  } catch (err) {
    if (err.message === OMP_NOT_SIGNED_IN) return SIGNED_OUT;
    throw outdatedIfRejected(err, OMP_OUTDATED);
  }
  const windows = await usageWindows(bin, home, signal);
  return windows.length ? { status: "ok", account: null, windows, models } : { ...noLimits(null), models };
}

// src/lib/opencode/bin.ts
var OPENCODE_MISSING = "OpenCode is not installed on this machine \u2014 install it (curl -fsSL https://opencode.ai/install | bash) and run `opencode auth login`, or point TDS_OPENCODE_BIN at the executable.";
function resolveOpencodeExecutable(lookup) {
  return resolveExecutable({ override: "TDS_OPENCODE_BIN", command: "opencode", homeDirs: [[".opencode", "bin"]] }, lookup);
}

// src/lib/opencode/execute.ts
var import_node_fs44 = require("node:fs");

// src/lib/opencode/home.ts
var import_node_fs41 = require("node:fs");
var import_node_os11 = require("node:os");
var import_node_path34 = require("node:path");
var OPENCODE_NOT_SIGNED_IN = "OpenCode has no working sign-in for this model's provider on this machine \u2014 run `opencode auth login` first (or set the provider's API key in the environment).";
function opencodeHome() {
  return runtimeHome("opencode-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
var configDir2 = (dir) => (0, import_node_path34.join)(dir, "config");
var databaseFile = (dir) => (0, import_node_path34.join)(dir, "opencode.db");
var sessionFile2 = (dir) => (0, import_node_path34.join)(dir, "session.json");
var bridgeListedFile = (dir) => (0, import_node_path34.join)(dir, "bridge-listed");
var FOREIGN_CONFIG = ["OPENCODE_CONFIG", "OPENCODE_CONFIG_CONTENT"];
function opencodeEnv(dir, secrets) {
  const env = { ...process.env, ...secrets, OPENCODE_CONFIG_DIR: configDir2(dir), OPENCODE_DB: databaseFile(dir), OPENCODE_DISABLE_AUTOUPDATE: "1" };
  for (const name of FOREIGN_CONFIG) delete env[name];
  return env;
}
function ownerConfigDir2(env = process.env) {
  return env.OPENCODE_CONFIG_DIR || (0, import_node_path34.join)(env.XDG_CONFIG_HOME || (0, import_node_path34.join)((0, import_node_os11.homedir)(), ".config"), "opencode");
}
function ownerDatabase(env = process.env) {
  return env.OPENCODE_DB || (0, import_node_path34.join)(env.XDG_DATA_HOME || (0, import_node_path34.join)((0, import_node_os11.homedir)(), ".local", "share"), "opencode", "opencode.db");
}
var CREDENTIAL_COLUMNS = "id, integration_id, label, value, connector_id, method_id, active, time_created, time_updated";
function carryCredentials(dir, owner = ownerDatabase()) {
  if (!(0, import_node_fs41.existsSync)(databaseFile(dir)) || !(0, import_node_fs41.existsSync)(owner)) return;
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
  const db = new DatabaseSync(databaseFile(dir));
  try {
    db.prepare("ATTACH DATABASE ? AS owner").run(owner);
    db.exec(`BEGIN; DELETE FROM credential; INSERT INTO credential (${CREDENTIAL_COLUMNS}) SELECT ${CREDENTIAL_COLUMNS} FROM owner.credential; COMMIT`);
  } catch (err) {
    if (db.isTransaction) db.exec("ROLLBACK");
    console.warn(`[opencode] the sign-ins in ${owner} were not carried over: ${err.message}`);
  } finally {
    db.close();
  }
}
var CONFIG_FILES = ["opencode.json", "opencode.jsonc"];
var SIGN_IN_KEYS2 = ["provider", "providers", "disabled_providers", "enabled_providers"];
function anchored(value, owner) {
  if (typeof value === "string") return value.replace(/\{file:([^}]+)\}/g, (ref, path) => path.startsWith("~") || (0, import_node_path34.isAbsolute)(path) ? ref : `{file:${(0, import_node_path34.join)(owner, path)}}`);
  if (Array.isArray(value)) return value.map((v) => anchored(v, owner));
  if (isJsonObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, anchored(v, owner)]));
  return value;
}
function ownerProviders(owner = ownerConfigDir2()) {
  const carried = {};
  for (const file2 of CONFIG_FILES) {
    let text3;
    try {
      text3 = (0, import_node_fs41.readFileSync)((0, import_node_path34.join)(owner, file2), "utf8");
    } catch {
      continue;
    }
    let config;
    try {
      config = parseJsonc(text3);
    } catch (err) {
      console.warn(`[opencode] ${(0, import_node_path34.join)(owner, file2)} does not parse (${err.message}) \u2014 the providers it sets up are not carried over`);
      continue;
    }
    if (!isJsonObject(config)) continue;
    for (const key of SIGN_IN_KEYS2) {
      const value = anchored(config[key], owner);
      if (value === void 0) continue;
      const had = carried[key];
      carried[key] = isJsonObject(had) && isJsonObject(value) ? { ...had, ...value } : value;
    }
  }
  return carried;
}
var CONFIG2 = "opencode.json";
var RULES2 = "AGENTS.md";
var SETTINGS = {
  $schema: "https://opencode.ai/config.json",
  autoupdate: false,
  share: "disabled",
  snapshot: false,
  permission: { "*": "allow", question: "deny" }
};
function writeConfig(dir, config) {
  (0, import_node_fs41.mkdirSync)(configDir2(dir), { recursive: true });
  (0, import_node_fs41.rmSync)((0, import_node_path34.join)(configDir2(dir), CONFIG2), { force: true });
  (0, import_node_fs41.writeFileSync)((0, import_node_path34.join)(configDir2(dir), CONFIG2), `${JSON.stringify(config, null, 2)}
`, { mode: 384 });
}
function stageSession3(dir, stage, owner = ownerConfigDir2()) {
  writeConfig(dir, { ...SETTINGS, ...ownerProviders(owner), ...stage.servers?.length ? { mcp: { servers: opencodeMcpServers(stage.servers) } } : {} });
  if (stage.instructions) (0, import_node_fs41.writeFileSync)((0, import_node_path34.join)(configDir2(dir), RULES2), `${stage.instructions}
`);
  else (0, import_node_fs41.rmSync)((0, import_node_path34.join)(configDir2(dir), RULES2), { force: true });
}
function bareSession(dir) {
  writeConfig(dir, SETTINGS);
}

// src/lib/opencode/rpc.ts
var import_node_child_process6 = require("node:child_process");
var import_node_fs42 = require("node:fs");
var import_promises7 = require("node:timers/promises");
function spawnOpencodeAgent(bin, opts) {
  return spawnStdioRpc(bin, ["acp"], {
    label: "opencode",
    cwd: opts.cwd,
    env: opencodeEnv(opts.dir, opts.env),
    // tds's settings allow every tool; what still asks is a rule the repository's own config set to ask.
    autoReply: acpAutoReply(),
    callTimeoutMs: TIMEOUTS_MS.opencodeRpc,
    exitTimeoutMs: TIMEOUTS_MS.opencodeExit
  });
}
var MIN_MAJOR = 2;
var supported = (version) => typeof version === "string" && Number.parseInt(version, 10) >= MIN_MAJOR;
var tooOld = (version) => `OpenCode ${typeof version === "string" && version ? version : "on this machine"} is too old to run here \u2014 upgrade it to 2.0 or later (opencode upgrade).`;
async function handshake8(rpc) {
  const { agentInfo } = await acpInitialize(rpc);
  if (!supported(agentInfo?.version)) throw new Error(tooOld(agentInfo?.version));
}
var failure = (err) => err.rpc.message.replace(/^Internal error: /, "");
var opening = (err, what) => isRpcError(err) ? new Error(`OpenCode could not ${what}: ${failure(err)}`) : err;
async function newSession(rpc, cwd) {
  try {
    return (await rpc.call("session/new", { cwd, mcpServers: [] })).sessionId;
  } catch (err) {
    throw opening(err, "open a session");
  }
}
async function loadSession(rpc, cwd, sessionId) {
  try {
    await rpc.call("session/load", { sessionId, cwd, mcpServers: [] }, TIMEOUTS_MS.opencodeLoad);
  } catch (err) {
    throw opening(err, `load session ${sessionId}`);
  }
}
async function bridgeListed(file2, timeoutMs = TIMEOUTS_MS.opencodeBridgeListed) {
  const deadline = Date.now() + timeoutMs;
  while (!(0, import_node_fs42.existsSync)(file2)) {
    if (Date.now() >= deadline) {
      console.warn(`[opencode] the platform bridge listed no tools within ${timeoutMs / 1e3}s \u2014 the turn starts without waiting for them`);
      return false;
    }
    await (0, import_promises7.setTimeout)(50);
  }
  await (0, import_promises7.setTimeout)(TIMEOUTS_MS.opencodeToolsSettle);
  return true;
}
function sessionCommand(bin, args2, opts) {
  return new Promise((resolve6) => {
    const child = (0, import_node_child_process6.spawn)(bin, ["session", ...args2], {
      cwd: opts.cwd,
      env: opencodeEnv(opts.dir),
      stdio: ["ignore", opts.out ?? "ignore", "pipe"],
      timeout: TIMEOUTS_MS.opencodeSession,
      windowsHide: true,
      shell: process.platform === "win32" && bin.endsWith(".cmd")
    });
    let stderr = "";
    child.stderr?.on("data", (d) => {
      stderr = (stderr + String(d)).slice(-300);
    });
    child.on("error", (err) => resolve6(err.message));
    child.on("close", (code, signal) => resolve6(code === 0 ? null : errorLine(stderr) || `exited (${signal ?? `code ${code}`})`));
  });
}

// src/lib/opencode/session.ts
var import_node_fs43 = require("node:fs");
var OWN_EFFORT = "default";
function modelRef(modelId, effort) {
  const at = modelId?.indexOf("/") ?? -1;
  return at > 0 && at < modelId.length - 1 ? { providerID: modelId.slice(0, at), id: modelId.slice(at + 1), variant: effort || OWN_EFFORT } : null;
}
function parse(text3) {
  try {
    const parsed = JSON.parse(text3);
    return typeof parsed?.info?.id === "string" && Array.isArray(parsed.messages) ? parsed : null;
  } catch {
    return null;
  }
}
function readExport(dir) {
  try {
    return parse((0, import_node_fs43.readFileSync)(sessionFile2(dir), "utf8"));
  } catch {
    return null;
  }
}
function dropDatabase(dir) {
  for (const suffix of ["", "-wal", "-shm"]) (0, import_node_fs43.rmSync)(databaseFile(dir) + suffix, { force: true });
}
async function exportSession(bin, dir, cwd, id) {
  const tmp = `${sessionFile2(dir)}.tmp`;
  try {
    const out = (0, import_node_fs43.openSync)(tmp, "w");
    let failed;
    try {
      failed = await sessionCommand(bin, ["export", "--standalone", id], { dir, cwd, out });
    } finally {
      (0, import_node_fs43.closeSync)(out);
    }
    const exported = failed ? null : parse((0, import_node_fs43.readFileSync)(tmp, "utf8"));
    if (exported?.info.id !== id) throw new Error(failed ?? "the output is not the session");
    (0, import_node_fs43.renameSync)(tmp, sessionFile2(dir));
    return exported;
  } catch (err) {
    console.warn(`[opencode] session export ${id} failed: ${err.message}`);
    (0, import_node_fs43.rmSync)(tmp, { force: true });
    return null;
  }
}
async function importSession(bin, dir, cwd) {
  dropDatabase(dir);
  if (!(0, import_node_fs43.existsSync)(sessionFile2(dir))) return false;
  const failed = await sessionCommand(bin, ["import", "--standalone", "--directory", cwd, sessionFile2(dir)], { dir, cwd });
  if (failed) console.warn(`[opencode] session import failed: ${failed}`);
  return !failed;
}
function retarget(dir, model) {
  const exported = readExport(dir);
  const now = exported?.info.model;
  if (!exported || now?.providerID === model.providerID && now.id === model.id && (now.variant || OWN_EFFORT) === model.variant) return false;
  atomicWriteFileSync(sessionFile2(dir), JSON.stringify({ ...exported, info: { ...exported.info, model } }));
  dropDatabase(dir);
  return true;
}
async function createSession(bin, dir, cwd, model) {
  dropDatabase(dir);
  (0, import_node_fs43.rmSync)(sessionFile2(dir), { force: true });
  const rpc = spawnOpencodeAgent(bin, { dir, cwd });
  let id;
  try {
    await handshake8(rpc);
    id = await newSession(rpc, cwd);
  } finally {
    await rpc.close();
  }
  if (!model) return id;
  const named = `the model ${model.providerID}/${model.id}`;
  if (!await exportSession(bin, dir, cwd, id)) throw new Error(`OpenCode could not write session ${id} out to set ${named}`);
  if (retarget(dir, model) && !await importSession(bin, dir, cwd)) throw new Error(`OpenCode would not take session ${id} back with ${named} set`);
  return id;
}
function leafOf(exported) {
  const last = exported.messages.at(-1);
  return last && `${exported.info.id}@${last.id}`;
}
function rewindSession2(dir, id, leaf) {
  const at = leaf.lastIndexOf("@");
  const exported = leaf.slice(0, at) === id ? readExport(dir) : null;
  const kept = exported?.info.id === id ? exported.messages.findIndex((m) => m.id === leaf.slice(at + 1)) + 1 : 0;
  if (!exported || !kept) return false;
  if (kept < exported.messages.length) {
    atomicWriteFileSync(sessionFile2(dir), JSON.stringify({ ...exported, messages: exported.messages.slice(0, kept) }));
    dropDatabase(dir);
  }
  return true;
}
function modelCalls(exported, since) {
  return exported.messages.flatMap((m) => {
    if (m.type !== "assistant" || !m.tokens || (m.time?.created ?? 0) < since) return [];
    return [{
      provider: "opencode",
      modelId: `${m.model?.providerID ?? ""}/${m.model?.id ?? ""}`,
      thinkingLevel: m.model?.variant && m.model.variant !== OWN_EFFORT ? m.model.variant : "",
      at: m.time?.completed ?? m.time?.created,
      usage: {
        inputTokens: m.tokens.input ?? 0,
        outputTokens: (m.tokens.output ?? 0) + (m.tokens.reasoning ?? 0),
        cacheReadTokens: m.tokens.cache?.read ?? 0,
        cacheWriteTokens: m.tokens.cache?.write ?? 0,
        costUsd: m.cost ?? 0
      }
    }];
  });
}
function providerError(exported, since) {
  const m = exported.messages.filter((m2) => m2.type === "assistant" && m2.error && (m2.time?.created ?? 0) >= since).at(-1);
  return m && `${m.model?.providerID ?? "the provider"} answered ${m.error.status ? `${m.error.status}: ` : ""}${m.error.message ?? "an error"}`;
}
var HEAD8 = "tds_opencode_session";
var SESSION_ID6 = /^ses_[A-Za-z0-9]{1,64}$/;
function packSession8(dir, map) {
  try {
    return `${JSON.stringify({ [HEAD8]: map.id })}
${(0, import_node_fs43.readFileSync)(sessionFile2(dir), "utf8")}`;
  } catch {
    return null;
  }
}
function unpackSession8(dir, body) {
  const end = body.indexOf("\n");
  const head = end === -1 ? body : body.slice(0, end);
  if (!head.startsWith(`{"${HEAD8}"`)) return null;
  const id = String(JSON.parse(head)[HEAD8] ?? "");
  if (!SESSION_ID6.test(id)) return null;
  (0, import_node_fs43.rmSync)(dir, { recursive: true, force: true });
  (0, import_node_fs43.mkdirSync)(dir, { recursive: true });
  (0, import_node_fs43.writeFileSync)(sessionFile2(dir), end === -1 ? "" : body.slice(end + 1));
  return { id };
}
function codec9(home, sessionId) {
  const dir = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession8(dir, map),
    unpack: (body) => unpackSession8(dir, body),
    drop: () => (0, import_node_fs43.rmSync)(dir, { recursive: true, force: true })
  };
}
var opencodeSession = sessionMirror("opencode", codec9);

// src/lib/opencode/stream.ts
function toolStart9({ name, title, input, path }, servers) {
  const server = servers.find((s) => name.startsWith(`${s}_`));
  if (server) return [`${server}/${name.slice(server.length + 1)}`, ""];
  switch (name) {
    case "shell":
    case "bash":
      return ["Bash", (detail(input, "command") || title).slice(0, 100)];
    case "read":
      return ["Read", path];
    case "write":
      return ["Write", path];
    case "edit":
    case "patch":
    case "apply_patch":
      return ["Edit", path];
    case "grep": {
      const where = detail(input, "path");
      return ["Grep", `"${detail(input, "pattern")}"${where ? ` in ${where}` : ""}`];
    }
    case "glob":
      return ["Glob", detail(input, "pattern")];
    case "webfetch":
      return ["WebFetch", detail(input, "url")];
    case "websearch":
      return ["WebSearch", detail(input, "query")];
    case "subagent":
    case "task":
      return ["Task", detail(input, "description")];
    // Code Mode: a script over the tools OpenCode keeps behind this one call.
    case "execute":
      return [name, detail(input, "code").trim().split("\n")[0].slice(0, 100)];
    default:
      return [name || title, detail(input, "path", "command", "pattern", "query", "url", "description", "id")];
  }
}
function createOpencodeStream(pump, servers) {
  let live2 = false;
  const message = messageBuffer(pump);
  let messageId;
  let thoughtId;
  let context;
  const tools = /* @__PURE__ */ new Map();
  const announce = (call) => {
    if (call.announced) return;
    call.announced = true;
    pump.toolStart(...toolStart9(call, servers));
  };
  const fill = (call, u) => {
    if (u.title) call.title = String(u.title);
    if (u.rawInput && typeof u.rawInput === "object") call.input = u.rawInput;
    call.path = detail(call.input, "path", "filePath") || String(u.locations?.[0]?.path ?? "") || call.path;
  };
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      live2 = true;
    },
    // The prompt's response is the turn's end.
    turnEnded: () => {
      for (const call of tools.values()) announce(call);
      tools.clear();
      message.close();
    },
    handle(n) {
      if (!live2 || n.method !== "session/update") return;
      const u = n.params.update ?? {};
      switch (u.sessionUpdate) {
        // Every model call's answer is a message of its own.
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (!t) break;
          if (u.messageId !== messageId) message.close();
          messageId = u.messageId;
          message.chunk(t);
          break;
        }
        // A thought streams in pieces under one id; the next one starts apart.
        case "agent_thought_chunk": {
          message.close();
          const t = String(u.content?.text ?? "");
          pump.thinking(thoughtId !== void 0 && u.messageId !== thoughtId ? `

${t}` : t);
          thoughtId = u.messageId;
          break;
        }
        case "tool_call": {
          message.close();
          const call = { name: String(u.title ?? ""), title: "", input: {}, path: "", announced: false };
          fill(call, u);
          tools.set(String(u.toolCallId), call);
          if (u.status !== "pending") announce(call);
          break;
        }
        case "tool_call_update": {
          const call = tools.get(String(u.toolCallId));
          if (!call) break;
          fill(call, u);
          announce(call);
          break;
        }
        // What the session holds of the model's context window, as of the turn's last model call.
        case "usage_update":
          if (typeof u.used === "number" && u.size > 0) context = { tokens: u.used, contextWindow: u.size };
          break;
      }
    },
    report: () => context ? { contextUsage: context } : {}
  };
}

// src/lib/opencode/execute.ts
var STOPPED2 = {
  max_tokens: "OpenCode stopped the turn: the model's answer reached its length limit",
  refusal: "OpenCode stopped the turn: the provider filtered the response",
  cancelled: "OpenCode stopped the turn: a tool call waited on an approval nobody is there to give"
};
var ZERO_WIDTH_SPACE2 = String.fromCharCode(8203);
var asMessage3 = (text3) => text3.trimStart().startsWith("/") ? ZERO_WIDTH_SPACE2 + text3 : text3;
function withListedFile(servers, file2) {
  return servers.map((s) => s.name === BRIDGE_SERVER_NAME && s.transport === "stdio" ? { ...s, env: { ...s.env, [BRIDGE_LISTED_ENV]: file2 } } : s);
}
function opencodeDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveOpencodeExecutable() ? null : OPENCODE_MISSING,
    async run(ctx) {
      const bin = resolveOpencodeExecutable();
      home = opencodeHome();
      const dir = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : await opencodeSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const kept = !!known && (!step.resumeSessionAt || rewindSession2(dir, known.id, step.resumeSessionAt));
      if (known && !kept) console.warn(`[opencode] rewind leaf ${step.resumeSessionAt} is not in session ${known.id} \u2014 starting over`);
      bareSession(dir);
      const model = modelRef(step.agent.modelId, step.agent.thinkingLevel);
      let session3 = known && kept ? known.id : null;
      if (session3 && model) retarget(dir, model);
      if (session3 && (known.cwd !== cwd || !(0, import_node_fs44.existsSync)(databaseFile(dir))) && !await importSession(bin, dir, cwd)) session3 = null;
      session3 ??= await createSession(bin, dir, cwd, model);
      if (!ctx.ephemeral) opencodeSession.maps(home).write(sessionId, { id: session3, cwd, etag: known?.etag });
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const listed = bridgeListedFile(dir);
      (0, import_node_fs44.rmSync)(listed, { force: true });
      stageSession3(dir, { servers: withListedFile(mcp.servers, listed), instructions: turnInstructions(step, ctx.ephemeral) });
      carryCredentials(dir);
      const rpc = spawnOpencodeAgent(bin, { dir, cwd, env: step.secretEnv });
      const stream = createOpencodeStream(ctx.pump, mcp.servers.map((s) => s.name));
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "OpenCode");
      const startedAt = Date.now();
      const loaded = session3;
      let error;
      let exported = null;
      try {
        await handshake8(rpc);
        await loadSession(rpc, cwd, loaded).catch((err) => {
          dropDatabase(dir);
          throw err;
        });
        if (mcp.bridgeTools.length) await bridgeListed(listed);
        let active = false;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: loaded });
        });
        await runSteeredTurns(ctx, step, {
          prepare: async (text3, images) => ({ text: text3, images }),
          // A prompt sent under a running one is refused, so a steer waits for a follow-up turn.
          inject: async () => false,
          // The prompt response is the turn's end.
          async turn({ text: text3, images }) {
            const prompt = acpPrompt(asMessage3(text3), await downloadImages(images, stepId));
            active = true;
            stream.turnStarted();
            idle.arm();
            try {
              const { stopReason } = await rpc.call("session/prompt", { sessionId: loaded, prompt }, 0);
              error = STOPPED2[stopReason ?? ""];
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = isAcpAuthRequired(err) ? OPENCODE_NOT_SIGNED_IN : failure(err);
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            if (ctx.interrupted()) error = void 0;
            return !error;
          }
        });
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        (0, import_node_fs44.rmSync)(listed, { force: true });
        bareSession(dir);
        if ((0, import_node_fs44.existsSync)(databaseFile(dir))) exported = await exportSession(bin, dir, cwd, loaded);
        if (ctx.ephemeral) (0, import_node_fs44.rmSync)(dir, { recursive: true, force: true });
      }
      const calls = exported ? modelCalls(exported, startedAt) : [];
      const answered = error && exported && providerError(exported, startedAt);
      return { error: answered ? `${error} (${answered})` : error, leafId: exported ? leafOf(exported) : void 0, ...calls.length ? { modelCalls: calls } : {}, ...stream.report() };
    },
    backup: (ctx) => opencodeSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeOpencodeStep = externalStep(opencodeDriver);
function rewindOpencodeSession(step) {
  const home = opencodeHome();
  return opencodeSession.rewind(home, step, (map, leaf, sessionId) => rewindSession2(sessionHome(home, sessionId), map.id, leaf));
}

// src/lib/opencode/usage.ts
var import_node_child_process7 = require("node:child_process");
var import_node_crypto7 = require("node:crypto");
var import_node_fs45 = require("node:fs");
var import_promises8 = require("node:timers/promises");
var VERSION_TIMEOUT_MS = 1e4;
var START_TIMEOUT_MS = 3e4;
var STOP_WAIT_MS = 5e3;
var REQUEST_TIMEOUT_MS = 1e4;
var POLL_MS = 200;
var SETTLED_POLLS = 3;
var SETTLE_TIMEOUT_MS = 15e3;
var selector2 = (m) => `${m.providerID}/${m.id}`;
function ranked2(models, first2) {
  const providers = /* @__PURE__ */ new Map();
  for (const m of models) {
    const list = providers.get(m.providerID);
    if (list) list.push(m);
    else providers.set(m.providerID, [m]);
  }
  const lists = [...providers.values()];
  const lead = first2 && models.find((m) => selector2(m) === selector2(first2));
  const out = lead ? [lead] : [];
  for (let i = 0; lists.some((list) => i < list.length); i++) {
    for (const list of lists) if (list[i] && list[i] !== lead) out.push(list[i]);
  }
  return out;
}
function modelsFromOpencodeList(models, first2) {
  const runnable = models.filter((m) => m.enabled && typeof m.providerID === "string" && m.providerID && typeof m.id === "string" && m.id);
  return ranked2(runnable, first2).slice(0, RUNTIME_MODELS_MAX).map((m) => ({
    id: selector2(m),
    label: `${typeof m.name === "string" && m.name ? m.name : m.id} \xB7 ${m.providerID}`,
    effortLevels: (m.variants ?? []).flatMap((v) => typeof v.id === "string" && v.id && v.id !== "default" ? [v.id] : [])
  }));
}
function versionOf(stdout) {
  return /(?:^|[\sv])(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\b/.exec(stdout)?.[1] ?? null;
}
async function readVersion(bin, cwd, signal) {
  const out = await cliOutput(bin, ["--version"], { cwd, timeoutMs: VERSION_TIMEOUT_MS, signal });
  return out.failed ? null : versionOf(out.stdout);
}
function startServer(bin, dir, cwd, password) {
  const child = (0, import_node_child_process7.spawn)(bin, ["serve", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd,
    env: { ...opencodeEnv(dir), OPENCODE_SERVER_PASSWORD: password },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    windowsHide: true,
    shell: process.platform === "win32" && bin.endsWith(".cmd")
  });
  const url = new Promise((resolve6, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error(`OpenCode's server did not start within ${START_TIMEOUT_MS / 1e3}s`)), START_TIMEOUT_MS);
    const read = (d) => {
      out = (out + String(d)).slice(-2e3);
      const listening = /server listening on (http:\/\/\S+)/.exec(out);
      if (listening) {
        clearTimeout(timer);
        resolve6(listening[1]);
      }
    };
    child.stdout?.on("data", read);
    child.stderr?.on("data", read);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      reject(new Error(`opencode serve exited (code ${code}): ${errorLine(out)}`));
    });
  });
  url.catch(() => {
  });
  const exit = waitForExit(child).catch(() => void 0);
  const stop = async () => {
    killTree(child);
    await Promise.race([exit, (0, import_promises8.setTimeout)(STOP_WAIT_MS, void 0, { ref: false })]);
  };
  return { url, stop };
}
async function probeOpencodeUsage(signal) {
  const bin = resolveOpencodeExecutable();
  if (!bin) throw new Error(OPENCODE_MISSING);
  const home = opencodeHome();
  const cwd = workdir(home);
  const version = await readVersion(bin, cwd, signal);
  if (version && !supported(version)) throw new Error(tooOld(version));
  const dir = probeHome(home);
  stageSession3(dir, {});
  await sessionCommand(bin, ["list", "--standalone"], { dir, cwd });
  carryCredentials(dir);
  const password = (0, import_node_crypto7.randomBytes)(24).toString("hex");
  const server = startServer(bin, dir, cwd, password);
  const stop = async () => {
    await server.stop();
    try {
      (0, import_node_fs45.rmSync)(dir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[opencode] probe directory not removed: ${err.message}`);
    }
  };
  return withSpawned(signal, stop, async () => {
    const base = await server.url;
    const get = async (path) => {
      const res = await boundedFetch(`${base}${path}`, REQUEST_TIMEOUT_MS, { headers: { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}` } });
      if (!res.ok || !/\bjson\b/.test(res.headers.get("content-type") ?? "")) throw new Error(tooOld(version));
      return (await res.json()).data;
    };
    let models = [];
    let seen = "";
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;
    for (let same = 0; same < SETTLED_POLLS && Date.now() < deadline; ) {
      models = await get("/api/model") ?? [];
      const now = models.filter((m) => m.enabled).map(selector2).join("\n");
      same = now && now === seen ? same + 1 : 0;
      seen = now;
      await (0, import_promises8.setTimeout)(POLL_MS);
    }
    if (!seen) return SIGNED_OUT;
    return { ...noLimits(null), models: modelsFromOpencodeList(models, await get("/api/model/default")) };
  });
}

// src/lib/qwen-code/bin.ts
var QWEN_MISSING = "Qwen Code is not installed on this machine \u2014 install it (npm install -g @qwen-code/qwen-code) and run `qwen` once to set up a model provider, or point TDS_QWEN_CODE_BIN at the executable.";
var QWEN_OUTDATED = "Qwen Code on this machine is too old to be driven by tds \u2014 update it (npm install -g @qwen-code/qwen-code@latest).";
function resolveQwenExecutable(lookup) {
  return resolveExecutable({ override: "TDS_QWEN_CODE_BIN", command: "qwen" }, lookup);
}

// src/lib/qwen-code/execute.ts
var import_node_fs48 = require("node:fs");

// src/lib/qwen-code/home.ts
var import_node_fs46 = require("node:fs");
var import_node_os12 = require("node:os");
var import_node_path35 = require("node:path");
var QWEN_NOT_SIGNED_IN = "Qwen Code has no model provider to run on here \u2014 run `qwen` on this machine and set one up with /auth first (or set OPENAI_API_KEY, OPENAI_BASE_URL and OPENAI_MODEL).";
function qwenHome() {
  return runtimeHome("qwen-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
var projectOf = (cwd) => (process.platform === "win32" ? cwd.toLowerCase() : cwd).replace(/[^a-zA-Z0-9]/g, "-");
var projectsDir = (dir) => (0, import_node_path35.join)(dir, "projects");
var chatsDir2 = (dir, cwd) => (0, import_node_path35.join)(projectsDir(dir), projectOf(cwd), "chats");
var SETTINGS2 = "settings.json";
var INSTRUCTIONS = "QWEN.md";
var ENV_FILE = ".env";
var OAUTH_CREDENTIALS = "oauth_creds.json";
function ownerHome() {
  const configured = process.env.QWEN_HOME;
  return configured ? (0, import_node_path35.resolve)(expandHome(configured)) : (0, import_node_path35.join)((0, import_node_os12.homedir)(), ".qwen");
}
function ownerSettings(owner) {
  const path = (0, import_node_path35.join)(owner, SETTINGS2);
  if (!(0, import_node_fs46.existsSync)(path)) return {};
  const parsed = readJsoncObject(() => (0, import_node_fs46.readFileSync)(path, "utf8"));
  if (parsed) return parsed;
  console.warn(`[qwen] ${path} did not parse \u2014 a sign-in kept there is not carried over`);
  return {};
}
var SIGN_IN_KEYS3 = ["$version", "modelProviders", "providerProtocol", "env", "proxy"];
function signInFrom(owner) {
  const signIn3 = {};
  for (const key of SIGN_IN_KEYS3) {
    if (owner[key] !== void 0) signIn3[key] = owner[key];
  }
  if (owner.security?.auth) signIn3.security = { auth: owner.security.auth };
  const { name, baseUrl } = owner.model ?? {};
  if (name || baseUrl) signIn3.model = { ...name ? { name } : {}, ...baseUrl ? { baseUrl } : {} };
  return signIn3;
}
var bridged = (tool) => `mcp__${BRIDGE_SERVER_NAME}__${tool}`;
var UNATTENDED = ["ask_user_question", "enter_plan_mode", "exit_plan_mode", "cron_create", "cron_list", "cron_delete", "loop_wakeup", "monitor", "enter_worktree", "exit_worktree"];
var WRITES = ["edit", "write_file", "notebook_edit"];
function settings2(stage, signIn3) {
  return {
    ...signIn3,
    general: { enableAutoUpdate: false, gitCoAuthor: { commit: false, pr: false } },
    ui: { enableFollowupSuggestions: false },
    memory: { enableManagedAutoMemory: false, enableManagedAutoDream: false },
    privacy: { usageStatisticsEnabled: false },
    tools: { visible: (stage.bridgeTools ?? []).map(bridged) },
    permissions: { deny: [...UNATTENDED, ...stage.readOnly ? WRITES : []] }
  };
}
function stageSession4(dir, stage, owner = ownerHome()) {
  (0, import_node_fs46.mkdirSync)(dir, { recursive: true });
  atomicWriteFileSync((0, import_node_path35.join)(dir, SETTINGS2), `${JSON.stringify(settings2(stage, signInFrom(ownerSettings(owner))), null, 2)}
`, { mode: 384 });
  for (const file2 of [OAUTH_CREDENTIALS, ENV_FILE]) {
    if ((0, import_node_fs46.existsSync)((0, import_node_path35.join)(owner, file2))) linkAuth((0, import_node_path35.join)(owner, file2), dir, "qwen");
  }
  if (stage.instructions) (0, import_node_fs46.writeFileSync)((0, import_node_path35.join)(dir, INSTRUCTIONS), `${stage.instructions}
`);
  else (0, import_node_fs46.rmSync)((0, import_node_path35.join)(dir, INSTRUCTIONS), { force: true });
}
function unstageSession2(dir) {
  for (const file2 of [SETTINGS2, ENV_FILE]) (0, import_node_fs46.rmSync)((0, import_node_path35.join)(dir, file2), { force: true });
}
function qwenEnv(dir, secrets) {
  return { ...process.env, ...secrets, QWEN_HOME: dir, QWEN_RUNTIME_DIR: dir, QWEN_CODE_LEGACY_MCP_BLOCKING: "1" };
}

// src/lib/qwen-code/rpc.ts
var DRAIN = "craft/drainMidTurnQueue";
var DRAIN_MAX = 10;
function createSteerQueue() {
  const waiting = [];
  return {
    push: (content) => {
      waiting.push(content);
    },
    // What one of the CLI's asks takes.
    drain: () => ({ items: waiting.splice(0, DRAIN_MAX).map((content) => ({ content })), hasQueuedPrompt: false }),
    // Whatever no ask came for: a turn that ran no further tool never asked.
    rest: () => waiting.splice(0)
  };
}
function spawnQwenAgent(bin, opts) {
  return spawnStdioRpc(bin, ["--acp", "--approval-mode", "yolo"], {
    label: "qwen",
    cwd: opts.cwd,
    env: qwenEnv(opts.dir, opts.env),
    autoReply: acpAutoReply((method) => method === DRAIN && opts.steers ? opts.steers.drain() : null),
    callTimeoutMs: TIMEOUTS_MS.qwenRpc,
    exitTimeoutMs: TIMEOUTS_MS.qwenExit
  });
}
var handshake9 = (rpc) => acpInitialize(rpc);
function reason(err) {
  const details = err.rpc.data?.details;
  return typeof details === "string" && details ? details : err.rpc.message;
}
var signInError2 = (err) => new Error(`${err.rpc.message.replace(/[.\s]+$/, "")}. ${QWEN_NOT_SIGNED_IN}`);
var session = (sessionId, fresh, opened) => ({ sessionId, fresh, configOptions: opened?.configOptions ?? [], model: opened?.models?.currentModelId ?? "" });
async function openSession6(rpc, cwd, known, mcpServers) {
  if (known) {
    try {
      return session(known, false, await rpc.call("session/resume", { sessionId: known, cwd, mcpServers }, TIMEOUTS_MS.qwenResume));
    } catch (err) {
      if (isAcpAuthRequired(err)) throw signInError2(err);
      console.warn(`[qwen] session/resume ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  try {
    const created = await rpc.call("session/new", { cwd, mcpServers });
    return session(created.sessionId, true, created);
  } catch (err) {
    throw isAcpAuthRequired(err) ? signInError2(err) : err;
  }
}

// src/lib/qwen-code/session.ts
var import_node_fs47 = require("node:fs");
var import_node_path36 = require("node:path");
var logName = (id) => `${id}.jsonl`;
function logOf2(dir, id) {
  let projects;
  try {
    projects = (0, import_node_fs47.readdirSync)(projectsDir(dir));
  } catch {
    return null;
  }
  for (const project of projects) {
    const path = (0, import_node_path36.join)(projectsDir(dir), project, "chats", logName(id));
    if ((0, import_node_fs47.existsSync)(path)) return path;
  }
  return null;
}
function uuidOf(line) {
  try {
    return String(JSON.parse(line).uuid ?? "") || null;
  } catch {
    return null;
  }
}
function placeSession(dir, id, cwd) {
  const found2 = logOf2(dir, id);
  if (!found2) return false;
  const target = (0, import_node_path36.join)(chatsDir2(dir, cwd), logName(id));
  const text3 = (0, import_node_fs47.readFileSync)(found2, "utf8");
  const end = text3.indexOf("\n");
  let first2;
  try {
    first2 = JSON.parse(end === -1 ? text3 : text3.slice(0, end));
  } catch {
    return false;
  }
  if (found2 === target && first2.cwd === cwd) return true;
  (0, import_node_fs47.mkdirSync)(chatsDir2(dir, cwd), { recursive: true });
  atomicWriteFileSync(target, `${JSON.stringify({ ...first2, cwd })}${end === -1 ? "\n" : text3.slice(end)}`);
  if (found2 !== target) (0, import_node_fs47.rmSync)((0, import_node_path36.dirname)((0, import_node_path36.dirname)(found2)), { recursive: true, force: true });
  return true;
}
function sessionLeaf2(dir, id) {
  const path = logOf2(dir, id);
  const last = path && uuidOf((0, import_node_fs47.readFileSync)(path, "utf8").trimEnd().split("\n").at(-1) ?? "");
  return last ? `${id}@${last}` : void 0;
}
function rewindSession3(dir, id, leaf) {
  const at = leaf.lastIndexOf("@");
  const path = leaf.slice(0, at) === id ? logOf2(dir, id) : null;
  if (!path) return false;
  const uuid = leaf.slice(at + 1);
  const lines = (0, import_node_fs47.readFileSync)(path, "utf8").split("\n").filter(Boolean);
  const kept = lines.findIndex((line) => line.includes(uuid) && uuidOf(line) === uuid) + 1;
  if (!kept) return false;
  if (kept < lines.length) atomicWriteFileSync(path, `${lines.slice(0, kept).join("\n")}
`);
  return true;
}
var HEAD9 = "tds_qwen_session";
var SESSION_ID7 = /^[0-9a-f-]{36}$/i;
var RESTORED = "tds-restored";
function packSession9(dir, map) {
  const log = logOf2(dir, map.id);
  return log ? `${JSON.stringify({ [HEAD9]: map.id })}
${(0, import_node_fs47.readFileSync)(log, "utf8")}` : null;
}
function unpackSession9(dir, body) {
  const end = body.indexOf("\n");
  const head = end === -1 ? body : body.slice(0, end);
  if (!head.startsWith(`{"${HEAD9}"`)) return null;
  const id = String(JSON.parse(head)[HEAD9] ?? "");
  if (!SESSION_ID7.test(id)) return null;
  (0, import_node_fs47.rmSync)(projectsDir(dir), { recursive: true, force: true });
  const chats = (0, import_node_path36.join)(projectsDir(dir), RESTORED, "chats");
  (0, import_node_fs47.mkdirSync)(chats, { recursive: true });
  (0, import_node_fs47.writeFileSync)((0, import_node_path36.join)(chats, logName(id)), end === -1 ? "" : body.slice(end + 1));
  return { id };
}
function codec10(home, sessionId) {
  const dir = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession9(dir, map),
    unpack: (body) => unpackSession9(dir, body),
    drop: () => (0, import_node_fs47.rmSync)(dir, { recursive: true, force: true })
  };
}
var qwenSession = sessionMirror("qwen", codec10);

// src/lib/qwen-code/stream.ts
var MCP_TOOL = /^mcp__(.+?)__(.+)$/;
function toolStart10(u) {
  let name = String(u._meta?.toolName ?? u.title ?? "tool");
  let input = u.rawInput;
  if (name === "tool_call" && typeof input?.name === "string") [name, input] = [input.name, input.arguments];
  const mcp = MCP_TOOL.exec(name);
  if (mcp) return [`${mcp[1]}/${mcp[2]}`, ""];
  const path = () => detail(input, "file_path", "notebook_path", "path") || String(u.locations?.[0]?.path ?? "");
  switch (name) {
    case "run_shell_command":
      return ["Bash", detail(input, "command").slice(0, 100)];
    case "read_file":
      return ["Read", path()];
    case "write_file":
      return ["Write", path()];
    case "edit":
    case "notebook_edit":
      return ["Edit", path()];
    case "grep_search": {
      const dir = detail(input, "path");
      return ["Grep", `"${detail(input, "pattern")}"${dir ? ` in ${dir}` : ""}`];
    }
    case "glob":
      return ["Glob", detail(input, "pattern")];
    case "list_directory":
      return ["Glob", detail(input, "path")];
    case "web_search":
      return ["WebSearch", detail(input, "query")];
    case "web_fetch":
      return ["WebFetch", detail(input, "url")];
    case "agent":
      return ["Task", detail(input, "description")];
    default:
      return [name, detail(input, "path", "command", "pattern", "query", "url", "description", "skill")];
  }
}
function createQwenStream(pump) {
  const message = messageBuffer(pump);
  let modelId = "";
  let thinkingLevel = "";
  let context;
  const preparing = /* @__PURE__ */ new Set();
  const calls = [];
  const count3 = (usage) => {
    const cached5 = usage.cachedReadTokens ?? 0;
    calls.push({
      provider: "qwen-code",
      modelId,
      thinkingLevel,
      at: Date.now(),
      usage: { inputTokens: Math.max(0, (usage.inputTokens ?? 0) - cached5), outputTokens: usage.outputTokens ?? 0, cacheReadTokens: cached5, cacheWriteTokens: 0, costUsd: 0 }
    });
  };
  return {
    // The model the session runs on, which the ledger names: a chunk's usage names none.
    runsOn(model, effort) {
      modelId = model;
      thinkingLevel = effort ?? "";
    },
    // The prompt's response is the turn's end.
    turnEnded: message.close,
    handle(n) {
      if (n.method !== "session/update") return;
      const u = n.params.update ?? {};
      const nested = !!u._meta?.parentToolCallId;
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          if (u._meta?.usage) count3(u._meta.usage);
          const t = String(u.content?.text ?? "");
          if (t && !nested) message.chunk(t);
          break;
        }
        case "agent_thought_chunk":
          if (nested) break;
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        case "tool_call":
          if (u._meta?.phase === "preparing") {
            preparing.add(String(u.toolCallId));
            break;
          }
          message.close();
          pump.toolStart(...toolStart10(u));
          break;
        // A call's later updates (its result, a failure) say nothing the frame carries.
        case "tool_call_update":
          if (!preparing.delete(String(u.toolCallId)) || u._meta?.preparationDiscarded) break;
          message.close();
          pump.toolStart(...toolStart10(u));
          break;
        case "usage_update":
          if (typeof u.used === "number" && u.size > 0) context = { tokens: u.used, contextWindow: u.size };
          break;
      }
    },
    report: () => ({ ...calls.length ? { modelCalls: calls } : {}, ...context ? { contextUsage: context } : {} })
  };
}

// src/lib/qwen-code/execute.ts
var STOPPED3 = {
  max_tokens: "Qwen Code stopped the turn: the session has outgrown its token limit"
};
var ZERO_WIDTH_SPACE3 = String.fromCharCode(8203);
var asMessage4 = (text3) => /^\s*\//.test(text3) ? ZERO_WIDTH_SPACE3 + text3 : text3;
async function blocks(text3, images, stepId) {
  return acpPrompt(asMessage4(text3), await downloadImages(images, stepId));
}
function qwenDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveQwenExecutable() ? null : QWEN_MISSING,
    async run(ctx) {
      home = qwenHome();
      const dir = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : await qwenSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const kept = !!known && (!step.resumeSessionAt || rewindSession3(dir, known.id, step.resumeSessionAt));
      if (known && !kept) console.warn(`[qwen] rewind leaf ${step.resumeSessionAt} is not in session ${known.id} \u2014 starting over`);
      const resumable2 = known && kept && placeSession(dir, known.id, cwd) ? known.id : null;
      if (!resumable2) (0, import_node_fs48.rmSync)(projectsDir(dir), { recursive: true, force: true });
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      stageSession4(dir, { instructions: turnInstructions(step, ctx.ephemeral), bridgeTools: mcp.bridgeTools, readOnly: ctx.ephemeral || !!step.readOnly });
      const steers = createSteerQueue();
      const rpc = spawnQwenAgent(resolveQwenExecutable(), { dir, cwd, env: step.secretEnv, steers });
      const stream = createQwenStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Qwen Code");
      let session3 = "";
      let error;
      let leaf;
      try {
        await handshake9(rpc);
        const opened = await openSession6(rpc, cwd, resumable2, acpMcpServers(mcp.servers));
        session3 = opened.sessionId;
        if (!ctx.ephemeral && session3 !== known?.id) qwenSession.maps(home).write(sessionId, { id: session3, etag: known?.etag });
        await selectAcpModel(rpc, "Qwen Code", opened, step.agent.modelId, step.agent.thinkingLevel);
        stream.runsOn(step.agent.modelId || opened.model, step.agent.thinkingLevel);
        let active = false;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: session3 });
        });
        const prompt = async (content) => {
          active = true;
          idle.arm();
          try {
            const { stopReason } = await rpc.call("session/prompt", { sessionId: session3, prompt: content }, 0);
            error = STOPPED3[stopReason ?? ""];
          } catch (err) {
            if (!isRpcError(err)) throw err;
            error = isAcpAuthRequired(err) ? QWEN_NOT_SIGNED_IN : reason(err);
          } finally {
            idle.disarm();
            active = false;
            stream.turnEnded();
          }
          if (ctx.interrupted()) error = void 0;
          return !error;
        };
        await runSteeredTurns(ctx, step, {
          prepare: (text3, images) => blocks(text3, images, stepId),
          // The CLI collects mid-turn messages itself, after each batch of tool calls; between
          // prompts nothing would, so a steer then waits for a follow-up turn.
          async inject(content) {
            if (!active) return false;
            steers.push(content);
            return true;
          },
          // The prompt response is the turn's end. What the CLI never came for — the turn ran no
          // further tool — goes in as the next prompt.
          async turn(content) {
            for (let next = content; next.length; next = steers.rest().flat()) {
              if (!await prompt(next)) return false;
              if (ctx.interrupted()) break;
            }
            return true;
          }
        });
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        unstageSession2(dir);
        if (ctx.ephemeral) (0, import_node_fs48.rmSync)(dir, { recursive: true, force: true });
        else if (session3) leaf = sessionLeaf2(dir, session3);
      }
      return { error, leafId: leaf, ...stream.report() };
    },
    backup: (ctx) => qwenSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeQwenStep = externalStep(qwenDriver);
function rewindQwenSession(step) {
  const home = qwenHome();
  return qwenSession.rewind(home, step, (map, leaf, sessionId) => rewindSession3(sessionHome(home, sessionId), map.id, leaf));
}

// src/lib/qwen-code/usage.ts
var import_node_fs49 = require("node:fs");
var RPC_TIMEOUT_MS8 = 3e4;
function modelsFromQwenSession(models, current) {
  const rows = models.flatMap((m) => typeof m.modelId === "string" && m.modelId ? [{ id: m.modelId, label: typeof m.name === "string" && m.name ? m.name : m.modelId, effortLevels: [] }] : []);
  return [...rows.filter((m) => m.id === current), ...rows.filter((m) => m.id !== current)];
}
async function probeQwenUsage(signal) {
  const bin = resolveQwenExecutable();
  if (!bin) throw new Error(QWEN_MISSING);
  const home = qwenHome();
  const dir = probeHome(home);
  const cwd = workdir(home);
  stageSession4(dir, {});
  const rpc = spawnQwenAgent(bin, { dir, cwd });
  try {
    return await withSpawned(signal, () => rpc.close(), async () => {
      let opened;
      try {
        await handshake9(rpc);
        opened = await rpc.call("session/new", { cwd, mcpServers: [] }, RPC_TIMEOUT_MS8);
      } catch (err) {
        if (isAcpAuthRequired(err)) return SIGNED_OUT;
        throw outdatedIfRejected(err, QWEN_OUTDATED);
      }
      return { ...noLimits(null), models: modelsFromQwenSession(opened?.models?.availableModels ?? [], opened?.models?.currentModelId) };
    });
  } finally {
    (0, import_node_fs49.rmSync)(dir, { recursive: true, force: true });
  }
}

// src/lib/droid/bin.ts
var DROID_MISSING = "Droid CLI is not installed on this machine \u2014 install it (curl -fsSL https://app.factory.ai/cli | sh) and run `droid` to sign in, or point TDS_DROID_BIN at the executable.";
function resolveDroidExecutable(lookup) {
  return resolveExecutable({ override: "TDS_DROID_BIN", command: "droid" }, lookup);
}

// src/lib/droid/execute.ts
var import_node_fs52 = require("node:fs");
var import_node_path39 = require("node:path");

// src/lib/droid/home.ts
var import_node_fs50 = require("node:fs");
var import_node_os13 = require("node:os");
var import_node_path37 = require("node:path");
var DROID_NOT_SIGNED_IN = "Droid is not signed in on this machine \u2014 run `droid` and sign in first (or set FACTORY_API_KEY).";
var SETTINGS3 = {
  cloudSessionSync: false,
  cloudConfigSync: false,
  includeCoAuthoredByDroid: false,
  completionSound: "off",
  awaitingInputSound: "off"
};
var LOGINS = ["auth.v2.file", "auth.v2.keyring", "auth.v2.loginkeychain"];
var SIGN_IN_FILES3 = [...LOGINS, "auth.v2.key"];
function droidHome() {
  return runtimeHome("droid-home", [".factory", "workdir", "tds-sessions", "prompts"]);
}
var factoryDir = (home) => (0, import_node_path37.join)(home, ".factory");
function userFactoryDir(env) {
  return (0, import_node_path37.join)(env.FACTORY_HOME_OVERRIDE || (0, import_node_os13.homedir)(), ".factory");
}
var readSettings = (path) => readJsoncObject(() => (0, import_node_fs50.readFileSync)(path, "utf8")) ?? {};
function syncSettings(home, env) {
  const path = (0, import_node_path37.join)(factoryDir(home), "settings.json");
  const own = readSettings(path);
  const next = { ...own };
  for (const [key, value] of Object.entries(SETTINGS3)) if (!(key in next)) next[key] = value;
  const models = readSettings((0, import_node_path37.join)(userFactoryDir(env), "settings.json")).customModels;
  if (Array.isArray(models) && models.length) next.customModels = models;
  else delete next.customModels;
  if (JSON.stringify(next) === JSON.stringify(own)) return;
  atomicWriteFileSync(path, JSON.stringify(next, null, 2) + "\n", { mode: 384 });
}
function ensureDroidHome(env = process.env) {
  const home = droidHome();
  const user = userFactoryDir(env);
  for (const name of SIGN_IN_FILES3) {
    const source = (0, import_node_path37.join)(user, name);
    if ((0, import_node_fs50.existsSync)(source)) linkAuth(source, factoryDir(home), "droid");
    else (0, import_node_fs50.rmSync)((0, import_node_path37.join)(factoryDir(home), name), { force: true });
  }
  syncSettings(home, env);
  return home;
}
function signedIn3(home, env = process.env) {
  return !!env.FACTORY_API_KEY?.trim() || LOGINS.some((name) => (0, import_node_fs50.existsSync)((0, import_node_path37.join)(factoryDir(home), name)));
}
var isCustomModel = (modelId) => modelId.startsWith("custom:");
function droidEnv(home) {
  return { ...process.env, FACTORY_HOME_OVERRIDE: home, FACTORY_DROID_AUTO_UPDATE_ENABLED: "false" };
}

// src/lib/droid/rpc.ts
var import_node_crypto8 = require("node:crypto");
function autoReply4(method) {
  switch (method) {
    case "droid.request_permission":
      return { selectedOption: "cancel" };
    case "droid.ask_user":
      return { cancelled: true, answers: [] };
    case "droid.pick_options":
      return { cancelled: true, selectedIds: [] };
    default:
      return null;
  }
}
function spawnDroid(bin, opts) {
  return spawnStdioRpc(bin, [
    "exec",
    "--input-format",
    "stream-jsonrpc",
    "--output-format",
    "stream-jsonrpc",
    ...opts.instructions ? ["--append-system-prompt-file", opts.instructions] : []
  ], {
    label: "droid",
    cwd: opts.cwd,
    env: { ...opts.env, ...droidEnv(opts.home) },
    autoReply: autoReply4,
    callTimeoutMs: TIMEOUTS_MS.droidRpc,
    exitTimeoutMs: TIMEOUTS_MS.droidExit,
    typed: { factoryApiVersion: "1.0.0" }
  });
}
var stopped = (reason2) => reason2 === "permission_rejected" ? "Droid stopped the turn: a tool needed an approval nobody is there to give" : `Droid ended the turn: ${reason2.replaceAll("_", " ")}`;
function trackTurns(rpc) {
  const open = /* @__PURE__ */ new Set();
  const taken = /* @__PURE__ */ new Set();
  let failure2;
  let lastError = "";
  let wake = () => {
  };
  const gone = rpc.waitFor(() => void 0);
  gone.catch(() => {
  });
  rpc.onNotification((n) => {
    const e = n.params?.notification ?? {};
    if (e.type === "create_message") {
      if (open.has(e.message?.id)) taken.add(e.message.id);
    } else if (e.type === "error") {
      lastError = String(e.message ?? "");
    } else if (e.type === "agent_turn_completed") {
      if (e.turnId && !open.has(e.turnId)) return;
      for (const id of taken) open.delete(id);
      taken.clear();
      if (e.reason === "cancelled") open.clear();
      else if (e.reason !== "completed") failure2 ??= lastError || stopped(String(e.reason));
      lastError = "";
      wake();
    }
  });
  return {
    // One user message, admitted. timeout 0: after one the message may well have been taken.
    async send(input) {
      const messageId = (0, import_node_crypto8.randomUUID)();
      open.add(messageId);
      try {
        await rpc.call("droid.add_user_message", { messageId, text: input.text, ...input.images.length ? { images: input.images } : {} }, 0);
      } catch (err) {
        open.delete(messageId);
        wake();
        throw err;
      }
    },
    // A message is in flight, so one sent now joins its turn.
    busy: () => open.size > 0,
    // Resolves with the first failure among the turns that ran; rejects when Droid exits first.
    settled() {
      const over = new Promise((resolve6) => {
        wake = () => {
          if (open.size) return;
          wake = () => {
          };
          const error = failure2;
          failure2 = void 0;
          resolve6(error);
        };
        wake();
      });
      return Promise.race([over, gone]);
    }
  };
}
var UNATTENDED2 = { interactionMode: "auto", autonomyLevel: "high" };
var DISABLED_TOOLS = ["AskUser", "Loop"];
async function openSession7(rpc, known, { cwd, modelId, mcpServers }) {
  const opened = (sessionId, fresh, r) => {
    if (r.settings?.availableAutonomyLevels && !r.settings.availableAutonomyLevels.includes(UNATTENDED2.autonomyLevel)) {
      console.warn(`[droid] session ${sessionId} offers no ${UNATTENDED2.autonomyLevel} autonomy \u2014 tools that ask for approval will be declined`);
    }
    return { sessionId, fresh, model: r.settings?.modelId, models: r.availableModels ?? [], usage: r.inclusiveTokenUsage ?? r.tokenUsage ?? {} };
  };
  if (known) {
    try {
      return opened(known, false, await rpc.call("droid.load_session", { sessionId: known, mcpServers, disabledToolIds: DISABLED_TOOLS }, TIMEOUTS_MS.droidLoad));
    } catch (err) {
      if (!isRpcError(err)) throw err;
      console.warn(`[droid] load_session ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  const created = await rpc.call("droid.initialize_session", {
    machineId: "tds",
    cwd,
    mcpServers,
    blockOnMcpLoad: true,
    disabledToolIds: DISABLED_TOOLS,
    ...UNATTENDED2,
    ...modelId ? { modelId } : {}
  });
  return opened(String(created.sessionId), true, created);
}
async function selectModel2(rpc, { fresh, model: openedOn, models }, modelId, effort) {
  const model = models.find((m) => m.id === modelId);
  if (modelId && (fresh && openedOn !== modelId || models.length && (!model || model.disabled))) {
    throw new Error(`Droid cannot run the model ${modelId}: this sign-in does not offer it`);
  }
  const ladder = Array.isArray(model?.supportedReasoningEfforts) ? model.supportedReasoningEfforts : [];
  await rpc.call("droid.update_session_settings", {
    ...UNATTENDED2,
    ...modelId ? { modelId } : {},
    ...effort && ladder.includes(effort) ? { reasoningEffort: effort } : {}
  });
}

// src/lib/droid/session.ts
var import_node_fs51 = require("node:fs");
var import_node_path38 = require("node:path");
var sessionsDir3 = (home) => (0, import_node_path38.join)(factoryDir(home), "sessions");
var transcript = (dir, id) => (0, import_node_path38.join)(dir, `${id}.jsonl`);
var settings3 = (dir, id) => (0, import_node_path38.join)(dir, `${id}.settings.json`);
var FILES = [".jsonl", ".settings.json", ".settings.json.bak"];
var RESTORED2 = "tds-restored";
function projectKey2(cwd) {
  let path = (0, import_node_path38.resolve)(cwd);
  try {
    path = (0, import_node_fs51.realpathSync)(path);
  } catch {
  }
  return `-${path.replace(/[\\/]+$/, "").replace(/^\/+/, "").replace(/\/+/g, "-")}`;
}
function findSession(home, id) {
  let names;
  try {
    names = (0, import_node_fs51.readdirSync)(sessionsDir3(home));
  } catch {
    return null;
  }
  for (const name of names) {
    if ((0, import_node_fs51.existsSync)(transcript((0, import_node_path38.join)(sessionsDir3(home), name), id))) return (0, import_node_path38.join)(sessionsDir3(home), name);
  }
  return null;
}
function dropSession(home, id) {
  for (let dir = findSession(home, id); dir; dir = findSession(home, id)) {
    for (const suffix of FILES) (0, import_node_fs51.rmSync)((0, import_node_path38.join)(dir, `${id}${suffix}`), { force: true });
  }
}
function parseEntry3(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
function fileSession(home, id, cwd) {
  const from = findSession(home, id);
  if (!from) return false;
  const text3 = (0, import_node_fs51.readFileSync)(transcript(from, id), "utf8");
  const end = text3.indexOf("\n");
  const head = parseEntry3(end < 0 ? text3 : text3.slice(0, end));
  if (head?.type !== "session_start") return false;
  if (head.cwd === cwd && from !== (0, import_node_path38.join)(sessionsDir3(home), RESTORED2)) return true;
  const to = (0, import_node_path38.join)(sessionsDir3(home), projectKey2(cwd));
  (0, import_node_fs51.mkdirSync)(to, { recursive: true });
  atomicWriteFileSync(transcript(to, id), `${JSON.stringify({ ...head, cwd })}${end < 0 ? "\n" : text3.slice(end)}`);
  if (from !== to) {
    if ((0, import_node_fs51.existsSync)(settings3(from, id))) (0, import_node_fs51.renameSync)(settings3(from, id), settings3(to, id));
    (0, import_node_fs51.rmSync)(transcript(from, id), { force: true });
  }
  return true;
}
var HEAD10 = "tds_droid_session";
var SESSION_ID8 = /^[\w-]{1,128}$/;
function packSession10(home, map) {
  const dir = findSession(home, map.id);
  if (!dir) return null;
  let sessionSettings;
  try {
    sessionSettings = JSON.parse((0, import_node_fs51.readFileSync)(settings3(dir, map.id), "utf8"));
  } catch {
  }
  return `${JSON.stringify({ [HEAD10]: map.id, settings: sessionSettings })}
${(0, import_node_fs51.readFileSync)(transcript(dir, map.id), "utf8")}`;
}
function unpackSession10(home, body) {
  if (!body.startsWith(`{"${HEAD10}"`)) return null;
  const end = body.indexOf("\n");
  const head = JSON.parse(end < 0 ? body : body.slice(0, end));
  const id = head[HEAD10] ?? "";
  if (!SESSION_ID8.test(id)) return null;
  dropSession(home, id);
  const dir = (0, import_node_path38.join)(sessionsDir3(home), RESTORED2);
  (0, import_node_fs51.mkdirSync)(dir, { recursive: true });
  (0, import_node_fs51.writeFileSync)(transcript(dir, id), end < 0 ? "" : body.slice(end + 1));
  if (head.settings) (0, import_node_fs51.writeFileSync)(settings3(dir, id), JSON.stringify(head.settings, null, 2));
  return { id };
}
function sessionLines(home, id) {
  const dir = findSession(home, id);
  if (!dir) return null;
  try {
    return { file: transcript(dir, id), lines: (0, import_node_fs51.readFileSync)(transcript(dir, id), "utf8").split("\n").filter(Boolean) };
  } catch {
    return null;
  }
}
function sessionLeaf3(home, id) {
  const lines = sessionLines(home, id)?.lines ?? [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const entry = parseEntry3(lines[i]);
    if (entry?.type === "message" && entry.id) return entry.id;
  }
  return void 0;
}
function truncateSession2(home, id, leaf) {
  const session3 = sessionLines(home, id);
  if (!session3) return false;
  const { file: file2, lines } = session3;
  const at = lines.findIndex((l) => {
    if (!l.includes(leaf)) return false;
    const entry = parseEntry3(l);
    return entry?.type === "message" && entry.id === leaf;
  });
  if (at === -1) return false;
  let end = at + 1;
  while (end < lines.length && parseEntry3(lines[end])?.type !== "message") end++;
  if (end < lines.length) atomicWriteFileSync(file2, `${lines.slice(0, end).join("\n")}
`);
  return true;
}
function codec11(home) {
  return {
    pack: (map) => packSession10(home, map),
    unpack: (body) => unpackSession10(home, body),
    drop: (map) => dropSession(home, map.id)
  };
}
var droidSession = sessionMirror("droid", codec11);

// src/lib/droid/stream.ts
function toolStart11(name, input) {
  switch (name) {
    case "Execute":
      return ["Bash", detail(input, "command").slice(0, 100)];
    case "Read":
    case "Edit":
      return [name, detail(input, "file_path")];
    case "Create":
      return ["Write", detail(input, "file_path")];
    case "ApplyPatch":
      return ["Edit", detail(input, "file_path")];
    case "Grep": {
      const path = detail(input, "path");
      return ["Grep", `"${detail(input, "pattern")}"${path ? ` in ${path}` : ""}`];
    }
    case "Glob":
      return ["Glob", Array.isArray(input.patterns) ? input.patterns.join(", ") : detail(input, "folder")];
    case "LS":
      return ["LS", detail(input, "directory_path")];
    case "FetchUrl":
      return ["WebFetch", detail(input, "url")];
    case "WebSearch":
      return ["WebSearch", detail(input, "query")];
    case "Task":
      return ["Task", detail(input, "description", "subagent_type").slice(0, 100)];
    default: {
      const mcp = /^(.+?)___(.+)$/.exec(name);
      return mcp ? [`${mcp[1]}/${mcp[2]}`, ""] : [name, detail(input, "query", "skill", "title").slice(0, 100)];
    }
  }
}
var count = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
function createDroidStream(pump, thinkingLevel) {
  let session3 = "";
  const message = messageBuffer(pump);
  let streamed = "";
  let model = "";
  let totals = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
  const calls = [];
  const read = (u) => ({
    inputTokens: count(u?.inputTokens),
    outputTokens: count(u?.outputTokens),
    cacheCreationTokens: count(u?.cacheCreationTokens),
    cacheReadTokens: count(u?.cacheReadTokens)
  });
  return {
    // The session the turn runs in, with its totals so far: only its own events count from here
    // on, not those of another session (a subagent's) on the same pipe.
    begin(sessionId, usage, modelId) {
      session3 = sessionId;
      totals = read(usage);
      model = modelId;
    },
    handle(n) {
      if (!session3 || n.method !== "droid.session_notification") return;
      const e = n.params.notification ?? {};
      if ((n.params.sessionId ?? e.sessionId ?? session3) !== session3) return;
      switch (e.type) {
        case "assistant_text_delta": {
          const t = String(e.textDelta ?? "");
          if (!t) break;
          message.chunk(t);
          streamed = String(e.messageId ?? "");
          break;
        }
        case "assistant_text_complete":
          message.close();
          break;
        // A reply Droid takes back to ask the model again: what streamed stays on the page, but
        // not in the turn's record.
        case "assistant_message_retracted":
          message.drop();
          break;
        case "thinking_text_delta":
          pump.thinking(String(e.textDelta ?? ""));
          break;
        case "create_message": {
          const m = e.message ?? {};
          if (m.role !== "assistant") break;
          message.close();
          if (typeof m.modelId === "string" && m.modelId) model = m.modelId;
          for (const block of Array.isArray(m.content) ? m.content : []) {
            if (block?.type === "text" && block.text && streamed !== m.id) {
              pump.gap();
              pump.textDone(String(block.text));
            } else if (block?.type === "tool_use") {
              pump.toolStart(...toolStart11(String(block.name ?? "tool"), block.input ?? {}));
            }
          }
          break;
        }
        case "session_token_usage_changed": {
          const next = read(e.inclusiveTokenUsage ?? e.tokenUsage);
          const used = {
            inputTokens: Math.max(0, next.inputTokens - totals.inputTokens),
            outputTokens: Math.max(0, next.outputTokens - totals.outputTokens),
            cacheReadTokens: Math.max(0, next.cacheReadTokens - totals.cacheReadTokens),
            cacheWriteTokens: Math.max(0, next.cacheCreationTokens - totals.cacheCreationTokens)
          };
          totals = next;
          if (!used.inputTokens && !used.outputTokens && !used.cacheReadTokens && !used.cacheWriteTokens) break;
          calls.push({ provider: "droid", modelId: model, thinkingLevel: thinkingLevel ?? "", at: Date.now(), usage: { ...used, costUsd: 0 } });
          break;
        }
        case "llm_retry":
          pump.retry(Number(e.attempt) || 1, 0);
          break;
        case "agent_turn_completed":
          message.close();
          break;
      }
    },
    // `context` is the window's occupancy as get_context_stats reports it after the last turn.
    report(context) {
      if (!calls.length) return {};
      const contextWindow = count(context?.limit);
      return { modelCalls: calls, ...contextWindow > 0 ? { contextUsage: { tokens: typeof context?.used === "number" ? context.used : null, contextWindow } } : {} };
    }
  };
}

// src/lib/droid/execute.ts
var IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
function droidInstructions(step, ephemeral, bridgeTools2) {
  const example = bridgeTools2.includes("ask_user") ? "ask_user" : bridgeTools2[0];
  if (!example) return turnInstructions(step, ephemeral);
  const served = `${BRIDGE_SERVER_NAME}___${example}`;
  const note = `In this runtime the platform's tools are named ${BRIDGE_SERVER_NAME}___<tool> (${example} is ${served}) and sit in the deferred tool list: load one with ToolSearch (query "select:${served}") before its first call, and never take one for missing without looking there.`;
  return [turnInstructions(step, ephemeral), note].filter(Boolean).join("\n\n");
}
function stageInstructions(home, stepId, text3) {
  if (!text3) return { cleanup: () => {
  } };
  const file2 = (0, import_node_path39.join)(home, "prompts", `${stepId}.md`);
  (0, import_node_fs52.writeFileSync)(file2, text3);
  return { file: file2, cleanup: () => (0, import_node_fs52.rmSync)(file2, { force: true }) };
}
function prepareSession2(home, id, cwd, resumeAt) {
  if (fileSession(home, id, cwd) && (!resumeAt || truncateSession2(home, id, resumeAt))) return true;
  if (resumeAt) console.warn(`[droid] rewind leaf ${resumeAt} is not in session ${id} \u2014 starting over`);
  dropSession(home, id);
  return false;
}
async function userInput3(text3, images, stepId) {
  const downloaded = await downloadImages(images, stepId);
  return { text: text3, images: downloaded.filter((i) => IMAGE_TYPES.has(i.mimeType)).map((i) => ({ type: "base64", data: i.data, mediaType: i.mimeType })) };
}
function droidDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveDroidExecutable() ? null : DROID_MISSING,
    async run(ctx) {
      home = ensureDroidHome();
      if (!signedIn3(home, { ...process.env, ...step.secretEnv }) && !isCustomModel(step.agent.modelId)) throw new Error(DROID_NOT_SIGNED_IN);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const synced = ctx.ephemeral ? null : await droidSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const known = synced && prepareSession2(home, synced.id, cwd, step.resumeSessionAt) ? synced.id : null;
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const instructions = stageInstructions(home, stepId, droidInstructions(step, ctx.ephemeral, mcp.bridgeTools));
      const rpc = spawnDroid(resolveDroidExecutable(), { home, cwd, env: step.secretEnv, instructions: instructions.file });
      const stream = createDroidStream(ctx.pump, step.agent.thinkingLevel);
      rpc.onNotification(stream.handle);
      const turns = trackTurns(rpc);
      const idle = idleWatch(rpc, "Droid");
      let opened;
      let kept = false;
      try {
        opened = await openSession7(rpc, known, { cwd, modelId: step.agent.modelId, mcpServers: droidMcpServers(mcp.servers) });
        const droidSessionId = opened.sessionId;
        if (known && opened.fresh) dropSession(home, known);
        await selectModel2(rpc, opened, step.agent.modelId, step.agent.thinkingLevel);
        stream.begin(droidSessionId, opened.usage, step.agent.modelId);
        if (!ctx.ephemeral) {
          droidSession.maps(home).write(sessionId, { id: droidSessionId, etag: synced?.etag });
          kept = true;
        }
        let error;
        ctx.onStop(() => {
          if (turns.busy()) void rpc.call("droid.interrupt_session", {}).catch(() => {
          });
        });
        await runSteeredTurns(ctx, step, {
          prepare: (text3, images) => userInput3(text3, images, stepId),
          // With no turn running the message would start one nobody waits for, so the steer
          // waits for a follow-up turn.
          async inject(input) {
            if (!turns.busy()) return false;
            try {
              await turns.send(input);
              return true;
            } catch (err) {
              if (isRpcError(err)) return false;
              throw err;
            }
          },
          // To the completion that leaves no message of this turn, or of a steer it took, open.
          async turn(input) {
            idle.arm();
            try {
              await turns.send(input);
              error = await turns.settled();
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = err.rpc.message;
            } finally {
              idle.disarm();
            }
            return !error;
          }
        });
        const context = await rpc.call("droid.get_context_stats", {}).catch(() => null);
        await rpc.close();
        return { error, leafId: ctx.ephemeral ? void 0 : sessionLeaf3(home, droidSessionId), ...stream.report(context) };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        instructions.cleanup();
        if (opened?.fresh && !kept) dropSession(home, opened.sessionId);
      }
    },
    backup: (ctx) => droidSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeDroidStep = externalStep(droidDriver);
function rewindDroidSession(step) {
  const home = droidHome();
  return droidSession.rewind(home, step, (map, leaf) => truncateSession2(home, map.id, leaf), { backup: true });
}

// src/lib/droid/usage.ts
var RPC_TIMEOUT_MS9 = 3e4;
var rank2 = (m) => m.deprecated ? 3 : m.legacy ? 2 : m.isCustom ? 1 : 0;
function modelsFromDroidList(models, factory) {
  return models.filter((m) => typeof m.id === "string" && m.id && !m.disabled && (factory || m.isCustom)).sort((a, b) => rank2(a) - rank2(b)).slice(0, RUNTIME_MODELS_MAX).map((m) => {
    const id = m.id;
    const name = typeof m.displayName === "string" && m.displayName ? m.displayName : id;
    const ladder = (Array.isArray(m.supportedReasoningEfforts) ? m.supportedReasoningEfforts : []).filter((e) => typeof e === "string" && !!e);
    return {
      id,
      label: m.isCustom ? `${name} \xB7 custom` : name,
      // A ladder of `none` alone is a model with no effort to set.
      effortLevels: ladder.every((e) => e === "none") ? [] : ladder,
      ...typeof m.legacyReplacementId === "string" && m.legacyReplacementId ? { upgrade: m.legacyReplacementId } : {}
    };
  });
}
async function probeDroidUsage(signal) {
  const bin = resolveDroidExecutable();
  if (!bin) throw new Error(DROID_MISSING);
  const home = ensureDroidHome();
  const factory = signedIn3(home);
  const rpc = spawnDroid(bin, { home, cwd: workdir(home) });
  const listed = await withSpawned(signal, () => rpc.close(), () => rpc.call("droid.list_models", {}, RPC_TIMEOUT_MS9));
  const models = modelsFromDroidList(listed.models ?? [], factory);
  if (!models.length) return SIGNED_OUT;
  return factory ? { status: "ok", account: null, windows: [], models } : { ...noLimits(null), models };
}

// src/lib/cline/bin.ts
var CLINE_MISSING = "Cline CLI is not installed on this machine \u2014 install it (npm install -g cline) and run `cline auth` to sign in, or point TDS_CLINE_BIN at the executable.";
var CLINE_OUTDATED = "Cline CLI on this machine is too old to be driven by tds \u2014 update it (`npm install -g cline@latest`).";
function resolveClineExecutable(lookup) {
  return resolveExecutable({ override: "TDS_CLINE_BIN", command: "cline" }, lookup);
}

// src/lib/cline/execute.ts
var import_node_fs55 = require("node:fs");

// src/lib/cline/home.ts
var import_node_fs53 = require("node:fs");
var import_node_os14 = require("node:os");
var import_node_path40 = require("node:path");
var CLINE_NOT_SIGNED_IN = "Cline CLI is not signed in on this machine \u2014 run `cline auth` and sign in with a Cline account, ClinePass or a ChatGPT subscription first (or set CLINE_API_KEY, with CLINE_PROVIDER naming the provider).";
function clineHome() {
  return runtimeHome("cline-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
var RESTORED_PROVIDERS = ["cline", "cline-pass", "openai-codex"];
function ownerProvidersFile(env = process.env) {
  const configured = env.CLINE_PROVIDER_SETTINGS_PATH?.trim();
  if (configured) return configured;
  const data = env.CLINE_DATA_DIR?.trim() || (0, import_node_path40.join)(env.CLINE_DIR?.trim() || (0, import_node_path40.join)((0, import_node_os14.homedir)(), ".cline"), "data");
  return (0, import_node_path40.join)(data, "settings", "providers.json");
}
function signInFrom2(store, env) {
  if (env.CLINE_API_KEY?.trim()) return { provider: env.CLINE_PROVIDER?.trim() || "cline", accountId: null, fromEnv: true };
  const providers = store?.providers ?? {};
  for (const provider of RESTORED_PROVIDERS) {
    const settings4 = providers[provider]?.settings;
    const saved = [settings4?.auth?.accessToken, settings4?.apiKey, settings4?.auth?.apiKey].some((k) => typeof k === "string" && k.trim());
    if (!saved) continue;
    const accountId = settings4?.auth?.accountId;
    return { provider, accountId: typeof accountId === "string" && accountId ? accountId : null, fromEnv: false };
  }
  return null;
}
function signIn(env = process.env) {
  let store = null;
  try {
    store = JSON.parse((0, import_node_fs53.readFileSync)(ownerProvidersFile(env), "utf8"));
  } catch {
  }
  return signInFrom2(store, env);
}
var settingsDir = (dir) => (0, import_node_path40.join)(dir, "data", "settings");
var sessionsDir4 = (dir) => (0, import_node_path40.join)(dir, "data", "sessions");
var attachmentsDir3 = (dir) => (0, import_node_path40.join)(dir, "attachments");
var MCP_SETTINGS = "cline_mcp_settings.json";
var RULES3 = (0, import_node_path40.join)("rules", "tds.md");
function stageSession5(dir, stage) {
  (0, import_node_fs53.mkdirSync)(settingsDir(dir), { recursive: true });
  (0, import_node_fs53.mkdirSync)((0, import_node_path40.join)(dir, "rules"), { recursive: true });
  const mcp = (0, import_node_path40.join)(settingsDir(dir), MCP_SETTINGS);
  (0, import_node_fs53.rmSync)(mcp, { force: true });
  (0, import_node_fs53.writeFileSync)(mcp, `${JSON.stringify(clineMcpServers(stage.servers ?? []), null, 2)}
`, { mode: 384 });
  if (stage.instructions) (0, import_node_fs53.writeFileSync)((0, import_node_path40.join)(dir, RULES3), `${stage.instructions}
`);
  else (0, import_node_fs53.rmSync)((0, import_node_path40.join)(dir, RULES3), { force: true });
}
function unstageSession3(dir) {
  (0, import_node_fs53.rmSync)((0, import_node_path40.join)(settingsDir(dir), MCP_SETTINGS), { force: true });
}
var OWN_SETTINGS = ["CLINE_DIR", "CLINE_DATA_DIR", "CLINE_SANDBOX", "CLINE_SANDBOX_DATA_DIR", "CLINE_DB_DATA_DIR", "CLINE_SESSION_DATA_DIR", "CLINE_TEAM_DATA_DIR", "CLINE_PROVIDER_SETTINGS_PATH", "CLINE_GLOBAL_SETTINGS_PATH", "CLINE_MCP_SETTINGS_PATH", "CLINE_HOOKS_DIR", "CLINE_HOOKS_LOG_PATH", "CLINE_MODEL"];
function clineEnv(dir, secrets, owner = ownerProvidersFile()) {
  const env = { ...process.env, ...secrets };
  for (const key of OWN_SETTINGS) delete env[key];
  return {
    ...env,
    CLINE_DIR: dir,
    ...(0, import_node_fs53.existsSync)(owner) ? { CLINE_PROVIDER_SETTINGS_PATH: owner } : {},
    CLINE_SESSION_BACKEND_MODE: "local",
    CLINE_NO_AUTO_UPDATE: "1"
  };
}

// src/lib/cline/rpc.ts
function spawnClineAgent(bin, opts) {
  return spawnStdioRpc(bin, ["--acp", "--auto-approve", "true", "--config", opts.dir], {
    label: "cline",
    cwd: opts.cwd,
    env: clineEnv(opts.dir, opts.env),
    autoReply: acpAutoReply(),
    callTimeoutMs: TIMEOUTS_MS.clineRpc,
    exitTimeoutMs: TIMEOUTS_MS.clineExit
  });
}
var handshake10 = (rpc) => acpInitialize(rpc);
var signInError3 = (err) => new Error(`${err.rpc.message.replace(/[.\s]+$/, "")}. ${CLINE_NOT_SIGNED_IN}`);
var sessionProvider = (options) => String(options.find((o) => o.id === "provider")?.currentValue ?? "");
var session2 = (sessionId, fresh, opened) => {
  const configOptions = opened?.configOptions ?? [];
  return { sessionId, fresh, configOptions, models: opened?.models?.availableModels ?? [], provider: sessionProvider(configOptions) };
};
async function openSession8(rpc, cwd, known) {
  if (known) {
    try {
      return session2(known, false, await rpc.call("session/load", { sessionId: known, cwd, mcpServers: [] }, TIMEOUTS_MS.clineLoad));
    } catch (err) {
      if (isAcpAuthRequired(err)) throw signInError3(err);
      console.warn(`[cline] session/load ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  try {
    const created = await rpc.call("session/new", { cwd, mcpServers: [] });
    return session2(created.sessionId, true, created);
  } catch (err) {
    throw isAcpAuthRequired(err) ? signInError3(err) : err;
  }
}
async function selectModel3(rpc, opened, modelId) {
  if (!modelId) return;
  if (!opened.models.some((m) => m.modelId === modelId)) throw new Error(`Cline cannot run the model ${modelId}: its ${opened.provider || "current"} sign-in does not list it`);
  await selectAcpModel(rpc, "Cline", opened, modelId, null);
}

// src/lib/cline/session.ts
var import_node_fs54 = require("node:fs");
var import_node_path41 = require("node:path");
var sessionDir5 = (dir, id) => (0, import_node_path41.join)(sessionsDir4(dir), id);
var file = (dir, id, suffix) => (0, import_node_path41.join)(sessionDir5(dir, id), `${id}${suffix}`);
var MANIFEST = ".json";
var MESSAGES = ".messages.json";
var COMPACTION = ".compaction.json";
var MIRRORED6 = [MANIFEST, MESSAGES, COMPACTION];
var SESSION_ID9 = /^[A-Za-z0-9_-]{1,80}$/;
function readJson(path) {
  try {
    return JSON.parse((0, import_node_fs54.readFileSync)(path, "utf8"));
  } catch {
    return null;
  }
}
function sessionLeaf4(dir, id) {
  const last = readJson(file(dir, id, MESSAGES))?.messages?.at(-1)?.id;
  return typeof last === "string" && last ? `${id}@${last}` : void 0;
}
function rewindSession4(dir, id, leaf) {
  const at = leaf.lastIndexOf("@");
  if (leaf.slice(0, at) !== id || (0, import_node_fs54.existsSync)(file(dir, id, COMPACTION))) return false;
  const path = file(dir, id, MESSAGES);
  const log = readJson(path);
  const messages = log?.messages ?? [];
  const kept = messages.findIndex((m) => m?.id === leaf.slice(at + 1)) + 1;
  if (!log || !kept) return false;
  if (kept < messages.length) atomicWriteFileSync(path, `${JSON.stringify({ ...log, messages: messages.slice(0, kept) }, null, 2)}
`);
  return true;
}
var count2 = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
function sessionUsage(dir, id) {
  const meta = readJson(file(dir, id, MANIFEST))?.metadata;
  const used = meta?.aggregateUsage ?? meta?.usage ?? {};
  return { inputTokens: count2(used.inputTokens), outputTokens: count2(used.outputTokens), cacheReadTokens: count2(used.cacheReadTokens), cacheWriteTokens: count2(used.cacheWriteTokens), totalCost: count2(used.totalCost) };
}
var HEAD11 = "tds_cline_session";
var FILE6 = "tds_cline_file";
function packSession11(dir, map) {
  if (!(0, import_node_fs54.existsSync)(file(dir, map.id, MESSAGES))) return null;
  const lines = [JSON.stringify({ [HEAD11]: map.id })];
  for (const suffix of MIRRORED6) {
    const path = file(dir, map.id, suffix);
    if ((0, import_node_fs54.existsSync)(path)) lines.push(JSON.stringify({ [FILE6]: suffix, text: (0, import_node_fs54.readFileSync)(path, "utf8") }));
  }
  return lines.join("\n") + "\n";
}
function unpackSession11(dir, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD11}"`)) return null;
  const id = String(JSON.parse(lines[0])[HEAD11] ?? "");
  if (!SESSION_ID9.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const suffix = record[FILE6];
    if (!suffix || !MIRRORED6.includes(suffix) || typeof record.text !== "string") return null;
    files.push([suffix, record.text]);
  }
  (0, import_node_fs54.rmSync)(sessionsDir4(dir), { recursive: true, force: true });
  (0, import_node_fs54.mkdirSync)(sessionDir5(dir, id), { recursive: true });
  for (const [suffix, text3] of files) (0, import_node_fs54.writeFileSync)(file(dir, id, suffix), text3);
  placeSession2(dir, id);
  return { id };
}
function placeSession2(dir, id) {
  const path = file(dir, id, MANIFEST);
  const manifest = readJson(path);
  if (!manifest) return;
  manifest.messages_path = file(dir, id, MESSAGES);
  if (manifest.compaction_path) manifest.compaction_path = file(dir, id, COMPACTION);
  atomicWriteFileSync(path, `${JSON.stringify(manifest, null, 2)}
`);
}
function codec12(home, sessionId) {
  const dir = sessionHome(home, sessionId);
  return {
    pack: (map) => packSession11(dir, map),
    unpack: (body) => unpackSession11(dir, body),
    drop: () => (0, import_node_fs54.rmSync)(dir, { recursive: true, force: true })
  };
}
var clineSession = sessionMirror("cline", codec12);

// src/lib/cline/stream.ts
var MCP_TOOL2 = /^([^_].*?)__(.+)$/;
function first(input, key, ...keys) {
  const list = input?.[key];
  const item = Array.isArray(list) ? list[0] : void 0;
  return typeof item === "string" ? item : detail(item, ...keys);
}
function toolStart12(u) {
  const title = String(u.title ?? "");
  const name = title.split(": ")[0] ?? "";
  const input = u.rawInput && typeof u.rawInput === "object" ? u.rawInput : void 0;
  const mcp = MCP_TOOL2.exec(name);
  if (mcp) return [`${mcp[1]}/${mcp[2]}`, ""];
  switch (name) {
    case "run_commands":
    case "Bash":
      return ["Bash", (first(input, "commands") || detail(input, "command")).slice(0, 100)];
    case "read_files":
    case "Read":
      return ["Read", first(input, "files", "path") || detail(input, "path", "file_path")];
    case "search_codebase":
    case "Grep":
      return ["Grep", `"${first(input, "queries") || detail(input, "pattern", "query")}"`];
    case "Glob":
      return ["Glob", detail(input, "pattern", "path")];
    case "editor":
      return [input?.old_text == null && input?.insert_line == null ? "Write" : "Edit", detail(input, "path")];
    case "Edit":
    case "NotebookEdit":
      return ["Edit", detail(input, "file_path", "notebook_path", "path")];
    case "Write":
      return ["Write", detail(input, "file_path", "path")];
    case "fetch_web_content":
    case "WebFetch":
      return ["WebFetch", first(input, "requests", "url") || detail(input, "url")];
    case "web_search":
    case "WebSearch":
      return ["WebSearch", detail(input, "query")];
    case "spawn_agent":
    case "Agent":
      return ["Task", detail(input, "task", "description").slice(0, 100)];
    default:
      return [name || "tool", title.slice(name.length + 2, name.length + 102)];
  }
}
function createClineStream(pump) {
  let started2 = false;
  const message = messageBuffer(pump);
  return {
    // session/load replays the whole history as updates first; only the turn's own count.
    turnStarted: () => {
      started2 = true;
    },
    // The prompt's response is the turn's end.
    turnEnded: message.close,
    handle(n) {
      if (!started2 || n.method !== "session/update") return;
      const u = n.params.update ?? {};
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = u.content?.type === "text" ? String(u.content.text ?? "") : "";
          if (t) message.chunk(t);
          break;
        }
        case "agent_thought_chunk":
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        // A call's later updates (its result, a failure) say nothing the frame carries.
        case "tool_call":
          message.close();
          pump.toolStart(...toolStart12(u));
          break;
      }
    }
  };
}

// src/lib/cline/execute.ts
var STOPPED4 = {
  max_turn_requests: "Cline stopped the turn: it reached its iteration limit"
};
function clineInstructions(step, ephemeral, bridgeTools2) {
  const example = bridgeTools2.includes("ask_user") ? "ask_user" : bridgeTools2[0];
  const note = example ? `In this runtime the platform's tools are named ${BRIDGE_SERVER_NAME}__<tool> (${example} is ${BRIDGE_SERVER_NAME}__${example}): call those wherever these notes name one.` : "";
  return [turnInstructions(step, ephemeral), note].filter(Boolean).join("\n\n");
}
function turnCall(before, after, modelId) {
  const used = (key) => Math.max(0, after[key] - (before?.[key] ?? 0));
  const cached5 = used("cacheReadTokens");
  if (!used("inputTokens") && !used("outputTokens") && !cached5) return [];
  return [{
    provider: "cline",
    modelId,
    thinkingLevel: "",
    at: Date.now(),
    usage: { inputTokens: Math.max(0, used("inputTokens") - cached5), outputTokens: used("outputTokens"), cacheReadTokens: cached5, cacheWriteTokens: used("cacheWriteTokens"), costUsd: used("totalCost") }
  }];
}
function clineDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveClineExecutable() ? null : CLINE_MISSING,
    async run(ctx) {
      home = clineHome();
      const dir = ctx.ephemeral ? turnHome(home, stepId) : sessionHome(home, sessionId);
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      if (!signIn({ ...process.env, ...step.secretEnv })) throw new Error(CLINE_NOT_SIGNED_IN);
      const known = ctx.ephemeral ? null : await clineSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const kept = !!known && (!step.resumeSessionAt || rewindSession4(dir, known.id, step.resumeSessionAt));
      if (known && !kept) console.warn(`[cline] rewind leaf ${step.resumeSessionAt} is not in session ${known.id} \u2014 starting over`);
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      stageSession5(dir, { servers: mcp.servers, instructions: clineInstructions(step, ctx.ephemeral, mcp.bridgeTools) });
      const rpc = spawnClineAgent(resolveClineExecutable(), { dir, cwd, env: step.secretEnv });
      const stream = createClineStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "Cline");
      let session3 = "";
      let before = null;
      let error;
      let leaf;
      let calls = [];
      try {
        await handshake10(rpc);
        const opened = await openSession8(rpc, cwd, known && kept ? known.id : null);
        session3 = opened.sessionId;
        if (!opened.fresh) before = sessionUsage(dir, session3);
        if (!ctx.ephemeral && session3 !== known?.id) clineSession.maps(home).write(sessionId, { id: session3, etag: known?.etag });
        await selectModel3(rpc, opened, step.agent.modelId);
        let active = false;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: session3 });
        });
        await runSteeredTurns(ctx, step, {
          // The prompt reaches the model as text alone, so the images land as files it can read.
          prepare: (text3, images) => withImageFiles(text3, images, attachmentsDir3(dir), stepId),
          // A prompt sent under a running one cancels it, so a steer waits for a follow-up turn.
          inject: async () => false,
          // The prompt response is the turn's end.
          async turn(text3) {
            active = true;
            stream.turnStarted();
            idle.arm();
            try {
              const { stopReason } = await rpc.call("session/prompt", { sessionId: session3, prompt: [{ type: "text", text: text3 }] }, 0);
              error = STOPPED4[stopReason ?? ""];
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = isAcpAuthRequired(err) ? signInError3(err).message : err.rpc.message;
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            if (ctx.interrupted()) error = void 0;
            return !error;
          }
        });
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        unstageSession3(dir);
        if (session3) calls = turnCall(before, sessionUsage(dir, session3), step.agent.modelId);
        if (ctx.ephemeral) (0, import_node_fs55.rmSync)(dir, { recursive: true, force: true });
        else if (session3) leaf = sessionLeaf4(dir, session3);
      }
      return { error, leafId: leaf, ...calls.length ? { modelCalls: calls } : {} };
    },
    backup: (ctx) => clineSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeClineStep = externalStep(clineDriver);
function rewindClineSession(step) {
  const home = clineHome();
  return clineSession.rewind(home, step, (map, leaf, sessionId) => rewindSession4(sessionHome(home, sessionId), map.id, leaf));
}

// src/lib/cline/usage.ts
var import_node_fs56 = require("node:fs");
var RPC_TIMEOUT_MS10 = 3e4;
function modelsFromClineSession(models, current) {
  const rows = models.flatMap((m) => typeof m.modelId === "string" && m.modelId ? [{ id: m.modelId, label: typeof m.name === "string" && m.name ? m.name : m.modelId, effortLevels: [] }] : []);
  return [...rows.filter((m) => m.id === current), ...rows.filter((m) => m.id !== current)].slice(0, RUNTIME_MODELS_MAX);
}
function planFromOptions(options) {
  const provider = options.find((o) => o.id === "provider");
  return provider?.options?.find((v) => v.value === provider.currentValue)?.name ?? (provider?.currentValue || null);
}
async function probeClineUsage(signal) {
  const bin = resolveClineExecutable();
  if (!bin) throw new Error(CLINE_MISSING);
  const login = signIn();
  if (!login) return SIGNED_OUT;
  const home = clineHome();
  const dir = probeHome(home);
  const cwd = workdir(home);
  stageSession5(dir, {});
  const rpc = spawnClineAgent(bin, { dir, cwd });
  try {
    return await withSpawned(signal, () => rpc.close(), async () => {
      let opened;
      try {
        await handshake10(rpc);
        opened = await rpc.call("session/new", { cwd, mcpServers: [] }, RPC_TIMEOUT_MS10);
      } catch (err) {
        if (isAcpAuthRequired(err)) return SIGNED_OUT;
        throw outdatedIfRejected(err, CLINE_OUTDATED);
      }
      const models = modelsFromClineSession(opened?.models?.availableModels ?? [], opened?.models?.currentModelId);
      if (login.fromEnv) return { ...noLimits(null), models };
      return { status: "ok", account: { id: login.accountId, email: null, plan: planFromOptions(opened?.configOptions ?? []) }, windows: [], models };
    });
  } finally {
    (0, import_node_fs56.rmSync)(dir, { recursive: true, force: true });
  }
}

// src/lib/dsh/bin.ts
var DSH_MISSING = "DeepSeek Harness (dsh) is not installed on this machine \u2014 install it (npm install -g @deepseek-ai/dsh) and add your DeepSeek API key or sign in with your DeepSeek account on the Models page of `dsh web`, or point TDS_DSH_BIN at the executable.";
var DSH_OUTDATED = "DeepSeek Harness (dsh) on this machine is too old to be driven by tds \u2014 update it (`npm install -g @deepseek-ai/dsh@latest`).";
function resolveDshExecutable(lookup) {
  return resolveExecutable({ override: "TDS_DSH_BIN", command: "dsh" }, lookup);
}

// src/lib/dsh/execute.ts
var import_node_crypto9 = require("node:crypto");

// src/lib/dsh/home.ts
var import_node_fs57 = require("node:fs");
var import_node_os15 = require("node:os");
var import_node_path42 = require("node:path");
var DSH_NOT_SIGNED_IN = "DeepSeek Harness (dsh) has no sign-in on this machine \u2014 run `dsh web` and add your DeepSeek API key or sign in with your DeepSeek account on its Models page first (or set DEEPSEEK_API_KEY in the environment tds start runs in).";
function dshHome() {
  return runtimeHome("dsh-home", ["workdir", "tds-sessions", "sessions", "turns"]);
}
function ownerHome2(env = process.env) {
  const configured = env.DSH_HOME?.trim();
  return configured ? (0, import_node_path42.resolve)(expandHome(configured)) : (0, import_node_path42.join)((0, import_node_os15.homedir)(), ".dsh");
}
var ownerCredentialsFile = (env = process.env) => (0, import_node_path42.join)(ownerHome2(env), ".credentials.yaml");
var ACCOUNT_RECORD = "deepseek-account-platform/default";
var ENTRY = /^([^:#\s][^:]*):\s*(.*)$/;
function signInFrom3(text3, env) {
  if (env.DEEPSEEK_API_KEY?.trim()) return { kind: "api_key", fromEnv: true };
  let section = "";
  let apiKey = false;
  let account = false;
  for (const raw of text3?.split("\n") ?? []) {
    const line = raw.trimEnd();
    const indent = line.length - line.trimStart().length;
    const entry = ENTRY.exec(line.trim());
    if (!entry) continue;
    const [, key, value] = entry;
    if (indent === 0) {
      section = key;
      if (key === "DEEPSEEK_API_KEY" && value) apiKey = true;
    } else if (section === "refs" && key === "DEEPSEEK_API_KEY" && value) {
      apiKey = true;
    } else if (section === "records" && indent === 2 && key === ACCOUNT_RECORD) {
      account = true;
    }
  }
  if (apiKey) return { kind: "api_key", fromEnv: false };
  return account ? { kind: "account", fromEnv: false } : null;
}
function signIn2(env = process.env) {
  let text3 = null;
  try {
    text3 = (0, import_node_fs57.readFileSync)(ownerCredentialsFile(env), "utf8");
  } catch {
  }
  return signInFrom3(text3, env);
}
var attachmentsDir4 = (home) => (0, import_node_path42.join)(home, "attachments");
var PERSONA = "You are a coding agent powered by the {{model}} model.";
var WORKDIR = "Your working directory is {{cwd}}.";
var literal2 = (text3) => text3.replace(/\{\{/g, "{\u200B{");
function patchFor(stage, owner = ownerCredentialsFile()) {
  return [
    ...(0, import_node_fs57.existsSync)(owner) ? [{ id: "credentials", config: { path: owner } }] : [],
    { id: "system-prompt", config: { personaPrefix: [PERSONA, stage.instructions ? literal2(stage.instructions) : ""].filter(Boolean).join("\n\n"), personaSuffix: WORKDIR } }
  ];
}
function stagePatch(home, name, stage, owner) {
  const path = (0, import_node_path42.join)(home, "turns", `${name}.patch.json`);
  atomicWriteFileSync(path, `${JSON.stringify(patchFor(stage, owner))}
`, { mode: 384 });
  return path;
}
function unstagePatch(path) {
  (0, import_node_fs57.rmSync)(path, { force: true });
}
function dshEnv(home, opts = {}) {
  return { ...process.env, ...opts.secrets, DSH_HOME: home, DSH_PERMISSION_MODE: opts.readOnly ? "read-only" : "danger-full-access", DSH_TELEMETRY_DISABLED: "1" };
}

// src/lib/dsh/rpc.ts
function spawnDshAgent(bin, opts) {
  return spawnStdioRpc(bin, ["--profile", "acp", "--patch", opts.patch], {
    label: "dsh",
    cwd: opts.cwd,
    env: dshEnv(opts.home, { secrets: opts.env, readOnly: opts.readOnly }),
    autoReply: acpAutoReply(),
    callTimeoutMs: TIMEOUTS_MS.dshRpc,
    exitTimeoutMs: TIMEOUTS_MS.dshExit
  });
}
var handshake11 = (rpc) => acpInitialize(rpc);
function dshModelId(value) {
  if (typeof value !== "string") return "";
  try {
    const pair = JSON.parse(value);
    if (Array.isArray(pair) && pair.length === 2 && pair.every((p) => typeof p === "string")) return `${pair[0]}/${pair[1]}`;
  } catch {
  }
  return value;
}
function dshModelValue(id) {
  const slash = id.indexOf("/");
  return slash > 0 ? JSON.stringify([id.slice(0, slash), id.slice(slash + 1)]) : id;
}
function modelOptions(option) {
  return (option?.options ?? []).flatMap((row) => "options" in row && Array.isArray(row.options) ? row.options : [row]);
}
async function openSession9(rpc, cwd, known, mcpServers) {
  if (known) {
    try {
      const loaded = await rpc.call("session/resume", { sessionId: known, cwd, mcpServers }, TIMEOUTS_MS.dshResume);
      return { sessionId: known, fresh: false, configOptions: loaded?.configOptions ?? [] };
    } catch (err) {
      console.warn(`[dsh] session/resume ${known} failed (${err.message}) \u2014 starting a new session`);
    }
  }
  const created = await rpc.call("session/new", { cwd, mcpServers });
  return { sessionId: created.sessionId, fresh: true, configOptions: created.configOptions ?? [] };
}

// src/lib/dsh/session.ts
var import_node_fs58 = require("node:fs");
var import_node_path43 = require("node:path");
var sessionsDir5 = (home) => (0, import_node_path43.join)(home, "sessions");
var LOG = "session.v4.jsonl.zstd";
var LOCK = "session.lock";
function projectKey3(cwd) {
  let key = "";
  for (const ch of cwd.replace(/[/\\:]+/g, "-")) {
    key += ch !== "~" && /^[A-Za-z0-9._-]$/.test(ch) ? ch : `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  }
  key = key.replace(/^-+/, "") || "root";
  return `--${key.slice(0, 251)}--`;
}
var sessionDir6 = (home, cwd, id) => (0, import_node_path43.join)(sessionsDir5(home), projectKey3(cwd), id);
function findSession2(home, id) {
  let projects;
  try {
    projects = (0, import_node_fs58.readdirSync)(sessionsDir5(home));
  } catch {
    return null;
  }
  for (const project of projects) {
    const dir = (0, import_node_path43.join)(sessionsDir5(home), project, id);
    if ((0, import_node_fs58.existsSync)((0, import_node_path43.join)(dir, LOG))) return dir;
  }
  return null;
}
function placeSession3(home, id, cwd) {
  const found2 = findSession2(home, id);
  if (!found2) return false;
  const target = sessionDir6(home, cwd, id);
  if (found2 === target) return true;
  (0, import_node_fs58.mkdirSync)((0, import_node_path43.join)(target, ".."), { recursive: true });
  (0, import_node_fs58.rmSync)(target, { recursive: true, force: true });
  (0, import_node_fs58.renameSync)(found2, target);
  return true;
}
var HEAD12 = "tds_dsh_session";
var FILE7 = "tds_dsh_file";
var SESSION_ID10 = /^[0-9a-f-]{36}$/i;
var RESTORED3 = "tds-restored";
function packSession12(home, map) {
  const dir = findSession2(home, map.id);
  if (!dir) return null;
  const lines = [JSON.stringify({ [HEAD12]: map.id, leaf: map.leaf })];
  for (const name of (0, import_node_fs58.readdirSync)(dir).filter((n) => n !== LOCK).sort()) {
    lines.push(JSON.stringify({ [FILE7]: name, base64: (0, import_node_fs58.readFileSync)((0, import_node_path43.join)(dir, name)).toString("base64") }));
  }
  return lines.join("\n") + "\n";
}
function unpackSession12(home, body) {
  const lines = body.split("\n").filter(Boolean);
  if (!lines[0]?.startsWith(`{"${HEAD12}"`)) return null;
  const head = JSON.parse(lines[0]);
  const id = head[HEAD12] ?? "";
  if (!SESSION_ID10.test(id)) return null;
  const files = [];
  for (const line of lines.slice(1)) {
    const record = JSON.parse(line);
    const name = record[FILE7];
    if (!name || name.includes("/") || name.includes("\\") || name === ".." || typeof record.base64 !== "string") return null;
    files.push([name, Buffer.from(record.base64, "base64")]);
  }
  if (!files.some(([name]) => name === LOG)) return null;
  const found2 = findSession2(home, id);
  if (found2) (0, import_node_fs58.rmSync)(found2, { recursive: true, force: true });
  const dir = (0, import_node_path43.join)(sessionsDir5(home), RESTORED3, id);
  (0, import_node_fs58.rmSync)(dir, { recursive: true, force: true });
  (0, import_node_fs58.mkdirSync)(dir, { recursive: true });
  for (const [name, data] of files) (0, import_node_fs58.writeFileSync)((0, import_node_path43.join)(dir, name), data);
  return { id, ...head.leaf ? { leaf: head.leaf } : {} };
}
function dropSession2(home, id) {
  const dir = findSession2(home, id);
  if (dir) (0, import_node_fs58.rmSync)(dir, { recursive: true, force: true });
}
function codec13(home) {
  return {
    pack: (map) => packSession12(home, map),
    unpack: (body) => unpackSession12(home, body),
    drop: (map) => dropSession2(home, map.id)
  };
}
var dshSession = sessionMirror("dsh", codec13);

// src/lib/dsh/stream.ts
var MCP_TOOL3 = /^mcp__(.+?)__(.+)$/;
function toolStart13(u) {
  const name = String(u.title ?? "tool");
  const input = u.rawInput;
  const mcp = MCP_TOOL3.exec(name);
  if (mcp) return [`${mcp[1]}/${mcp[2]}`, ""];
  const path = () => detail(input, "file_path", "path") || String(u.locations?.[0]?.path ?? "");
  switch (name) {
    case "bash":
      return ["Bash", detail(input, "command").slice(0, 100)];
    case "read":
    case "read_image":
      return ["Read", path()];
    case "write":
      return ["Write", path()];
    case "edit":
      return ["Edit", path()];
    case "glob":
      return ["Glob", detail(input, "pattern")];
    case "grep": {
      const dir = detail(input, "path");
      return ["Grep", `"${detail(input, "pattern")}"${dir ? ` in ${dir}` : ""}`];
    }
    case "web_search":
      return ["WebSearch", detail(input, "query")];
    case "web_fetch":
      return ["WebFetch", detail(input, "url")];
    case "subagent":
    case "subagent_fork":
      return ["Task", detail(input, "description", "prompt").slice(0, 100)];
    case "todo_write":
      return ["TodoWrite", ""];
    case "skill":
      return ["Skill", detail(input, "name", "skill")];
    default:
      return [name, detail(input, "path", "command", "pattern", "query", "url", "description", "name").slice(0, 100)];
  }
}
function createDshStream(pump) {
  const message = messageBuffer(pump);
  let context;
  return {
    // The prompt's response is the turn's end.
    turnEnded: message.close,
    handle(n) {
      if (n.method !== "session/update") return;
      const u = n.params.update ?? {};
      const nested = !!u._meta?.parentToolCallId;
      switch (u.sessionUpdate) {
        case "agent_message_chunk": {
          const t = String(u.content?.text ?? "");
          if (t && !nested) message.chunk(t);
          break;
        }
        case "agent_thought_chunk":
          if (nested) break;
          message.close();
          pump.thinking(String(u.content?.text ?? ""));
          break;
        case "tool_call":
          message.close();
          pump.toolStart(...toolStart13(u));
          break;
        case "usage_update":
          if (typeof u.used === "number" && u.size > 0) context = { tokens: u.used, contextWindow: u.size };
          break;
      }
    },
    report: () => context ? { contextUsage: context } : {}
  };
}

// src/lib/dsh/execute.ts
var STOPPED5 = {
  max_tokens: "dsh stopped the turn: the session has outgrown its token limit"
};
function dshDriver(step, serverUrl, token) {
  const { stepId, sessionId } = step;
  let home = "";
  return {
    missing: () => resolveDshExecutable() ? null : DSH_MISSING,
    async run(ctx) {
      if (!signIn2({ ...process.env, ...step.secretEnv })) throw new Error(DSH_NOT_SIGNED_IN);
      home = dshHome();
      const cwd = step.workspace ? ctx.cwd : workdir(home);
      const known = ctx.ephemeral ? null : await dshSession.sync(home, sessionId, step.sessionRestoreUrl, stepId);
      const kept = !!known && (!step.resumeSessionAt || known.leaf === step.resumeSessionAt);
      if (known && !kept) console.warn(`[dsh] rewind leaf ${step.resumeSessionAt} is not session ${known.id}'s latest turn \u2014 starting over`);
      const resumable2 = known && kept && placeSession3(home, known.id, cwd) ? known.id : null;
      const mcp = turnMcpServers(step, serverUrl, token, cwd);
      const patch = stagePatch(home, stepId, { instructions: turnInstructions(step, ctx.ephemeral) });
      const rpc = spawnDshAgent(resolveDshExecutable(), { home, cwd, patch, env: step.secretEnv, readOnly: ctx.ephemeral || !!step.readOnly });
      const stream = createDshStream(ctx.pump);
      rpc.onNotification(stream.handle);
      const idle = idleWatch(rpc, "dsh");
      let session3 = "";
      let error;
      try {
        await handshake11(rpc);
        const opened = await openSession9(rpc, cwd, resumable2, acpMcpServers(mcp.servers));
        session3 = opened.sessionId;
        const leaf = (0, import_node_crypto9.randomUUID)();
        if (!ctx.ephemeral) {
          if (known && known.id !== session3) dropSession2(home, known.id);
          dshSession.maps(home).write(sessionId, { id: session3, leaf, etag: known?.etag });
        }
        await selectAcpModel(rpc, "dsh", opened, dshModelValue(step.agent.modelId), step.agent.thinkingLevel);
        let active = false;
        ctx.onStop(() => {
          if (active) rpc.notify("session/cancel", { sessionId: session3 });
        });
        await runSteeredTurns(ctx, step, {
          // The CLI's ACP takes no image blocks; an image goes in as a file beside the prompt.
          prepare: (text3, images) => withImageFiles(text3, images, attachmentsDir4(home), stepId),
          // A prompt sent under a running one queues behind it, so a steer waits for a follow-up turn.
          inject: async () => false,
          // The prompt response is the turn's end.
          async turn(text3) {
            active = true;
            idle.arm();
            try {
              const { stopReason } = await rpc.call("session/prompt", { sessionId: session3, prompt: [{ type: "text", text: text3 }] }, 0);
              error = STOPPED5[stopReason ?? ""];
            } catch (err) {
              if (!isRpcError(err)) throw err;
              error = err.rpc.message;
            } finally {
              idle.disarm();
              active = false;
              stream.turnEnded();
            }
            if (ctx.interrupted()) error = void 0;
            return !error;
          }
        });
        return { error, leafId: leaf, ...stream.report() };
      } catch (err) {
        throw idle.error(err);
      } finally {
        idle.disarm();
        await rpc.close();
        mcp.cleanup();
        unstagePatch(patch);
        if (ctx.ephemeral && session3) dropSession2(home, session3);
      }
    },
    backup: (ctx) => dshSession.backup(home, sessionId, step.sessionBackupUrl, ctx.refreshSessionBackupUrl, stepId)
  };
}
var executeDshStep = externalStep(dshDriver);
var rewindDshSession = (step) => dshSession.rewind(dshHome(), step, atLatestLeaf);

// src/lib/dsh/usage.ts
var import_node_fs59 = require("node:fs");
var RPC_TIMEOUT_MS11 = 3e4;
function modelsFromDshOptions(configOptions) {
  const model = configOptions.find((o) => o.id === "model");
  const effortLevels = (acpEffortOption(configOptions)?.options ?? []).map((o) => o.value);
  const current = dshModelId(model?.currentValue);
  const rows = modelOptions(model).flatMap((m) => {
    const id = dshModelId(m.value);
    return id ? [{ id, label: m.name || id, effortLevels }] : [];
  });
  return [...rows.filter((m) => m.id === current), ...rows.filter((m) => m.id !== current)].slice(0, RUNTIME_MODELS_MAX);
}
async function probeDshUsage(signal) {
  const bin = resolveDshExecutable();
  if (!bin) throw new Error(DSH_MISSING);
  const login = signIn2();
  if (!login) return SIGNED_OUT;
  const home = dshHome();
  const cwd = workdir(home);
  const patch = stagePatch(home, "probe", {});
  const rpc = spawnDshAgent(bin, { home, cwd, patch });
  let session3 = "";
  try {
    return await withSpawned(signal, () => rpc.close(), async () => {
      let opened;
      try {
        await handshake11(rpc);
        opened = await rpc.call("session/new", { cwd, mcpServers: [] }, RPC_TIMEOUT_MS11);
      } catch (err) {
        throw outdatedIfRejected(err, DSH_OUTDATED);
      }
      session3 = opened.sessionId;
      const models = modelsFromDshOptions(opened.configOptions ?? []);
      return login.kind === "api_key" ? { ...noLimits(null), models } : { status: "ok", account: null, windows: [], models };
    });
  } finally {
    unstagePatch(patch);
    if (session3) (0, import_node_fs59.rmSync)(sessionDir6(home, cwd, session3), { recursive: true, force: true });
  }
}

// src/lib/externalRuntimes.ts
var EXTERNAL_RUNTIMES = {
  "claude-code": { installed: () => !!resolveClaudeCodeExecutable(), turn: executeClaudeCodeStep, restore: rewindClaudeCodeSession, usage: probeClaudeCodeUsage },
  codex: { installed: () => !!resolveCodexExecutable(), turn: executeCodexStep, restore: rewindCodexSession, usage: probeCodexUsage },
  "grok-build": { installed: () => !!resolveGrokExecutable(), turn: executeGrokBuildStep, restore: rewindGrokBuildSession, usage: probeGrokBuildUsage },
  cursor: { installed: () => !!resolveCursorExecutable(), turn: executeCursorStep, restore: rewindCursorSession, usage: probeCursorUsage },
  antigravity: { installed: () => !!resolveAntigravityExecutable(), turn: executeAntigravityStep, restore: rewindAntigravitySession, usage: probeAntigravityUsage },
  devin: { installed: () => !!resolveDevinExecutable(), turn: executeDevinStep, restore: rewindDevinSession, usage: probeDevinUsage },
  copilot: { installed: () => !!resolveCopilotExecutable(), turn: executeCopilotStep, restore: rewindCopilotSession, usage: probeCopilotUsage },
  "gemini-cli": { installed: () => !!resolveGeminiExecutable(), turn: executeGeminiStep, restore: rewindGeminiSession, usage: probeGeminiUsage },
  omp: { installed: () => !!resolveOmpExecutable(), turn: executeOmpStep, restore: rewindOmpSession, usage: probeOmpUsage },
  opencode: { installed: () => !!resolveOpencodeExecutable(), turn: executeOpencodeStep, restore: rewindOpencodeSession, usage: probeOpencodeUsage },
  "qwen-code": { installed: () => !!resolveQwenExecutable(), turn: executeQwenStep, restore: rewindQwenSession, usage: probeQwenUsage },
  droid: { installed: () => !!resolveDroidExecutable(), turn: executeDroidStep, restore: rewindDroidSession, usage: probeDroidUsage },
  cline: { installed: () => !!resolveClineExecutable(), turn: executeClineStep, restore: rewindClineSession, usage: probeClineUsage },
  dsh: { installed: () => !!resolveDshExecutable(), turn: executeDshStep, restore: rewindDshSession, usage: probeDshUsage }
};
function installedRuntimes() {
  return EXTERNAL_AGENT_RUNTIMES.filter((r) => EXTERNAL_RUNTIMES[r].installed());
}

// src/machine.ts
async function prepareStepWorkspace(step, onGitRetry) {
  const workspace = step.workspace;
  if (!workspace) return null;
  return prepareConversationWorkspace(
    step.conversationId,
    workspace,
    // Pure restore step: land the worktree on the checkpoint before the PR reads it.
    step.mode === "restore" && step.restore ? { restoreTo: step.restore.commitSha ?? `origin/${workspace.defaultBranch}`, onRetry: onGitRetry } : { onRetry: onGitRetry }
  );
}
async function restoreSessionToCheckpoint(step) {
  if (!step.restore || !step.sessionId) return null;
  return truncateSessionToLeaf(step.sessionId, step.sessionRestoreUrl, step.restore.sessionLeafEntryId, step.stepId);
}
var MODEL_RETRY_MAX = 8;
function raiseModelRetryBudget(settings4) {
  const configured = settings4.getProjectSettings().retry?.maxRetries ?? settings4.getGlobalSettings().retry?.maxRetries;
  if (configured === void 0) settings4.applyOverrides({ retry: { maxRetries: MODEL_RETRY_MAX } });
}
function applyDeliveredTransport(settings4, delivered) {
  if (delivered === void 0) return;
  const configured = settings4.getProjectSettings().transport ?? settings4.getGlobalSettings().transport;
  if (configured === void 0) settings4.applyOverrides({ transport: delivered });
}
function applyDeliveredCompaction(settings4, delivered) {
  if (delivered === void 0) return;
  const configured = settings4.getProjectSettings().compaction ?? settings4.getGlobalSettings().compaction;
  if (configured === void 0) settings4.applyOverrides({ compaction: delivered });
}
async function createSession2({ sdk, agentDir: agentDir2 }, opts) {
  const skillOpts = opts.skills?.length ? { noSkills: true, skillsOverride: () => ({ skills: opts.skills, diagnostics: [] }) } : {};
  const notes = opts.appendSystemPrompt;
  const appendOpts = notes ? { appendSystemPromptOverride: (base) => [...base, notes] } : {};
  const settingsManager = sdk.SettingsManager.create(opts.cwd, agentDir2);
  raiseModelRetryBudget(settingsManager);
  applyDeliveredTransport(settingsManager, opts.modelRuntime.transport);
  applyDeliveredCompaction(settingsManager, opts.modelRuntime.compaction);
  const loaderOpts = {
    cwd: opts.cwd,
    agentDir: agentDir2,
    noExtensions: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    // Inline factories load regardless of noExtensions (that flag only skips the disk scan).
    extensionFactories: [compactionTrimExtension(sdk, settingsManager, {
      compactionModel: opts.modelRuntime.compactionModel,
      trim: opts.modelRuntime.compactionTrim
    })],
    ...skillOpts,
    ...opts.systemPrompt ? { systemPrompt: opts.systemPrompt } : {},
    ...appendOpts
  };
  const loader = new sdk.DefaultResourceLoader(
    opts.webSearch !== false ? withWebSearch(loaderOpts) : loaderOpts
  );
  await loader.reload();
  const { session: session3 } = await sdk.createAgentSession({
    cwd: opts.cwd,
    agentDir: agentDir2,
    model: opts.modelRuntime.model,
    modelRuntime: opts.modelRuntime.modelRuntime,
    resourceLoader: loader,
    tools: opts.tools,
    customTools: [webFetchTool, ...opts.extraCustomTools ?? []],
    sessionManager: opts.sessionManager,
    settingsManager,
    thinkingLevel: opts.thinkingLevel || void 0
  });
  const streamFn = session3.agent.streamFunction;
  session3.agent.streamFunction = (model, context, options) => streamFn(model, context, {
    ...options,
    headers: { ...openCodeHeaders(model, session3.sessionId), ...options?.headers }
  });
  return session3;
}
async function executeStep(step, serverUrl, token, tunnel) {
  const { stepId, conversationId } = step;
  const steerBacklog = [];
  let steerSink = (entries) => {
    steerBacklog.push(...entries);
  };
  const onSteer = (entries) => steerSink(entries);
  const { postFrame, pollBody, setSteerOpen } = createFrameLane(serverUrl, token, stepId, onSteer);
  const pendingTurnWork = deferredTurnWork.get(conversationId);
  if (pendingTurnWork) {
    void postFrame({ type: "stage", stage: "wrapup", state: "start" });
    await drainTurnWork(conversationId, pendingTurnWork, stepId);
    void postFrame({ type: "stage", stage: "wrapup", state: "done" });
  }
  if (step.mode === "restore") return executeRestore(step, serverUrl, token);
  if (step.mode === "compact") {
    if (step.runtime) {
      await makeDone(step, serverUrl, token)({ error: "Compaction is not available for external-runtime agents." });
      return;
    }
    return executeCompact(step, serverUrl, token);
  }
  if (await resendSpooledDone(serverUrl, token, stepId)) {
    console.log(`[step] ${stepId} outcome already spooled \u2014 resent recorded /done, skipping re-run`);
    return;
  }
  if (step.runtime) {
    const hooks = EXTERNAL_RUNTIMES[step.runtime];
    if (hooks) return hooks.turn(step, serverUrl, token);
    await makeDone(step, serverUrl, token)({ error: `Unsupported runtime: ${step.runtime}` });
    return;
  }
  console.log(`[step] ${stepId} start (conv ${conversationId})`);
  void postFrame({ type: "stage", stage: "prepare", state: "start" });
  const refreshUploadUrls = makeUploadUrlRefresh(serverUrl, token, stepId);
  let interrupted = false;
  let abortRef = null;
  const stopTurn = () => {
    interrupted = true;
    abortRef?.abort();
  };
  const remoteMachinesRef = { current: step.remoteMachines ?? [] };
  const heartbeat = startHeartbeat(serverUrl, stepId, stopTurn, token, {
    onRemoteMachines: (r) => {
      remoteMachinesRef.current = r;
    },
    onSteer,
    body: pollBody
  });
  let mcpConns = [];
  const done = makeDone(step, serverUrl, token);
  try {
    const runtime = await getPiRuntime();
    const { sdk, agentDir: agentDir2 } = runtime;
    ensureSkillGc(agentDir2);
    const resolved2 = await buildStepModelRuntime(sdk, step);
    if (!resolved2.ok) {
      await done({ error: resolved2.error });
      return;
    }
    const modelRuntime = resolved2.runtime;
    console.log(`[step] ${stepId} using model ${modelRuntime.model.provider}/${modelRuntime.model.id}`);
    const onGitRetry = (attempt, maxAttempts) => void postFrame({ type: "retry", attempt, maxAttempts });
    let cwd;
    try {
      cwd = await prepareStepWorkspace(step, onGitRetry) ?? agentDir2;
    } catch (err) {
      await done({ error: `Workspace preparation failed: ${err.message}` });
      return;
    }
    const ephemeral = step.mode === "ephemeral_turn";
    const m = ephemeral ? { sessionManager: sdk.SessionManager.inMemory(cwd), isContinue: false, sessionKeyForSave: null } : await materializeSession({
      sdk,
      sessionKey: step.sessionId,
      cwd,
      restoreUrl: step.sessionRestoreUrl
    });
    console.log(m.isContinue ? `[step] ${stepId} continue session ${step.sessionId}` : `[step] ${stepId} new session ${step.sessionId}`);
    const skills = await materializeSkills(step.skills, agentDir2);
    const secretEnv = step.secretEnv;
    const bashOptions = {};
    const shellPath = agentShellPath();
    if (secretEnv) {
      bashOptions.spawnHook = ({ command: command2, cwd: spawnCwd, env }) => ({ command: command2, cwd: spawnCwd, env: { ...env, ...secretEnv } });
    }
    const localBashOps = sdk.createLocalBashOperations(shellPath ? { shellPath } : void 0);
    const interruptibleBash = createInterruptibleBash(localBashOps, TIMEOUTS_MS.bashDefault / 1e3);
    bashOptions.operations = { exec: interruptibleBash.exec };
    mcpConns = step.mcpServers?.length ? await connectMcpServers(step.mcpServers, step.mcpServerCredentials ?? []) : [];
    const mcpToolDefs = mcpConns.length ? await mcpToolDefinitions(mcpConns, [...step.tools, ...(step.remoteTools ?? []).map((t) => t.name)]) : [];
    const bashTool = sdk.createBashToolDefinition(cwd, bashOptions);
    bashTool.description += ` Commands run with a default timeout of ${TIMEOUTS_MS.bashDefault / 6e4} minutes; pass an explicit timeout for longer commands, and run indefinite processes (servers, watchers) in the background instead of the foreground.`;
    const pushCredential = step.workspace ? makePushCredential(serverUrl, token, stepId, step.workspace) : void 0;
    const extraCustomTools = [
      makeRemoteShellTool(tunnel, conversationId, remoteMachinesRef),
      makePushBranchTool(cwd, step, pushCredential),
      makeRepoGitTool(serverUrl, token, step),
      ...makeRemoteTools(serverUrl, token, step),
      ...mcpToolDefs,
      bashTool,
      withEditArguments(sdk.createEditToolDefinition(cwd))
    ];
    const session3 = await createSession2(runtime, {
      modelRuntime,
      cwd,
      tools: [...step.tools, ...(step.remoteTools ?? []).map((t) => t.name), ...mcpToolDefs.map((t) => t.name)],
      sessionManager: m.sessionManager,
      thinkingLevel: step.agent.thinkingLevel ?? "",
      webSearch: true,
      skills,
      extraCustomTools,
      systemPrompt: step.systemPrompt,
      appendSystemPrompt: step.appendSystemPrompt
    });
    if (m.sessionKeyForSave && session3.sessionFile) {
      saveSessionPath(m.sessionKeyForSave, session3.sessionFile);
    }
    const baseStreamFn = session3.agent.streamFunction;
    session3.agent.streamFunction = async (model, context, options) => {
      const request2 = new AbortController();
      const signal = options?.signal ? AbortSignal.any([options.signal, request2.signal]) : request2.signal;
      const transport = observeStatus(providerFetch(model.api, options?.fetch));
      const source = await baseStreamFn(model, context, { ...options, signal, fetch: transport.fetch });
      const abort = () => request2.abort();
      const guarded = wrapProviderRefusal(wrapEmptyFrameAsError(source, `step:${stepId}`), `step:${stepId}`, transport.status);
      return wrapStreamWatchdog(guarded, `step:${stepId}`, model, { onTimeout: abort });
    };
    const stream = attachStreamingSession(
      session3,
      `step:${stepId}`,
      postFrame,
      stopTurn,
      // Marks the model stage done the moment the first model event flows.
      { type: "stage", stage: "model", state: "done" }
    );
    abortRef = stream.abort;
    if (interrupted) stream.abort.abort();
    if (step.gatherMs) {
      pokeActiveHeartbeats(stepId);
      const until = Date.now() + step.gatherMs;
      while (!interrupted && Date.now() < until) await (0, import_promises9.setTimeout)(250);
    }
    const gathered = steerBacklog.splice(0);
    let steerChain = Promise.resolve();
    steerSink = (entries) => {
      for (const e of entries) {
        steerChain = steerChain.then(async () => {
          const imgs = await downloadImages(e.images, stepId);
          await session3.steer(e.text, imgs.length ? imgs : void 0);
          if (e.interrupt) interruptibleBash.interrupt("\n[command interrupted: a user instruction arrived and takes effect now]\n");
        }).catch((err) => console.error(`[step] ${stepId} steer inject failed:`, err.message));
      }
    };
    let checkpoint = {};
    let sessionLeafEntryId;
    const captureCheckpoint = async () => {
      await discardReadOnlyTurn(step, cwd);
      if (ephemeral) return;
      sessionLeafEntryId = m.sessionManager.getLeafId() ?? void 0;
      if (!step.workspace) return;
      checkpoint = await captureTurnCheckpoint(cwd, step, step.workspace, pushCredential, stream.getFullText(), makeChangesUpload(serverUrl, token, stepId));
    };
    const turnReport = () => ({
      ...checkpointReport(checkpoint),
      sessionLeafEntryId,
      contextUsage: session3.getContextUsage(),
      modelCalls: stream.getModelCalls(),
      compactions: stream.getCompactions()
    });
    const donePayload = () => ({
      text: stream.getFullText(),
      ...turnReport(),
      // The final frame's stopReason and error text, verbatim — which shapes get recorded is the
      // server's call.
      stopReason: stream.getLastStopReason(),
      stopError: stream.getLastModelError()
    });
    const prompt = [step.prompt, ...gathered.map((e) => e.text)].join("\n\n");
    const images = (await Promise.all([step.images, ...gathered.map((e) => e.images)].map((i) => downloadImages(i, stepId)))).flat();
    void postFrame({ type: "stage", stage: "prepare", state: "done" });
    void postFrame({ type: "stage", stage: "model", state: "start" });
    const runPrompt = async (text3, imgs) => {
      setSteerOpen(true);
      try {
        await session3.prompt(text3, imgs.length ? { images: imgs } : void 0);
      } finally {
        setSteerOpen(false);
      }
      await stream.idle();
      await heartbeat.settle();
      await steerChain;
    };
    try {
      await runPrompt(prompt, images);
      const modelError = !stream.getFullText() && stream.getLastModelError();
      if (modelError) {
        await captureCheckpoint().catch((e) => console.error(`[step] ${stepId} failed-turn checkpoint:`, e.message));
        await done({ error: modelError, ...turnReport() });
      } else {
        while (session3.getSteeringMessages().length || steerBacklog.length) {
          const queued = session3.clearQueue().steering;
          const backlog = steerBacklog.splice(0);
          const followUpImages = (await Promise.all(backlog.map((e) => downloadImages(e.images, stepId)))).flat();
          await runPrompt([...queued, ...backlog.map((e) => e.text)].join("\n\n"), followUpImages);
        }
        await captureCheckpoint();
        await done(donePayload());
      }
    } catch (err) {
      await stream.idle().catch(() => {
      });
      if (interrupted) {
        console.log(`[step] ${stepId} interrupted \u2014 saving partial content`);
        await captureCheckpoint();
        await done(donePayload());
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[step] ${stepId} failed:`, msg);
        await captureCheckpoint().catch((e) => console.error(`[step] ${stepId} failed-turn checkpoint:`, e.message));
        await done({ error: msg, ...turnReport() });
      }
    } finally {
      if (!ephemeral) deferTurnWork(conversationId, () => backupSession(step.sessionId, session3.sessionFile, step.sessionBackupUrl, () => refreshUploadUrls().then((r) => r?.sessionBackupUrl)));
      if (step.workspace) {
        const reap = deferTurnWork(conversationId, async () => {
          if (deferredTurnWork.get(conversationId) !== reap) return;
          await reapWorkspaceStrays(cwd, stepId);
        });
      }
      stream.dispose();
    }
  } finally {
    heartbeat.stop();
    await closeMcpConnections(mcpConns);
  }
}
async function executeRestore(step, serverUrl, token) {
  const { stepId, conversationId } = step;
  console.log(`[restore] ${stepId} start (conv ${conversationId})`);
  const done = makeDone(step, serverUrl, token);
  let diffHash;
  let pushOutcome;
  const rewindCode = async () => {
    const cwd = await prepareStepWorkspace(step);
    if (!cwd || !step.workspace) return;
    const { defaultBranch } = step.workspace;
    const { origin, originToken } = remotesOf(step.workspace);
    await pushBranch(cwd, originToken, convBranch(conversationId), origin, { rewind: true });
    pushOutcome = { ok: true };
    diffHash = await computeDiffHash(cwd, defaultBranch, stepId);
  };
  const rewindSession5 = async () => {
    if (!step.sessionId) return;
    if (step.runtime) {
      await EXTERNAL_RUNTIMES[step.runtime]?.restore(step);
      return;
    }
    const path = await restoreSessionToCheckpoint(step);
    if (path) await backupSession(step.sessionId, path, step.sessionBackupUrl);
  };
  const [code, session3] = await Promise.allSettled([rewindCode(), rewindSession5()]);
  const failed = [code, session3].find((r) => r.status === "rejected");
  if (failed) {
    const msg = failed.reason instanceof Error ? failed.reason.message : String(failed.reason);
    console.error(`[restore] ${stepId} failed:`, msg);
    await done({ error: msg });
    return;
  }
  await done(checkpointReport({ diffHash, pushOutcome }));
  console.log(`[restore] ${stepId} done`);
}
async function executeCompact(step, serverUrl, token) {
  const { stepId, conversationId } = step;
  console.log(`[compact] ${stepId} start (conv ${conversationId})`);
  const done = makeDone(step, serverUrl, token);
  const refreshUploadUrls = makeUploadUrlRefresh(serverUrl, token, stepId);
  let getModelCalls = async () => void 0;
  try {
    const runtime = await getPiRuntime();
    const { sdk, agentDir: agentDir2 } = runtime;
    const resolved2 = await buildStepModelRuntime(sdk, step);
    if (!resolved2.ok) {
      await done({ error: resolved2.error });
      return;
    }
    const m = await materializeSession({ sdk, sessionKey: step.sessionId, cwd: agentDir2, restoreUrl: step.sessionRestoreUrl });
    if (!m.isContinue) {
      await done({ contextUsage: void 0 });
      return;
    }
    const session3 = await createSession2(runtime, {
      modelRuntime: resolved2.runtime,
      cwd: agentDir2,
      tools: [],
      sessionManager: m.sessionManager,
      thinkingLevel: step.agent.thinkingLevel ?? "",
      webSearch: false
    });
    const calls = [];
    const streamFn = session3.agent.streamFunction;
    session3.agent.streamFunction = (model, context, options) => {
      const thinkingLevel = session3.thinkingLevel;
      const stream = Promise.resolve(streamFn(model, context, options));
      calls.push(stream.then(async (s) => modelCallFromMessage(await s.result(), thinkingLevel)).catch(() => null));
      return stream;
    };
    getModelCalls = async () => {
      const resolved3 = (await Promise.all(calls)).filter((call) => call !== null);
      return resolved3.length ? resolved3 : void 0;
    };
    let cancelled = false;
    const heartbeat = startHeartbeat(serverUrl, stepId, () => {
      cancelled = true;
      session3.abortCompaction();
    }, token, { intervalMs: 2e3 });
    try {
      let result;
      try {
        result = await session3.compact();
      } catch (err) {
        if (!cancelled) throw err;
        console.log(`[compact] ${stepId} cancelled (aborted)`);
        await done({ error: "Cancelled", modelCalls: await getModelCalls() });
        return;
      }
      const res = await done({ contextUsage: session3.getContextUsage(), tokensBefore: result?.tokensBefore, modelCalls: await getModelCalls() });
      if (res?.owned) {
        await backupSession(step.sessionId, session3.sessionFile, step.sessionBackupUrl, () => refreshUploadUrls().then((r) => r?.sessionBackupUrl));
        console.log(`[compact] ${stepId} done (before ~${result?.tokensBefore} tokens)`);
      } else {
        console.log(`[compact] ${stepId} superseded after compaction \u2014 discarding`);
      }
    } finally {
      heartbeat.stop();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[compact] ${stepId} failed:`, msg);
    await done({ error: msg, modelCalls: await getModelCalls() });
  }
}

// src/lib/branchCheckout.ts
var import_node_crypto10 = require("node:crypto");
var import_promises10 = require("node:fs/promises");
var import_node_os16 = require("node:os");
var import_node_path44 = require("node:path");
var BranchCheckoutError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
var fail = (code) => {
  throw new BranchCheckoutError(code);
};
var missing = (err) => err.code === "ENOENT";
var stat2 = async (path) => (0, import_promises10.lstat)(path).catch((err) => {
  if (missing(err)) return null;
  throw err;
});
var paths = (output) => output.split("\0").filter(Boolean);
var fold = (p) => process.platform === "win32" || process.platform === "darwin" ? p.toLowerCase() : p;
function pathsOverlap(a, b) {
  a = fold(a.replace(/[\\/]+$/, ""));
  b = fold(b.replace(/[\\/]+$/, ""));
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}
var nativeOverlap = (a, b) => pathsOverlap(a.split(import_node_path44.sep).join("/"), b.split(import_node_path44.sep).join("/"));
async function withBranchSyncLock(fn, root = tdsPath("branch-sync")) {
  await (0, import_promises10.mkdir)(root, { recursive: true });
  const lock = (0, import_node_path44.join)(root, "lock");
  const candidate = await (0, import_promises10.mkdtemp)((0, import_node_path44.join)(root, "lock-candidate-"));
  const owner = `${process.pid}-${(0, import_node_crypto10.randomUUID)()}`;
  const removeEmptyLock = async () => {
    try {
      await (0, import_promises10.rmdir)(lock);
    } catch (err) {
      if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(err.code ?? "")) throw err;
    }
  };
  let acquired = false;
  try {
    await (0, import_promises10.writeFile)((0, import_node_path44.join)(candidate, owner), "", { flag: "wx", mode: 384 });
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await (0, import_promises10.rename)(candidate, lock);
        acquired = true;
        break;
      } catch (err) {
        if (!["EEXIST", "ENOTEMPTY", "EPERM", "ENOENT"].includes(err.code ?? "")) throw err;
      }
      const owners = await (0, import_promises10.readdir)(lock).catch((err) => {
        if (missing(err)) return [];
        throw err;
      });
      if (owners.length === 0) {
        await removeEmptyLock();
        continue;
      }
      if (owners.length !== 1 || !/^\d+-[a-f0-9-]+$/.test(owners[0])) return fail("machine_busy");
      const previous = owners[0];
      try {
        process.kill(Number(previous.split("-")[0]), 0);
        return fail("machine_busy");
      } catch (err) {
        if (err.code !== "ESRCH") return fail("machine_busy");
      }
      try {
        await (0, import_promises10.unlink)((0, import_node_path44.join)(lock, previous));
      } catch (err) {
        if (missing(err)) continue;
        throw err;
      }
      await removeEmptyLock();
    }
    if (!acquired) return fail("machine_busy");
    return await fn();
  } finally {
    if (acquired) {
      await (0, import_promises10.unlink)((0, import_node_path44.join)(lock, owner));
      await removeEmptyLock();
    }
    await (0, import_promises10.rm)(candidate, { recursive: true, force: true });
  }
}
async function assertSyncDestination(input) {
  if (destDirProblem(input)) return fail("dest_invalid");
  const expanded = expandHome(input.trim());
  if (!(0, import_node_path44.isAbsolute)(expanded)) return fail("dest_invalid");
  const dest = (0, import_node_path44.resolve)(expanded);
  if (fold(dest) === fold((0, import_node_path44.resolve)((0, import_node_os16.homedir)()))) return fail("dest_invalid");
  for (const forbidden of [tdsDir(), workspacesRoot()]) {
    const absolute = (0, import_node_path44.resolve)(expandHome(forbidden));
    const canonical = await (0, import_promises10.realpath)(absolute).catch((err) => {
      if (missing(err)) return absolute;
      throw err;
    });
    if (nativeOverlap(dest, absolute) || nativeOverlap(dest, canonical)) return fail("dest_overlap");
  }
  let cursor = dest;
  while (true) {
    const info = await stat2(cursor);
    if (info && (info.isSymbolicLink() || !info.isDirectory())) return fail("dest_invalid");
    if (cursor === (0, import_node_path44.parse)(cursor).root) break;
    cursor = (0, import_node_path44.dirname)(cursor);
  }
  return dest;
}
var ownershipPath = (dest) => (0, import_node_path44.join)(dest, ".git", "tds-branch-sync.json");
function branchSyncOrigin(claim) {
  if (claim.remote) return parseExternalRepoUrl(claim.remote.url) ?? fail("source_invalid");
  if (!/^[^/\s]+\/[^/\s]+$/.test(claim.repoFullName) || /[\\?#@:]/.test(claim.repoFullName)) return fail("source_invalid");
  const host = new URL(claim.gitHost ? process.env.TDS_GIT_HOST ?? claim.gitHost : "https://github.com");
  if (!["https:", "http:"].includes(host.protocol) || host.username || host.password || host.search || host.hash) return fail("source_invalid");
  return `${host.href.replace(/\/$/, "")}/${claim.repoFullName}.git`;
}
function branchSyncAuth(claim, origin) {
  if (!claim.remote) return authConfig(claim.installationToken, platformRemote(claim.repoFullName, claim.gitHost));
  if (!claim.remote.username || !claim.remote.token) return fail("source_unavailable");
  return authConfig(claim.remote.token, { url: origin, username: claim.remote.username });
}
async function mountPoints() {
  if (process.platform !== "linux") return [];
  const mounts = await (0, import_promises10.readFile)("/proc/self/mountinfo", "utf8");
  return mounts.split("\n").flatMap((line) => {
    const path = line.split(" ")[4];
    return path ? [path.replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))] : [];
  });
}
async function assertNoNestedRepositories(dest, ignored) {
  const rootDev = (await (0, import_promises10.lstat)(dest)).dev;
  const mounts = await mountPoints();
  async function walk(dir) {
    for (const entry of await (0, import_promises10.readdir)(dir, { withFileTypes: true })) {
      if (dir === dest && entry.name === ".git") continue;
      const path = (0, import_node_path44.join)(dir, entry.name);
      const rel = (0, import_node_path44.relative)(dest, path).split(import_node_path44.sep).join("/");
      if (ignored.some((i) => i.endsWith("/") && (fold(rel) === fold(i.slice(0, -1)) || fold(rel).startsWith(fold(i))))) continue;
      if (entry.name === ".git") return fail("nested_repo");
      const info = await (0, import_promises10.lstat)(path);
      if (info.isSymbolicLink() || !info.isDirectory()) continue;
      if (info.dev !== rootDev || mounts.includes(path)) return fail("nested_repo");
      await walk(path);
    }
  }
  await walk(dest);
}
function ignoredConflicts(ignored, targetPaths) {
  const target = new Set(targetPaths.map(fold));
  const sorted = [...target].sort();
  for (const protectedPath of ignored) {
    const p = fold(protectedPath.replace(/\/$/, ""));
    if (target.has(p)) return true;
    const prefix = `${p}/`;
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
      const mid = lo + hi >>> 1;
      if (sorted[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }
    if (sorted[lo]?.startsWith(prefix)) return true;
    const segments = p.split("/");
    for (let i = 1; i < segments.length; i++) {
      if (target.has(segments.slice(0, i).join("/"))) return true;
    }
  }
  return false;
}
async function checkoutBranch(claim, options = {}) {
  const { request: request2 } = claim;
  const { signal } = options;
  if (!/^[a-f0-9]{40}$/.test(request2.sha)) return fail("source_invalid");
  const dest = await assertSyncDestination(request2.destDir);
  const origin = options.origin ?? branchSyncOrigin(claim);
  const hooks = tdsPath("branch-sync", "no-hooks");
  await (0, import_promises10.mkdir)(hooks, { recursive: true });
  if ((await (0, import_promises10.lstat)(hooks)).isSymbolicLink() || (await (0, import_promises10.readdir)(hooks)).length) return fail("unsupported_checkout");
  const config = {
    ...branchSyncAuth(claim, origin),
    "core.hooksPath": hooks,
    "core.fsmonitor": "false",
    "submodule.recurse": "false",
    "core.sparseCheckout": "false",
    "advice.detachedHead": "false"
  };
  const git = (args2, dir, rawOutput = false) => runGit(args2, dir, config, {
    signal,
    rawOutput,
    timeoutMs: args2[0] === "fetch" ? TIMEOUTS_MS.gitNetwork : TIMEOUTS_MS.gitLocalInteractive
  });
  const disableFilters = async (dir) => {
    const filters = await git(["config", "--name-only", "--null", "--get-regexp", "^filter\\..*\\.(clean|smudge|process|required)$"], dir, true).catch((err) => {
      if (err.exitCode === 1) return "";
      throw err;
    });
    for (const key of paths(filters)) config[key] = key.endsWith(".required") ? "false" : "";
  };
  const ensureTarget = async (dir) => {
    const cached5 = await git(["rev-parse", "--verify", "--quiet", `${request2.sha}^{commit}`], dir).catch((err) => {
      if (err.exitCode === 1) return "";
      throw err;
    });
    if (cached5 === request2.sha) return;
    try {
      await git(["fetch", "--no-tags", "--no-recurse-submodules", "origin", request2.sha], dir);
    } catch (err) {
      signal?.throwIfAborted();
      await git(["fetch", "--no-tags", "--no-recurse-submodules", "origin", `refs/heads/${request2.branch}`], dir);
    }
    const resolved2 = await git(["rev-parse", "--verify", `${request2.sha}^{commit}`], dir);
    if (resolved2 !== request2.sha) return fail("source_invalid");
  };
  const verifyCheckout = async (dir) => {
    const checkedOutSha = await git(["rev-parse", "HEAD"], dir);
    if (checkedOutSha !== request2.sha || await git(["diff", "--no-ext-diff", "--no-textconv", "HEAD", "--name-only"], dir)) return fail("invalid_result");
  };
  const record = {
    projectId: request2.projectId,
    teamId: request2.teamId,
    machineId: request2.machineId,
    sha: request2.sha,
    requestId: request2.requestId,
    todoId: request2.todoId,
    branch: request2.branch,
    origin
  };
  const beforeWrite = async () => {
    signal?.throwIfAborted();
    await options.beforeWrite?.();
    await assertSyncDestination(dest);
    signal?.throwIfAborted();
  };
  const entries = await (0, import_promises10.readdir)(dest).catch((err) => {
    if (missing(err)) return [];
    throw err;
  });
  if (!entries.length) {
    await (0, import_promises10.mkdir)((0, import_node_path44.dirname)(dest), { recursive: true });
    const temp = await (0, import_promises10.mkdtemp)((0, import_node_path44.join)((0, import_node_path44.dirname)(dest), ".tds-branch-sync-"));
    try {
      await git(["init", "--template="], temp);
      await git(["remote", "add", "origin", origin], temp);
      await ensureTarget(temp);
      await disableFilters(temp);
      await git(["checkout", "--detach", "--no-recurse-submodules", request2.sha], temp);
      await verifyCheckout(temp);
      atomicWriteFileSync(ownershipPath(temp), JSON.stringify(record));
      await beforeWrite();
      const existing = await stat2(dest);
      if (existing) await (0, import_promises10.rmdir)(dest);
      await (0, import_promises10.rename)(temp, dest);
    } finally {
      await (0, import_promises10.rm)(temp, { recursive: true, force: true });
    }
    return;
  }
  const gitDir = await stat2((0, import_node_path44.join)(dest, ".git"));
  if (!gitDir?.isDirectory() || gitDir.isSymbolicLink()) return fail("foreign_repo");
  if (await stat2((0, import_node_path44.join)(dest, ".git", "commondir"))) return fail("foreign_repo");
  const markerInfo = await stat2(ownershipPath(dest));
  if (!markerInfo?.isFile() || markerInfo.isSymbolicLink()) return fail("foreign_repo");
  let previous;
  try {
    previous = JSON.parse(await (0, import_promises10.readFile)(ownershipPath(dest), "utf8"));
  } catch {
    return fail("foreign_repo");
  }
  if (previous?.origin !== origin) return fail("foreign_repo");
  if ((0, import_node_path44.resolve)(await git(["rev-parse", "--show-toplevel"], dest)) !== dest || (0, import_node_path44.resolve)(await git(["rev-parse", "--absolute-git-dir"], dest)) !== (0, import_node_path44.join)(dest, ".git") || await git(["config", "--get", "remote.origin.url"], dest) !== origin) return fail("foreign_repo");
  await disableFilters(dest);
  const flags = paths(await git(["ls-files", "-v", "-z"], dest, true));
  if (flags.some((f) => f[0] === "S" || f[0] && f[0] === f[0].toLowerCase())) return fail("unsupported_checkout");
  const head = await git(["rev-parse", "HEAD"], dest);
  if (!request2.force && head !== previous.sha) return fail("head_changed");
  if (!request2.force && await git(["status", "--porcelain", "--untracked-files=all", "--ignore-submodules=none"], dest)) return fail("local_changes");
  await ensureTarget(dest);
  const currentPaths = new Set(paths(await git(["ls-tree", "-r", "--name-only", "-z", "HEAD"], dest, true)));
  const ignored = paths(await git(["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"], dest, true)).filter((p) => !currentPaths.has(p));
  const targetPaths = paths(await git(["ls-tree", "-r", "--name-only", "-z", request2.sha], dest, true));
  if (ignoredConflicts(ignored, targetPaths)) return fail("ignored_path_conflict");
  await assertNoNestedRepositories(dest, ignored);
  await beforeWrite();
  if (request2.force) await git(["clean", "-fd"], dest);
  await git(["checkout", "--detach", "--no-recurse-submodules", "--no-overwrite-ignore", ...request2.force ? ["--force"] : [], request2.sha], dest);
  await verifyCheckout(dest);
  signal?.throwIfAborted();
  atomicWriteFileSync(ownershipPath(dest), JSON.stringify(record));
}

// src/lib/branchSyncJob.ts
async function executeBranchSyncJob(job, serverUrl, token, options = {}) {
  if (branchSyncRequestId(job.stepId) !== job.requestId) throw new Error("invalid branch sync job");
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  const send = options.send ?? (async (path, body, signal2) => {
    const response = await serverRequest(serverUrl, path, { body, signal: signal2, token, timeoutMs: 15e3 });
    if (!response.ok) throw httpError(response);
    return response.json();
  });
  const doneSend = options.send ? (_url, path, body) => send(path, body) : void 0;
  const result = await withBranchSyncLock(async () => {
    if (await resendSpooledDone(serverUrl, token, job.stepId, doneSend)) return null;
    const claim = job.claim;
    if (!claim || claim.request.requestId !== job.requestId || claim.request.machineId !== job.machineId || claim.request.teamId !== job.teamId) throw new BranchCheckoutError("request_not_running");
    let renewing = null;
    const renew = () => {
      if (renewing) return renewing;
      renewing = send(`/api/machine/heartbeat/${job.stepId}`, {}, signal).then((body) => {
        if (body?.stop) throw new Error("lease unavailable");
      }).catch((err) => {
        controller.abort();
        throw err;
      }).finally(() => {
        renewing = null;
      });
      return renewing;
    };
    const timer = setInterval(() => {
      void renew().catch(() => {
      });
    }, BRANCH_SYNC_HEARTBEAT_MS);
    try {
      signal.throwIfAborted();
      await (options.checkout ?? checkoutBranch)(claim, { signal, beforeWrite: renew });
      signal.throwIfAborted();
      return { requestId: job.requestId, state: "succeeded" };
    } finally {
      clearInterval(timer);
      await renewing?.catch(() => {
      });
    }
  }, options.lockRoot).catch((err) => ({
    requestId: job.requestId,
    state: signal.aborted ? "interrupted" : "failed",
    error: signal.aborted ? "lease_expired" : err instanceof BranchCheckoutError ? err.code : "sync_failed"
  }));
  if (result) await deliverDone(serverUrl, token, job.stepId, { mode: "branch_sync", ...result }, doneSend);
}

// src/lib/machineAuth.ts
function isMachineTokenRejected(status) {
  return status === 401;
}

// src/lib/wakeChannel.ts
var import_eventsource = require("eventsource");
var RECONNECT_MIN_MS = 2e3;
var RECONNECT_MAX_MS = 3e4;
var WATCHDOG_MS = MACHINE_STREAM_PING_MS * 5;
var WakeChannel = class {
  constructor(serverUrl, token, onWake, onConfig, onHealthChange, onSteer, onUsageRefresh) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.onWake = onWake;
    this.onConfig = onConfig;
    this.onHealthChange = onHealthChange;
    this.onSteer = onSteer;
    this.onUsageRefresh = onUsageRefresh;
  }
  es = null;
  stopped = true;
  healthy = false;
  reconnectDelay = RECONNECT_MIN_MS;
  reconnectTimer = null;
  watchdog = null;
  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.connect();
  }
  stop() {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    this.es?.close();
    this.es = null;
    this.setHealthy(false);
  }
  isHealthy() {
    return this.healthy;
  }
  // Handlers of a superseded connection are neutralized by identity: dropAndRetry/stop null out
  // this.es, so their `this.es === es` checks fail from then on.
  connect() {
    const es = new import_eventsource.EventSource(`${this.serverUrl}/api/machine/stream`, {
      fetch: (input, init) => fetch(input, {
        ...init,
        headers: { ...init?.headers, ...machineHeaders(this.token) }
      })
    });
    this.es = es;
    es.onopen = () => {
      if (this.es !== es) return;
      this.reconnectDelay = RECONNECT_MIN_MS;
      this.setHealthy(true);
      this.onWake();
      this.armWatchdog(es);
    };
    es.onmessage = (ev) => {
      if (this.es !== es) return;
      this.armWatchdog(es);
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.type === "wake") this.onWake();
      else if (msg.type === "config") this.onConfig();
      else if (msg.type === "steer") this.onSteer(typeof msg.stepId === "string" ? msg.stepId : void 0);
      else if (msg.type === "usage_refresh") this.onUsageRefresh(typeof msg.runtime === "string" ? msg.runtime : void 0);
    };
    es.onerror = () => {
      if (this.es === es) this.dropAndRetry();
    };
  }
  armWatchdog(es) {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      if (this.es !== es) return;
      console.warn(`[wake] no frame in ${WATCHDOG_MS / 1e3}s \u2014 forcing reconnect`);
      this.dropAndRetry();
    }, WATCHDOG_MS);
  }
  dropAndRetry() {
    this.es?.close();
    this.es = null;
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    this.setHealthy(false);
    if (this.stopped) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
  }
  setHealthy(v) {
    if (this.healthy === v) return;
    this.healthy = v;
    if (v) console.log("[wake] push channel connected");
    else if (!this.stopped) console.log("[wake] push channel down \u2014 continuous long-poll fallback");
    this.onHealthChange(v);
  }
};

// src/lib/runtimeUsage.ts
var TIMING = {
  initialDelayMs: 1e4,
  periodMs: 5 * 6e4,
  postTurnDebounceMs: 3e4,
  postTurnMinAgeMs: 6e4,
  refreshMinAgeMs: 15e3,
  probeTimeoutMs: 6e4,
  roundConcurrency: 3
};
function describeSnapshot(s) {
  if (!s) return "cleared";
  const account = s.account?.email ?? s.account?.id;
  return [s.status, account, s.account?.plan && `plan ${s.account.plan}`, `${s.models?.length ?? 0} model(s)`, s.error].filter(Boolean).join(", ");
}
function createRuntimeUsageProber(deps) {
  const timing = { ...TIMING, ...deps.timing };
  const now = deps.now ?? Date.now;
  const snapshots = /* @__PURE__ */ new Map();
  const inFlight2 = /* @__PURE__ */ new Map();
  const controllers = /* @__PURE__ */ new Set();
  const postTurnTimers = /* @__PURE__ */ new Map();
  const logged = /* @__PURE__ */ new Map();
  let roundTimer = null;
  let stopped2 = true;
  const fresh = (runtime, maxAgeMs) => {
    const last = snapshots.get(runtime);
    return !!last && last.status !== "error" && now() - last.fetchedAt < maxAgeMs;
  };
  function probeOne(runtime) {
    const running = inFlight2.get(runtime);
    if (running) return running;
    const probe = deps.probe(runtime);
    if (!probe) return Promise.resolve();
    const before = JSON.stringify(snapshots.get(runtime) ?? null);
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(new Error(`${runtime} usage probe timed out after ${timing.probeTimeoutMs}ms`)), timing.probeTimeoutMs);
    const startedAt = now();
    const run = (async () => {
      try {
        const snapshot = { fetchedAt: now(), ...await probe(controller.signal) };
        snapshots.set(runtime, snapshot);
        const line = `${describeSnapshot(snapshot)}${snapshot.models?.length ? ` [${snapshot.models.map((m) => m.id).join(", ")}]` : ""}`;
        if (logged.get(runtime) !== line) {
          logged.set(runtime, line);
          console.log(`[usage] ${runtime} probed in ${((now() - startedAt) / 1e3).toFixed(1)}s: ${line}`);
        }
      } catch (err) {
        const cause = controller.signal.aborted ? controller.signal.reason : err;
        const message = cause instanceof Error ? cause.message : String(cause);
        logged.delete(runtime);
        console.warn(`[usage] ${runtime} probe failed: ${message}`);
        if ((snapshots.get(runtime)?.status ?? "error") === "error") snapshots.set(runtime, { fetchedAt: now(), status: "error", account: null, windows: [], error: message });
      } finally {
        clearTimeout(timer);
        controllers.delete(controller);
        inFlight2.delete(runtime);
      }
      if (!stopped2 && JSON.stringify(snapshots.get(runtime)) !== before) deps.onChange();
    })();
    inFlight2.set(runtime, run);
    return run;
  }
  async function round() {
    const installed3 = deps.runtimes();
    const gone = [...snapshots.keys()].filter((r) => !installed3.includes(r));
    for (const r of gone) {
      snapshots.delete(r);
      logged.delete(r);
      console.log(`[usage] ${r} no longer installed; clearing its snapshot`);
    }
    if (gone.length && !stopped2) deps.onChange();
    const queue = [...installed3];
    const worker = async () => {
      for (let runtime = queue.shift(); runtime && !stopped2; runtime = queue.shift()) await probeOne(runtime);
    };
    await Promise.all(Array.from({ length: timing.roundConcurrency }, worker));
  }
  const schedule = (delay2) => {
    if (roundTimer) clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      roundTimer = null;
      void round().finally(() => {
        if (!stopped2) schedule(timing.periodMs);
      });
    }, delay2);
  };
  return {
    start() {
      stopped2 = false;
      schedule(timing.initialDelayMs);
    },
    stop() {
      stopped2 = true;
      if (roundTimer) {
        clearTimeout(roundTimer);
        roundTimer = null;
      }
      for (const t of postTurnTimers.values()) clearTimeout(t);
      postTurnTimers.clear();
      for (const c of controllers) c.abort(new Error("runtime usage probes stopped"));
    },
    // The wire shape presence sends (see MachineRuntimeUsage): an uninstalled runtime is an explicit
    // null so the server clears it; one installed but not yet probed since start is left out, so
    // the server keeps the last snapshot it has instead of blanking the page until the first round.
    snapshots() {
      const installed3 = deps.runtimes();
      const out = {};
      for (const r of EXTERNAL_AGENT_RUNTIMES) {
        const s = snapshots.get(r);
        if (s) out[r] = s;
        else if (!installed3.includes(r)) out[r] = null;
      }
      return out;
    },
    // A turn on the runtime just ended: its quota moved, so re-probe soon — debounced across a burst
    // of turns, and skipped while the last snapshot is still young.
    noteTurnEnded(runtime) {
      if (stopped2) return;
      clearTimeout(postTurnTimers.get(runtime));
      postTurnTimers.set(runtime, setTimeout(() => {
        postTurnTimers.delete(runtime);
        if (!fresh(runtime, timing.postTurnMinAgeMs) && deps.runtimes().includes(runtime)) void probeOne(runtime);
      }, timing.postTurnDebounceMs));
    },
    // Someone on the usage page asked: that runtime (or, unnamed, every installed one) again, now.
    // A name off the wire that matches no installed runtime probes nothing.
    async refreshNow(only) {
      console.log(`[usage] refresh requested: ${only ?? "all runtimes"}`);
      for (const runtime of deps.runtimes()) {
        if (stopped2) return;
        if (only && runtime !== only) continue;
        if (!fresh(runtime, timing.refreshMinAgeMs)) await probeOne(runtime);
      }
    },
    // Test seam: one probe of one runtime, awaited.
    probe: probeOne
  };
}

// src/PollClient.ts
var PollClient = class _PollClient {
  constructor(serverUrl, machineId, token, tunnel) {
    this.serverUrl = serverUrl;
    this.machineId = machineId;
    this.token = token;
    this.tunnel = tunnel;
  }
  running = false;
  abortController = new AbortController();
  runningTasks = /* @__PURE__ */ new Map();
  presenceTimer = null;
  gcTimer = null;
  flushTimer = null;
  pokeTimer = null;
  // Machine facts ride the beat on change: each is sent whenever it differs from the value the
  // server last confirmed stored (`applied` in its reply). A field the server didn't name — an
  // older server, or a failed update — is not marked sent by the 200 and rides the next beat again.
  confirmed = /* @__PURE__ */ new Map();
  // The installed runtimes' subscription usage; a fresh snapshot rides the next beat, not the 20s tick.
  usage = createRuntimeUsageProber({
    runtimes: installedRuntimes,
    probe: (runtime) => EXTERNAL_RUNTIMES[runtime].usage ?? null,
    onChange: () => this.pokePresence()
  });
  revoked = false;
  maxConcurrentTasks = null;
  wakeChannel = null;
  wakeResolve = null;
  wakePending = false;
  // Per-builder remote_shell channel health, same contract: presence is the only place the server
  // learns whether the exec connection is up, connecting (first-time setup) or failing.
  getExecSync;
  // Desired remote_shell exec targets, delivered through presence.
  onExecTargets;
  // Whether this machine should hold a tailnet node for the team (serveWanted), same channel.
  onServeWanted;
  lastPresenceWarnAt = 0;
  syncLogged = /* @__PURE__ */ new Map();
  start() {
    this.running = true;
    this.abortController = new AbortController();
    this.tunnel.setNodeChangeHandler(() => void this.reportPresence());
    this.startPresenceHeartbeat();
    if (!this.wakeChannel) {
      this.wakeChannel = new WakeChannel(
        this.serverUrl,
        this.token,
        () => this.onWake(),
        () => this.pokePresence(),
        // Both health flips end a park: down → resume continuous long-poll, up → claim now.
        () => this.wakeResolve?.(),
        // A steer or cancel waiting for one of this machine's active steps — tick its heartbeat now
        // so it lands within a round-trip instead of the 60s interval.
        (stepId) => pokeActiveHeartbeats(stepId),
        // A usage card's refresh button: re-probe that runtime now, the beat that follows carries the result.
        (runtime) => void this.usage.refreshNow(runtime)
      );
    }
    this.wakeChannel?.start();
    console.log(`[machine] Online (machineId=${this.machineId}); polling ${this.serverUrl}`);
    this.startHousekeeping();
    this.startOutboxFlush();
    this.usage.start();
    void flushDoneOutbox(this.serverUrl, this.token).then(() => this.recover()).then(() => this.loop());
  }
  // Entries appear only when an outage outlived a /done's inline retries; this timer is their
  // recovery path while the daemon stays up (a restart flushes in start()). Cheap when empty —
  // one readdir a minute.
  startOutboxFlush() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => void flushDoneOutbox(this.serverUrl, this.token), 6e4);
  }
  // Debounce shell-health/config changes into one immediate presence beat.
  pokePresence() {
    if (this.pokeTimer) return;
    this.pokeTimer = setTimeout(() => {
      this.pokeTimer = null;
      void this.reportPresence();
    }, 250);
  }
  async recover() {
    try {
      const res = await serverRequest(this.serverUrl, "/api/machine/recover", { method: "POST", token: this.token, timeoutMs: TIMEOUTS_MS.recover });
      if (!res.ok) {
        console.warn(`[recover] HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.recovered > 0) console.log(`[recover] re-queued ${data.recovered} step(s)`);
      else console.log("[recover] no pending steps found");
    } catch (err) {
      console.error("[recover] failed:", err.message);
    }
  }
  stop() {
    this.running = false;
    this.abortController.abort();
    this.wakeChannel?.stop();
    this.usage.stop();
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
      this.presenceTimer = null;
    }
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.pokeTimer) {
      clearTimeout(this.pokeTimer);
      this.pokeTimer = null;
    }
  }
  // The machine was removed from its team (or its token revoked): every /api/machine/* call now
  // returns the app's 401. Fail fast instead of spinning forever — stop and exit so the operator notices.
  handleRevoked(status) {
    if (this.revoked) return;
    this.revoked = true;
    console.error(`[machine] No longer registered (HTTP ${status}) \u2014 removed from team or token revoked. Shutting down.`);
    this.stop();
    process.exit(EXIT_TERMINAL);
  }
  startPresenceHeartbeat() {
    if (this.presenceTimer) clearInterval(this.presenceTimer);
    const tick = () => void this.reportPresence();
    tick();
    this.presenceTimer = setInterval(tick, 2e4);
  }
  // Local-disk hygiene on a long-lived cadence: machines rarely restart, so a
  // startup-only sweep never runs. Once now, then daily.
  startHousekeeping() {
    if (this.gcTimer) clearInterval(this.gcTimer);
    const run = () => {
      void cleanupStaleSessions().catch(() => {
      });
      void cleanupOrphanWorktrees().catch(() => {
      });
    };
    run();
    this.gcTimer = setInterval(run, 24 * 36e5);
  }
  // What the server should hold about this machine, by presence field name.
  facts(node) {
    return {
      // Tunnel coordinates, set→cleared included, so the server nulls them and peers stop dialing
      // a torn-down tunnel; and why the tunnel is down when it is (null while healthy), so the
      // server can name the failure (e.g. node-auth DNS errors on Termux).
      sshHostKey: node?.sshHostKey ?? null,
      tailnetAddr: node?.tailnetAddr ?? null,
      tunnelError: node ? null : this.tunnel.lastError(),
      workspacesDir: workspacesRoot(),
      platform: process.platform,
      arch: process.arch,
      // Who hosts this worker: the CLI daemon, or the desktop shell (TDS_RUNNER=desktop). The web
      // words its update/offline hints by it — "update Todos" is useless advice for a CLI machine.
      runner: process.env.TDS_RUNNER === "desktop" ? "desktop" : "cli",
      // External runtimes are the user's own installs, so re-probed every beat (a few stats) —
      // found→gone included, so selection stops routing those turns here.
      runtimes: installedRuntimes(),
      // Their sign-ins' subscription usage: a probe lands, one beat carries it.
      runtimeUsage: this.usage.snapshots()
    };
  }
  // Detected runtimes and their models land in the log once per change: synced, or not stored by
  // the server (older server, failed update) and so riding the next beat again.
  logRuntimeSync(body, applied2) {
    const log = (key, line, warn2) => {
      if (this.syncLogged.get(key) === line) return;
      this.syncLogged.set(key, line);
      if (warn2) console.warn(line);
      else console.log(line);
    };
    if ("runtimes" in body) {
      const list = body.runtimes.join(", ") || "none";
      log("runtimes", applied2.has("runtimes") ? `[machine] synced runtimes: ${list}` : `[machine] server did not store runtimes (${list}); retrying next beat`, !applied2.has("runtimes"));
    }
    if ("runtimeUsage" in body) {
      const ok = applied2.has("runtimeUsage");
      for (const [runtime, snapshot] of Object.entries(body.runtimeUsage)) {
        const key = `usage:${runtime}`;
        if (snapshot == null && !this.syncLogged.has(key)) continue;
        const line = describeSnapshot(snapshot);
        log(key, ok ? `[machine] synced ${runtime}: ${line}` : `[machine] server did not store ${runtime} usage (${line}); retrying next beat`, !ok);
      }
    }
  }
  async reportPresence() {
    try {
      const body = { load: this.runningTasks.size };
      const execSync = this.getExecSync?.();
      if (execSync) body.execSync = execSync;
      const node = this.tunnel.current();
      const facts = this.facts(node);
      const keys = new Map(Object.entries(facts).map(([field, value]) => [field, JSON.stringify(value)]));
      for (const [field, key] of keys) if (key !== this.confirmed.get(field)) body[field] = facts[field];
      const res = await serverRequest(this.serverUrl, "/api/machine/presence", { token: this.token, body, timeoutMs: TIMEOUTS_MS.presence });
      if (isMachineTokenRejected(res.status)) return this.handleRevoked(res.status);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const next = normalizeConcurrency(data?.maxConcurrentTasks);
        if (next != null && next !== this.maxConcurrentTasks) {
          console.log(`[machine] maxConcurrent changed ${this.maxConcurrentTasks} -> ${next}`);
          this.maxConcurrentTasks = next;
        }
        if (Array.isArray(data?.execTargets)) this.onExecTargets?.(data.execTargets);
        if (typeof data?.serveWanted === "boolean") this.onServeWanted?.(data.serveWanted);
        if (node && this.confirmed.get("tailnetAddr") === keys.get("tailnetAddr") && data?.tailnetAddr === null) this.tunnel.rejoin();
        const applied2 = new Set(Array.isArray(data?.applied) ? data.applied : []);
        for (const field of applied2) {
          const key = keys.get(field);
          if (key != null) this.confirmed.set(field, key);
        }
        this.logRuntimeSync(body, applied2);
      }
    } catch (err) {
      void refreshSystemProxy();
      if (Date.now() - this.lastPresenceWarnAt > 3e5) {
        this.lastPresenceWarnAt = Date.now();
        console.warn(`[machine] presence beat failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  // Graceful-shutdown signal: ask the server to drop our presence lease now (best-effort) so the
  // UI shows offline immediately instead of waiting out the ~60s TTL.
  async reportOffline() {
    try {
      await serverRequest(this.serverUrl, "/api/machine/presence", { token: this.token, body: { offline: true }, timeoutMs: TIMEOUTS_MS.presenceOffline });
    } catch {
    }
  }
  runningCount() {
    return this.runningTasks.size;
  }
  // The claim loop, running for the daemon's whole life. Exits when running stops.
  async loop() {
    let reconnectDelay = 2e3;
    while (this.running) {
      try {
        const maxConcurrentTasks = this.maxConcurrentTasks ?? 1;
        if (this.runningTasks.size >= maxConcurrentTasks) {
          await Promise.race([...this.runningTasks.values(), sleep8(2e3, this.abortController.signal)]);
          continue;
        }
        const claimed = await this.claimOnce();
        reconnectDelay = 2e3;
        if (!claimed && this.wakeChannel?.isHealthy()) await this.parkForWake();
      } catch (err) {
        if (!this.running) break;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[machine] Claim error: ${msg} \u2014 retrying in ${reconnectDelay / 1e3}s`);
        await sleep8(reconnectDelay, this.abortController.signal);
        reconnectDelay = Math.min(reconnectDelay * 2, 3e4);
      }
    }
  }
  // Ceiling on how long an empty claim parks for a wake signal. Must stay under machineQueue's
  // STALLED_SWEEP_MS (60s): sweepStalled only runs inside a claim, and a stalled job's requeue
  // never publishes a wake, so parking longer would defer stalled-job recovery indefinitely.
  static PARK_MAX_MS = 45e3;
  onWake() {
    if (this.wakeResolve) this.wakeResolve();
    else this.wakePending = true;
  }
  async parkForWake() {
    if (this.wakePending) {
      this.wakePending = false;
      return;
    }
    const wake = new Promise((resolve6) => {
      this.wakeResolve = resolve6;
    });
    try {
      await Promise.race([wake, sleep8(_PollClient.PARK_MAX_MS, this.abortController.signal)]);
    } finally {
      this.wakeResolve = null;
    }
  }
  async claimOnce() {
    const res = await serverRequest(this.serverUrl, "/api/machine/tasks/claim", {
      token: this.token,
      body: { load: this.runningTasks.size },
      signal: this.abortController.signal,
      timeoutMs: TIMEOUTS_MS.claim
    });
    if (isMachineTokenRejected(res.status)) {
      this.handleRevoked(res.status);
      return false;
    }
    if (!res.ok) throw new Error(`Claim HTTP ${res.status}`);
    const step = await res.json();
    console.log(`[machine] claim step=${step ? step.stepId : "null"} (running=${this.runningTasks.size})`);
    if (!step) return false;
    if (this.runningTasks.has(step.stepId)) {
      console.warn(`[machine] step ${step.stepId} already running \u2014 skipping duplicate claim`);
      return true;
    }
    const execute = isBranchSyncJob(step) ? executeBranchSyncJob(step, this.serverUrl, this.token, { signal: this.abortController.signal }) : executeStep(step, this.serverUrl, this.token, this.tunnel);
    const promise = execute.catch((err) => {
      console.error(`[machine] step ${step.stepId} crashed:`, err instanceof Error ? err.message : String(err));
    }).finally(() => {
      if (this.runningTasks.get(step.stepId) === promise) this.runningTasks.delete(step.stepId);
      if (!isBranchSyncJob(step) && step.runtime) this.usage.noteTurnEnded(step.runtime);
      void this.reportPresence();
      console.log(`[machine] step ${step.stepId} finished (${this.runningTasks.size}/${this.maxConcurrentTasks} running)`);
    });
    this.runningTasks.set(step.stepId, promise);
    void this.reportPresence();
    console.log(`[machine] step ${step.stepId} for ${isBranchSyncJob(step) ? "branch sync" : `conv ${step.conversationId}`} (${this.runningTasks.size}/${this.maxConcurrentTasks} running)`);
    return true;
  }
};
function sleep8(ms, signal) {
  return new Promise((resolve6) => {
    const onAbort = () => {
      clearTimeout(t);
      resolve6();
    };
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve6();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// src/lib/sidecar.ts
var import_node_child_process8 = require("node:child_process");

// src/lib/bin.ts
var import_node_fs60 = require("node:fs");
var import_node_path45 = require("node:path");
var GOOS = { darwin: "darwin", linux: "linux", win32: "windows", android: "linux" };
var GOARCH = { x64: "amd64", arm64: "arm64" };
function ensureExecutable(path) {
  if (process.platform === "win32") return;
  try {
    const mode = (0, import_node_fs60.statSync)(path).mode;
    if ((mode & 73) !== 73) (0, import_node_fs60.chmodSync)(path, mode | 73);
  } catch {
  }
}
function resolveBin(name) {
  const override = process.env.TDS_TUNNEL_BIN;
  if (override) return override;
  const exe = process.platform === "win32" ? ".exe" : "";
  const platforms = process.platform === "android" ? ["android", "linux"] : [process.platform];
  for (const platform2 of platforms) {
    try {
      const fromPkg = require.resolve(`@todos-dev/cli-${platform2}-${process.arch}/${name}${exe}`);
      ensureExecutable(fromPkg);
      return fromPkg;
    } catch {
    }
  }
  const goos = GOOS[process.platform];
  const goarch = GOARCH[process.arch];
  if (goos && goarch) {
    const rel = (0, import_node_path45.join)("vendor", "bin", `${goos}-${goarch}`, `${name}${exe}`);
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
      const vendored = (0, import_node_path45.join)(dir, rel);
      if ((0, import_node_fs60.existsSync)(vendored)) {
        ensureExecutable(vendored);
        return vendored;
      }
      const parent = (0, import_node_path45.join)(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  }
  if (process.env.TDS_DISABLE_TUNNEL !== "1") {
    const tried = platforms.map((p) => `@todos-dev/cli-${p}-${process.arch}`).join(", ");
    console.warn(`[bin] ${name} binary not found (none of ${tried} installed, no vendor/ tree near ${__dirname}) \u2014 falling back to PATH. Run \`pnpm vendor:bins\` (dev) or reinstall the CLI.`);
  }
  return name;
}
var TUNNEL_BIN = resolveBin("tds-tunnel");

// src/lib/ndjson.ts
function createNdjsonParser(onEvent) {
  let buf = "";
  return (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let evt;
      try {
        evt = JSON.parse(line);
      } catch {
        continue;
      }
      onEvent(evt);
    }
  };
}

// src/lib/sidecar.ts
var RESTART_MIN_MS = 1e3;
var RESTART_MAX_MS = 6e4;
var spawnFailureMessage = (err) => `tds-tunnel could not start (${err instanceof Error ? err.message : String(err)}) \u2014 the bundled binary may be missing or blocked; reinstall the CLI`;
var Sidecar = class {
  constructor(args2, label, onEvent, onExit) {
    this.args = args2;
    this.label = label;
    this.onExit = onExit;
    this.parse = createNdjsonParser(onEvent);
  }
  proc = null;
  stopped = false;
  restartTimer = null;
  restartDelayMs = RESTART_MIN_MS;
  parse;
  // Fired when the binary cannot start at all (missing/quarantined): that path produces no events
  // and no respawn, so without this the failure exists only as a log line the owner never sees.
  onSpawnFailure;
  start() {
    this.stopped = false;
    this.spawn();
  }
  stop() {
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.proc?.kill();
    this.proc = null;
  }
  // Owner saw the sidecar's healthy signal — future crashes retry quickly again.
  resetBackoff() {
    this.restartDelayMs = RESTART_MIN_MS;
  }
  // Whether control messages can be sent at all (process up with a writable stdin).
  alive() {
    return Boolean(this.proc && !this.proc.killed && this.proc.stdin && !this.proc.stdin.destroyed);
  }
  // Write one NDJSON control message to the sidecar's stdin; false when it can't be delivered
  // (the exit/respawn path is the recovery, so callers just skip).
  write(msg) {
    const stdin = this.proc?.stdin;
    if (!stdin || stdin.destroyed) return false;
    try {
      stdin.write(JSON.stringify(msg) + "\n");
      return true;
    } catch {
      return false;
    }
  }
  spawn() {
    let proc;
    try {
      proc = (0, import_node_child_process8.spawn)(TUNNEL_BIN, this.args, {
        stdio: ["pipe", "pipe", "inherit"],
        env: { ...process.env, TDS_CLI_VERSION: getVersion() }
      });
    } catch (err) {
      console.warn(`[${this.label}] tds-tunnel not available \u2014 disabled`);
      this.onSpawnFailure?.(spawnFailureMessage(err));
      return;
    }
    this.proc = proc;
    const mine = () => this.proc === proc;
    proc.on("error", (err) => {
      console.warn(`[${this.label}] sidecar failed to start \u2014 disabled`);
      if (!mine()) return;
      this.proc = null;
      this.onSpawnFailure?.(spawnFailureMessage(err));
    });
    proc.on("exit", () => {
      if (!mine()) return;
      this.proc = null;
      this.onExit?.();
      this.scheduleRestart();
    });
    proc.stdout?.on("data", (d) => {
      if (mine()) this.parse(String(d));
    });
    proc.stdin?.on("error", () => {
    });
  }
  scheduleRestart() {
    if (this.stopped || this.restartTimer) return;
    const delay2 = this.restartDelayMs;
    this.restartDelayMs = Math.min(this.restartDelayMs * 2, RESTART_MAX_MS);
    console.warn(`[${this.label}] sidecar exited \u2014 restarting in ${Math.round(delay2 / 1e3)}s`);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.spawn();
    }, delay2);
  }
};

// src/RemoteShellManager.ts
var RemoteShellManager = class {
  sidecar;
  active = false;
  targets = [];
  health = /* @__PURE__ */ new Map();
  sidecarError = null;
  onHealthChanged;
  constructor(serverUrl, token, machineId) {
    this.sidecar = new Sidecar(
      ["mirror", "--server", serverUrl, "--token", token, "--machine", machineId],
      "shell",
      (event) => this.onEvent(event),
      () => this.markDown("tunnel daemon restarting")
    );
    this.sidecar.onSpawnFailure = (message) => this.noteError(message);
  }
  stop() {
    this.active = false;
    this.sidecar.stop();
  }
  setExecTargets(targets) {
    this.targets = targets;
    const builders = new Set(targets.map((t) => t.machineId));
    for (const id of this.health.keys()) if (!builders.has(id)) this.health.delete(id);
    if (targets.length && !this.active) {
      this.active = true;
      this.sidecar.start();
    } else if (!targets.length && this.active) {
      this.active = false;
      this.sidecar.stop();
    }
    this.sendTargets();
  }
  execStatus() {
    if (!this.targets.length) return null;
    return [...new Set(this.targets.map((t) => t.machineId))].map((builderMachineId) => {
      const error = this.health.get(builderMachineId);
      const message = error ?? this.sidecarError;
      return {
        builderMachineId,
        connected: error === null && !this.sidecarError,
        ...message ? { error: message } : {}
      };
    });
  }
  markDown(message) {
    let changed = false;
    for (const [id, error] of this.health) {
      if (error === null) {
        this.health.set(id, message);
        changed = true;
      }
    }
    if (changed) this.onHealthChanged?.();
  }
  noteError(message) {
    if (this.sidecarError === message) return;
    this.sidecarError = message;
    this.onHealthChanged?.();
  }
  onEvent(event) {
    if (event.event === "up") {
      this.sidecar.resetBackoff();
      if (this.sidecarError) {
        this.sidecarError = null;
        this.onHealthChanged?.();
      }
      this.sendTargets();
    } else if ((event.event === "exec-connected" || event.event === "exec-reconnecting") && event.machine) {
      if (!this.targets.some((t) => t.machineId === event.machine)) return;
      this.health.set(event.machine, event.event === "exec-connected" ? null : event.message ?? "reconnecting");
      this.onHealthChanged?.();
    } else if (event.event === "error") {
      this.noteError(event.message ?? "tunnel error");
    }
  }
  sendTargets() {
    this.sidecar.write({ cmd: "exec", targets: this.targets });
  }
};

// src/lib/enroll.ts
var import_child_process3 = require("child_process");
var import_os3 = require("os");

// src/lib/deviceId.ts
var import_crypto = require("crypto");
var import_fs5 = require("fs");
var import_os2 = require("os");
var deviceFile = () => tdsPath("device.json");
function getDeviceId() {
  if ((0, import_fs5.existsSync)(deviceFile())) {
    try {
      const data = JSON.parse((0, import_fs5.readFileSync)(deviceFile(), "utf-8"));
      if (data.deviceId) return data.deviceId;
    } catch {
    }
  }
  const salt = (0, import_crypto.randomBytes)(16).toString("hex");
  const deviceId = (0, import_crypto.createHash)("sha256").update(`${(0, import_os2.hostname)()}:${salt}`).digest("hex").slice(0, 32);
  (0, import_fs5.mkdirSync)(tdsDir(), { recursive: true });
  (0, import_fs5.writeFileSync)(deviceFile(), JSON.stringify({ deviceId }, null, 2), { mode: 384 });
  return deviceId;
}

// src/lib/enroll.ts
function openBrowser(url) {
  const cmd2 = process.platform === "darwin" ? `open "${url}"` : process.platform === "win32" ? `start "" "${url}"` : `xdg-open "${url}"`;
  (0, import_child_process3.exec)(cmd2, () => {
  });
}
var sleep9 = (ms) => new Promise((r) => setTimeout(r, ms));
async function failBody(res) {
  const err = await res.json().catch(() => ({}));
  return err.error ?? String(res.status);
}
function saveEnrolled(serverUrl, r) {
  saveConfig({ machineId: r.machineId, token: r.token, teamId: r.teamId, serverUrl });
  console.log(`[tds] Enrolled in team ${r.teamId} (machine ${r.machineId}).`);
}
async function enrollFetch(serverUrl, path, body, label, apiKey) {
  try {
    return await withRetry(
      () => serverRequest(serverUrl, path, { token: apiKey, body, timeoutMs: TIMEOUTS_MS.enroll }),
      isRetryableHttpError,
      label
    );
  } catch (e) {
    throw new Error(`cannot reach server at ${serverUrl} (${formatError(e)}) \u2014 check the --server URL or network/proxy`);
  }
}
async function enrollViaApiKey(opts) {
  const res = await enrollFetch(
    opts.serverUrl,
    "/api/machine/enroll",
    { deviceId: getDeviceId(), name: opts.name ?? (0, import_os3.hostname)(), teamId: opts.team },
    "[tds] enroll",
    opts.apiKey
  );
  if (!res.ok) throw new Error(`Enroll failed: ${await failBody(res)}`);
  saveEnrolled(opts.serverUrl, await res.json());
}
async function enrollViaDeviceFlow(opts) {
  const startRes = await enrollFetch(
    opts.serverUrl,
    "/api/machine/enroll/start",
    { deviceId: getDeviceId(), name: opts.name ?? (0, import_os3.hostname)(), clientInfo: { platform: (0, import_os3.platform)(), hostname: (0, import_os3.hostname)() } },
    "[tds] enroll start"
  );
  if (!startRes.ok) throw new Error(`Enroll start failed: ${await failBody(startRes)}`);
  const { requestId, verificationUrl } = await startRes.json();
  console.log("");
  console.log("[tds] To authorize this machine, open this URL in a browser and pick your team:");
  console.log("");
  console.log(`    ${verificationUrl}`);
  console.log("");
  console.log("[tds] Waiting for authorization (expires in 3 minutes)\u2026");
  openBrowser(verificationUrl);
  const deadline = Date.now() + 18e4;
  while (Date.now() < deadline) {
    await sleep9(2e3);
    const pollRes = await serverRequest(opts.serverUrl, "/api/machine/enroll/poll", { body: { requestId }, timeoutMs: TIMEOUTS_MS.enrollPoll }).catch(() => null);
    if (!pollRes?.ok) continue;
    const data = await pollRes.json();
    if (data.status === "ready" && data.machineId && data.token && data.teamId) {
      saveEnrolled(opts.serverUrl, { machineId: data.machineId, teamId: data.teamId, token: data.token });
      return;
    }
    if (data.status === "expired") break;
  }
  throw new Error("Authorization timed out. Run `tds start` to try again.");
}

// src/lib/tunnel.ts
var SHELL_BUFFER_CAP = 256 * 1024;
var EMPTY_BUFFER = Buffer.alloc(0);
var TunnelServer = class _TunnelServer {
  node = null;
  onChange = null;
  // Why the tunnel is down, when it is: the sidecar's last error event (its fail() emits one
  // before exiting) or the spawn failure. Cleared on ready. Rides the presence heartbeat so the
  // server can explain a missing tailnetAddr instead of just observing it.
  lastErr = null;
  // Process lifecycle (spawn / respawn-with-backoff / stdin control) is the shared Sidecar's job;
  // this class keeps only the domain state that dies with the process: node + shells.
  sidecar;
  // Reverse shells, keyed by (build, machine) — a build reaching several machines has one shell
  // per machine. Output is buffered even with no live subscriber so output a backgrounded command
  // emits between tool calls survives until the next drain.
  shells = /* @__PURE__ */ new Map();
  wanted = false;
  constructor(serverUrl, token) {
    this.sidecar = new Sidecar(
      ["serve", "--server", serverUrl, "--token", token],
      "tunnel",
      (evt) => this.onEvent(evt),
      () => {
        this.node = null;
        this.closeAllShells();
        this.onChange?.();
      }
    );
    this.sidecar.onSpawnFailure = (message) => {
      this.lastErr = message;
      this.onChange?.();
    };
  }
  // Set the single handler fired whenever the tunnel node appears/changes/clears — or its health
  // flips (error recorded / spawn failure) — so presence can be pushed immediately instead of
  // waiting for the next heartbeat tick. Fires now if already ready.
  setNodeChangeHandler(cb) {
    this.onChange = cb;
    if (this.node) cb();
  }
  // Usage-driven like RemoteShellManager: the server says on each presence beat whether anything on
  // the team could reach this node (serveWanted); spawn on the first yes, tear down on a no. Same
  // value again is a no-op, so the 20s beat costs nothing.
  setWanted(wanted) {
    if (wanted === this.wanted) return;
    this.wanted = wanted;
    if (wanted) this.sidecar.start();
    else {
      console.log("[tunnel] nothing on the team to serve \u2014 stopping the sidecar.");
      this.stop();
    }
  }
  // The tailnet no longer holds the node we reported (the server reclaims nodes left offline >24h,
  // and tailscale would poll the dead registration forever): drop it and rejoin with fresh credentials.
  rejoin() {
    if (!this.wanted) return;
    console.log("[tunnel] node no longer registered \u2014 rejoining");
    this.stop();
    this.sidecar.start();
  }
  // Reverse-shell map key: each build has one shell per remote machine.
  static shellKey(build, machine) {
    return `${build}\0${machine}`;
  }
  onEvent(evt) {
    if (evt.event === "ready" && evt.tailnetAddr && evt.sshHostKey) {
      this.node = { tailnetAddr: evt.tailnetAddr, sshHostKey: evt.sshHostKey };
      this.lastErr = null;
      this.sidecar.resetBackoff();
      console.log(`[tunnel] ready (tailnet ${evt.tailnetAddr})`);
      this.onChange?.();
    } else if ((evt.event === "shell-opened" || evt.event === "shell-output" || evt.event === "shell-closed") && evt.build) {
      const s = this.shellState(_TunnelServer.shellKey(evt.build, evt.machine ?? ""));
      if (evt.event === "shell-opened") {
        s.connected = true;
        s.gen++;
        for (const l of [...s.listeners]) l.onOpened?.();
      } else if (evt.event === "shell-output") {
        s.connected = true;
        let next = Buffer.concat([s.buffer, Buffer.from(evt.data ?? "", "base64")]);
        if (next.length > SHELL_BUFFER_CAP) next = next.subarray(next.length - SHELL_BUFFER_CAP);
        s.buffer = next;
        for (const l of s.listeners) l.onActivity?.();
      } else {
        s.connected = false;
        for (const l of [...s.listeners]) l.onClosed();
      }
    } else if (evt.event === "error") {
      this.lastErr = evt.message ?? "unknown error";
      console.warn(`[tunnel] ${this.lastErr}`);
      this.onChange?.();
    }
  }
  // --- Reverse shell (agent → user's machine via the sync client) -----------------------------
  // Whether reverse-shell control can be sent at all (sidecar up with a writable stdin). The tool
  // checks this to fail fast instead of writing into the void.
  shellAvailable() {
    return this.sidecar.alive();
  }
  // Send keystrokes/command text to a (build, machine) shell. data is UTF-8 text (may include control
  // bytes like \x03 for Ctrl-C); it's base64-framed on the wire.
  shellSendInput(build, machine, data) {
    return this.sidecar.write({ cmd: "shell-input", build, machine, data: Buffer.from(data, "utf8").toString("base64") });
  }
  // Channels are builder-initiated and lazy: ask the sidecar to open (or confirm) the reverse shell
  // for (build, machine) over the standing exec connection to that machine. 'connected': already up,
  // nothing waited. 'opened': this call registered a fresh PTY. 'failed': the sidecar can't (no exec
  // connection, open refused) or nothing arrived within timeoutMs.
  ensureShell(build, machine, timeoutMs) {
    const s = this.shellState(_TunnelServer.shellKey(build, machine));
    if (s.connected) return Promise.resolve("connected");
    if (!this.sidecar.write({ cmd: "shell-open", build, machine })) return Promise.resolve("failed");
    return this.waitShell(s, timeoutMs, (finish) => ({
      onOpened: () => finish(true),
      onActivity: () => finish(true),
      // output implies an open shell
      onClosed: () => finish(false)
    })).then((ok) => ok ? "opened" : "failed");
  }
  // Kill the (build, machine) PTY so the next ensureShell opens a fresh one. A line editor the
  // shell's own output has wedged cannot be rescued from the input side — before this the agent's
  // only way out was asking the user to restart the CLI. The sidecar drops the registration before
  // closing, so the reopen races cleanly. Resolves on the sidecar's shell-closed, or when the wait
  // elapses: the reopen that follows is the real check, so a missed event must not strand the call.
  async restartShell(build, machine, timeoutMs) {
    const s = this.shellState(_TunnelServer.shellKey(build, machine));
    if (this.sidecar.write({ cmd: "shell-close", build, machine })) {
      s.connected = false;
      await this.waitShell(s, timeoutMs, (finish) => ({ onClosed: () => finish(true) }));
    }
    s.buffer = EMPTY_BUFFER;
  }
  // Wait until a listener wired by `wire` finishes or timeoutMs elapses (which finishes false);
  // either way the timer and listener are torn down together.
  waitShell(s, timeoutMs, wire) {
    return new Promise((resolve6) => {
      let timer;
      const finish = (ok) => {
        clearTimeout(timer);
        s.listeners.delete(listener);
        resolve6(ok);
      };
      const listener = wire(finish);
      timer = setTimeout(() => finish(false), timeoutMs);
      s.listeners.add(listener);
    });
  }
  // Whether a shell for (build, machine) has EVER opened in this builder process. Splits a failed
  // open into "never connected — the machine's shell channel may still be doing its first-time
  // setup" vs "was connected and dropped — a redial is underway". Process-local memory: a builder
  // restart forgets and reports cold-start again, which errs toward the more patient message.
  hasEverOpened(build, machine) {
    return (this.shells.get(_TunnelServer.shellKey(build, machine))?.gen ?? 0) > 0;
  }
  // True once per PTY replacement: the shell reconnected (new session, prior state lost) since the
  // tool last consumed this flag. The first-ever open is not a "reconnect".
  consumeShellReconnect(build, machine) {
    const s = this.shells.get(_TunnelServer.shellKey(build, machine));
    if (!s) return false;
    const reconnected = s.reportedGen >= 1 && s.gen > s.reportedGen;
    s.reportedGen = s.gen;
    return reconnected;
  }
  subscribeShell(build, machine, l) {
    const s = this.shellState(_TunnelServer.shellKey(build, machine));
    s.listeners.add(l);
    return () => {
      s.listeners.delete(l);
    };
  }
  // Return and clear a (build, machine) shell's buffered PTY output (UTF-8). The tool calls this
  // after a quiet period to get everything the shell printed since the last drain. The entry itself
  // is kept — connected/gen are cross-call memory (tiny, bounded by builds this daemon has served).
  drainShell(build, machine) {
    const s = this.shells.get(_TunnelServer.shellKey(build, machine));
    if (!s) return "";
    const out = s.buffer.toString("utf8");
    s.buffer = EMPTY_BUFFER;
    return out;
  }
  shellState(key) {
    let s = this.shells.get(key);
    if (!s) {
      s = { buffer: EMPTY_BUFFER, gen: 0, reportedGen: 0, listeners: /* @__PURE__ */ new Set() };
      this.shells.set(key, s);
    }
    return s;
  }
  // Sidecar death takes every client connection with it. Entries survive (not cleared) so the
  // shells' reconnect generations still tick when clients re-register against the respawned sidecar.
  closeAllShells() {
    for (const s of this.shells.values()) {
      s.connected = false;
      for (const l of [...s.listeners]) l.onClosed();
    }
  }
  current() {
    return this.node;
  }
  // The reason the tunnel is down (null while healthy or before the first failure).
  lastError() {
    return this.lastErr;
  }
  stop() {
    this.sidecar.stop();
    this.node = null;
    this.closeAllShells();
  }
};

// src/lib/keepAwake.ts
var import_node_child_process9 = require("node:child_process");
function preventIdleSleep() {
  if (process.platform !== "darwin") return;
  try {
    const child = (0, import_node_child_process9.spawn)("caffeinate", ["-i", "-w", String(process.pid)], { stdio: "ignore" });
    child.on("error", (err) => console.warn(`[machine] idle-sleep prevention unavailable: ${err.message}`));
    child.unref();
    console.log("[machine] Idle-sleep prevention active (caffeinate)");
  } catch (err) {
    console.warn(`[machine] idle-sleep prevention unavailable: ${err.message}`);
  }
}

// src/lib/unmanagedWorkers.ts
var import_child_process4 = require("child_process");
var import_fs6 = require("fs");
var import_os4 = require("os");
var import_path3 = require("path");
var PACKAGE_ENTRY = (0, import_path3.join)("@todos-dev", "cli", "dist", "index.js");
var PS_TIMEOUT_MS = 5e3;
var realOf = (p) => {
  try {
    return (0, import_fs6.realpathSync)(p);
  } catch {
    return null;
  }
};
function isWorkerArgv(argv, entry) {
  const ours = realOf(entry);
  return argv.some((arg, i) => {
    if (arg !== "start" || i === 0 || !(0, import_path3.isAbsolute)(argv[i - 1])) return false;
    const real = realOf(argv[i - 1]);
    if (!real || real !== ours && !real.endsWith(import_path3.sep + PACKAGE_ENTRY)) return false;
    return argv.slice(i + 1).some((a) => a === "--foreground" || a === "-f");
  });
}
function procsFromProc() {
  const procs = [];
  for (const entry of (0, import_fs6.readdirSync)("/proc")) {
    const pid = Number(entry);
    if (!Number.isInteger(pid)) continue;
    try {
      const argv = (0, import_fs6.readFileSync)(`/proc/${entry}/cmdline`, "utf-8").split("\0").filter(Boolean);
      if (!argv.includes("start")) continue;
      const ppid = Number(/^PPid:\s+(\d+)/m.exec((0, import_fs6.readFileSync)(`/proc/${entry}/status`, "utf-8"))?.[1]);
      procs.push({ pid, ppid, argv });
    } catch {
      continue;
    }
  }
  return procs;
}
function procsFromPs() {
  const out = (0, import_child_process4.spawnSync)("ps", ["-axww", "-o", "pid=,ppid=,uid=,command="], { encoding: "utf-8", timeout: PS_TIMEOUT_MS }).stdout ?? "";
  const uid = process.getuid?.();
  const procs = [];
  for (const line of out.split("\n")) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (!m || uid !== 0 && Number(m[3]) !== uid) continue;
    procs.push({ pid: Number(m[1]), ppid: Number(m[2]), argv: m[4].split(/\s+/) });
  }
  return procs;
}
function tdsHomeOf(pid) {
  let vars;
  if (process.platform === "linux") {
    try {
      vars = (0, import_fs6.readFileSync)(`/proc/${pid}/environ`, "utf-8").split("\0");
    } catch {
      return null;
    }
  } else {
    vars = ((0, import_child_process4.spawnSync)("ps", ["eww", "-o", "command=", "-p", String(pid)], { encoding: "utf-8", timeout: PS_TIMEOUT_MS }).stdout ?? "").trim().split(/\s+/);
  }
  const value = (key) => vars.filter((v) => v.startsWith(key + "=")).pop()?.slice(key.length + 1);
  return value("TDS_HOME") || (0, import_path3.join)(value("HOME") || (0, import_os4.homedir)(), ".tds");
}
function liveLockPid() {
  const d = readDaemon();
  return d && isAlive(d.pid) ? d.pid : null;
}
function findUnmanagedWorkers(scope = {}) {
  if (process.platform !== "linux" && process.platform !== "darwin") return [];
  try {
    const entry = scope.entry ?? process.argv[1];
    const home = scope.home ?? tdsDir();
    const homeReal = realOf(home) ?? home;
    const lockPid = scope.lockPid === void 0 ? liveLockPid() : scope.lockPid;
    const procs = process.platform === "linux" ? procsFromProc() : procsFromPs();
    return procs.filter((p) => p.pid !== process.pid && p.ppid !== lockPid && isWorkerArgv(p.argv, entry)).filter((p) => {
      const theirs = tdsHomeOf(p.pid);
      return theirs !== null && (realOf(theirs) ?? theirs) === homeReal;
    }).map((p) => p.pid);
  } catch {
    return [];
  }
}
function unmanagedWorkerHelp(pids) {
  return [
    "[tds] It was started with 'tds start --foreground' (by hand, pm2, systemd, a container), or its supervisor died \u2014 the tds daemon does not manage it.",
    `[tds] Restart it where it is managed. If nothing manages it: kill ${pids.join(" ")}, then 'tds start' \u2014 from a terminal on this machine, never from a task that worker is running.`
  ];
}

// src/commands/start.ts
async function startCommand(args2) {
  const { flags, bools } = parseFlags(args2, { f: "foreground" });
  if (bools.supervisor) return runSupervisor(args2);
  if (!bools.foreground) {
    const existing = readDaemon();
    if (existing && isAlive(existing.pid)) {
      console.error(`[tds] Already running (pid ${existing.pid}). Use 'tds restart' or 'tds stop'.`);
      process.exit(1);
    }
    const unmanaged = findUnmanagedWorkers({ lockPid: null });
    if (unmanaged.length) {
      console.error(`[tds] Already running outside the tds daemon (pid ${unmanaged.join(", ")}) \u2014 starting now would put a second worker on this machine.`);
      for (const line of unmanagedWorkerHelp(unmanaged)) console.error(line);
      process.exit(1);
    }
  }
  try {
    configureWorkspacesDir(flags, bools);
    await assertGitUsable();
    assertWorkspacesRootReady();
  } catch (e) {
    console.error(`[tds] Cannot start: ${formatError(e)}`);
    process.exit(1);
  }
  if (bools.foreground) {
    installTimestampedLogging();
    const { config, serverUrl } = await ensureEnrolled(flags);
    return runWorker(config, serverUrl);
  }
  return launchBackground(args2, flags);
}
function configureWorkspacesDir(flags, bools) {
  if (bools["workspaces-dir"]) throw new Error("--workspaces-dir requires a path");
  const raw = flags["workspaces-dir"];
  if (raw === void 0) return;
  const resolved2 = expandHome(raw);
  if (!(0, import_path4.isAbsolute)(resolved2)) throw new Error(`--workspaces-dir must be an absolute path (got: ${raw})`);
  const env = process.env.TDS_WORKSPACES_DIR;
  if (env && env !== resolved2) {
    console.warn(`[tds] Note: TDS_WORKSPACES_DIR=${env} is set and takes precedence while present.`);
  }
  if (resolved2 === loadSettings().workspacesDir) return;
  if (!(0, import_fs7.existsSync)((0, import_path4.dirname)(resolved2))) {
    throw new Error(`parent of ${resolved2} does not exist \u2014 mount the drive (or create the parent) first`);
  }
  try {
    (0, import_fs7.mkdirSync)(resolved2);
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  if (!(0, import_fs7.statSync)(resolved2).isDirectory()) throw new Error(`${resolved2} exists and is not a directory`);
  saveSettings({ workspacesDir: resolved2 });
  console.log(`[tds] Workspaces dir set to ${resolved2} (persisted). Existing clones are not moved; the old location can be deleted manually.`);
}
var TokenRejected = class extends Error {
};
async function ensureEnrolled(flags) {
  let config = loadConfig();
  const serverUrl = flags.server ?? process.env.TDS_SERVER ?? config?.serverUrl ?? "https://todos.dev";
  const apiKey = flags["api-key"] ?? process.env.TDS_API_KEY;
  if (!config || apiKey) {
    if (config) console.warn(`[machine] Overwriting existing registration (machine ${config.machineId}, team ${config.teamId}).`);
    config = await enroll(serverUrl, flags);
  }
  return { config, serverUrl };
}
async function enroll(serverUrl, flags) {
  const apiKey = flags["api-key"] ?? process.env.TDS_API_KEY;
  const team = flags.team ?? process.env.TDS_TEAM;
  const name = flags.name;
  if (apiKey) {
    if (!team) {
      console.error("[machine] --api-key requires --team <id> (or set TDS_TEAM).");
      process.exit(1);
    }
    await enrollViaApiKey({ serverUrl, apiKey, team, name });
  } else {
    await enrollViaDeviceFlow({ serverUrl, name });
  }
  return loadConfig();
}
async function preflight(serverUrl, token) {
  let res;
  try {
    res = await withRetry(
      () => serverRequest(serverUrl, "/api/machine/presence", { token, body: { load: 0 }, timeoutMs: TIMEOUTS_MS.statusProbe }),
      isRetryableHttpError,
      "[tds] preflight"
    );
  } catch (e) {
    throw new Error(`cannot reach server at ${serverUrl} (${formatError(e)}) \u2014 check the --server URL or network/proxy`);
  }
  if (isMachineTokenRejected(res.status)) {
    throw new TokenRejected(`server rejected this machine's token (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`unexpected response from ${serverUrl} (HTTP ${res.status}) \u2014 is this the right --server URL?`);
  }
}
async function launchBackground(args2, flags) {
  const enrolled = await ensureEnrolled(flags);
  const serverUrl = enrolled.serverUrl;
  let config = enrolled.config;
  try {
    await preflight(serverUrl, config.token);
  } catch (e) {
    if (e instanceof TokenRejected) {
      console.warn(`[tds] ${e.message} \u2014 logging in again.`);
      config = await enroll(serverUrl, flags);
      try {
        await preflight(serverUrl, config.token);
      } catch (e2) {
        console.error(`[tds] Cannot start: ${formatError(e2)}`);
        process.exit(1);
      }
    } else {
      console.error(`[tds] Cannot start: ${formatError(e)}`);
      process.exit(1);
    }
  }
  const pid = spawnDetachedSelf("start", ["--supervisor", ...args2]);
  writeDaemon({ pid, startedAt: Date.now(), runner: "cli", version: getVersion() });
  console.log(`[tds] Started in background (pid ${pid}).`);
  console.log("[tds] Logs: tds logs -f    Status: tds status    Stop: tds stop");
  process.exit(0);
}
async function runWorker(config, serverUrl) {
  console.log(`[machine] Starting machine ${config.machineId}`);
  console.log(`[machine] Workspaces dir: ${workspacesRoot()}`);
  logAgentShell();
  console.log("[machine] Loading pi runtime\u2026");
  await getPiRuntime();
  const tunnelDisabled = process.env.TDS_DISABLE_TUNNEL === "1";
  const tunnel = new TunnelServer(serverUrl, config.token);
  const client = new PollClient(serverUrl, config.machineId, config.token, tunnel);
  const shellManager = tunnelDisabled ? null : new RemoteShellManager(serverUrl, config.token, config.machineId);
  if (shellManager) {
    client.onServeWanted = (wanted) => tunnel.setWanted(wanted);
    shellManager.onHealthChanged = () => client.pokePresence();
    client.getExecSync = () => shellManager.execStatus();
    client.onExecTargets = (targets) => shellManager.setExecTargets(targets);
  }
  client.start();
  preventIdleSleep();
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    console.log("\n[machine] Shutting down\u2026");
    const running = client.runningCount();
    if (running > 0) console.warn(`[machine] ${running} task(s) still running \u2014 they will be interrupted`);
    client.stop();
    tunnel.stop();
    shellManager?.stop();
    await client.reportOffline().catch(() => {
    });
    setTimeout(() => process.exit(0), 200);
  };
  process.on("SIGINT", () => {
    shutdown().catch(() => process.exit(1));
  });
  process.on("SIGTERM", () => {
    shutdown().catch(() => process.exit(1));
  });
  const port = process.parentPort;
  if (port) {
    port.postMessage({ type: "ready", machineId: config.machineId });
    setInterval(() => port.postMessage({ type: "load", running: client.runningCount() }), 5e3).unref();
    port.on("message", (e) => {
      if (e.data?.type === "shutdown") shutdown().catch(() => process.exit(1));
    });
  }
}

// src/commands/stop.ts
async function stopCommand() {
  const result = await stopDaemon();
  if (result === "not_running") {
    const unmanaged = findUnmanagedWorkers({ lockPid: null });
    if (unmanaged.length) {
      console.log(`[tds] The daemon is not running, but a worker runs outside it (pid ${unmanaged.join(", ")}).`);
      for (const line of unmanagedWorkerHelp(unmanaged)) console.log(line);
      return;
    }
    console.log("[tds] Not running.");
    return;
  }
  if (result === "killed") console.warn("[tds] Did not stop in time; force-killed.");
  console.log("[tds] Stopped.");
}

// src/commands/restart.ts
var RESTART_WAIT_MS = 6e4;
var RESTART_FLAGS = /* @__PURE__ */ new Set(["--helper"]);
async function restartCommand(args2) {
  const { bools } = parseFlags(args2);
  const passThrough = stripFlags(args2, RESTART_FLAGS);
  if (bools.helper) {
    installTimestampedLogging();
    console.log("[tds] restart helper: stopping daemon");
    await stopCommand();
    return startCommand(passThrough);
  }
  if (!loadConfig()) {
    console.error("[tds] This machine is not enrolled yet \u2014 run 'tds start' instead.");
    process.exit(1);
  }
  const unmanaged = findUnmanagedWorkers();
  if (unmanaged.length) {
    console.error(`[tds] Cannot restart: a worker is running outside the tds daemon (pid ${unmanaged.join(", ")}), and a restart would only start a second one beside it.`);
    for (const line of unmanagedWorkerHelp(unmanaged)) console.error(line);
    process.exit(1);
  }
  const t0 = Date.now();
  const helperPid = spawnDetachedSelf("restart", ["--helper", ...passThrough]);
  console.log(`[tds] Restarting via detached helper (pid ${helperPid}) \u2014 completes even if this shell dies with the daemon.`);
  const fresh = () => {
    const d = readDaemon();
    return d && d.startedAt >= t0 && isAlive(d.pid) ? d : null;
  };
  const deadline = t0 + RESTART_WAIT_MS;
  while (Date.now() < deadline) {
    const helperAlive = isAlive(helperPid);
    const d = fresh();
    if (d) {
      console.log(`[tds] Restarted (pid ${d.pid}).`);
      return;
    }
    if (!helperAlive) {
      console.error("[tds] Restart failed \u2014 see the log: tds logs");
      process.exit(1);
    }
    await delay(250);
  }
  console.warn("[tds] Restart is still in progress \u2014 check with: tds status / tds logs");
}

// src/commands/upgrade.ts
var import_child_process5 = require("child_process");

// src/lib/cli.ts
function fail2(message, code = 1) {
  console.error(message);
  process.exit(code);
}
function warn(message) {
  const color = process.stderr.isTTY && !process.env.NO_COLOR;
  console.warn(color ? `\x1B[33m${message}\x1B[0m` : message);
}

// src/lib/install.ts
var import_node_fs61 = require("node:fs");
var import_node_path46 = require("node:path");
var CLI_PACKAGE = "@todos-dev/cli";
var realpath2 = (path) => {
  try {
    return (0, import_node_fs61.realpathSync)(path);
  } catch {
    return null;
  }
};
function findCliPackage(from) {
  let dir = realpath2(from);
  while (dir) {
    const manifest = (0, import_node_path46.join)(dir, "package.json");
    if ((0, import_node_fs61.existsSync)(manifest)) {
      try {
        const pkg = JSON.parse((0, import_node_fs61.readFileSync)(manifest, "utf-8"));
        return pkg.name === CLI_PACKAGE ? { dir, version: pkg.version ?? "unknown" } : null;
      } catch {
        return null;
      }
    }
    const parent = (0, import_node_path46.dirname)(dir);
    dir = parent === dir ? null : parent;
  }
  return null;
}
function globalPrefixOf(pkgDir, platform2 = process.platform) {
  const win = platform2 === "win32";
  const layout = [...win ? [] : ["lib"], "node_modules", ...CLI_PACKAGE.split("/")];
  const prefix = (0, import_node_path46.join)(pkgDir, ...layout.map(() => ".."));
  const bin = win ? (0, import_node_path46.join)(prefix, "tds.cmd") : (0, import_node_path46.join)(prefix, "bin", "tds");
  return (0, import_node_path46.join)(prefix, ...layout) === pkgDir && (0, import_node_fs61.existsSync)(bin) ? prefix : null;
}
function npmCliOf(execPath = process.execPath, platform2 = process.platform) {
  const bin = (0, import_node_path46.dirname)(execPath);
  const cli = platform2 === "win32" ? (0, import_node_path46.join)(bin, "node_modules", "npm", "bin", "npm-cli.js") : realpath2((0, import_node_path46.join)(bin, "npm"));
  return cli?.endsWith(".js") && (0, import_node_fs61.existsSync)(cli) ? cli : null;
}
function installsOnPath({ env = process.env, platform: platform2 = process.platform } = {}) {
  const found2 = [];
  for (const dir of (env.PATH ?? "").split(import_node_path46.delimiter)) {
    if (!dir) continue;
    const bin = (0, import_node_path46.join)(dir, platform2 === "win32" ? "tds.cmd" : "tds");
    const entry = platform2 === "win32" ? cmdShimTarget(bin) : realpath2(bin);
    const pkg = entry && findCliPackage((0, import_node_path46.dirname)(entry));
    if (pkg && !found2.some((i) => i.dir === pkg.dir)) found2.push({ ...pkg, bin });
  }
  return found2;
}
function duplicateInstallsNotice(installs = installsOnPath(), self = findCliPackage(__dirname)?.dir, platform2 = process.platform) {
  if (installs.length < 2) return null;
  const extraPrefix = installs.filter((i) => i.dir !== self).map((i) => globalPrefixOf(i.dir, platform2)).find(Boolean);
  return [
    `[tds] Warning: ${installs.length} copies of tds are on PATH. A plain 'tds' runs the first, and upgrading one leaves the others stale:`,
    ...installs.map((i) => `[tds]   v${i.version}  ${i.bin}${i.dir === self ? "  (this one)" : ""}`),
    `[tds] Keep one, remove the rest${extraPrefix ? ` (e.g. npm uninstall -g --prefix "${extraPrefix}" ${CLI_PACKAGE})` : ""}, then run 'tds restart' with the one you kept.`
  ].join("\n");
}

// src/commands/upgrade.ts
async function upgradeCommand() {
  const pkg = findCliPackage(__dirname);
  const prefix = pkg && globalPrefixOf(pkg.dir);
  if (!pkg || !prefix) {
    fail2(`[tds] This tds (${pkg?.dir ?? __dirname}) was not installed with 'npm install -g', so it cannot upgrade itself. Upgrade it with whatever installed it, then run: tds restart`);
  }
  const target = `${CLI_PACKAGE}@latest`;
  const install = ["install", "-g", "--prefix", prefix, target];
  console.log(`[tds] Upgrading tds v${pkg.version} in ${prefix}`);
  const npmCli = npmCliOf();
  const npm = npmCli ? (0, import_child_process5.spawnSync)(process.execPath, [npmCli, ...install], { stdio: "inherit" }) : (0, import_child_process5.spawnSync)("npm", install, { stdio: "inherit" });
  if (npm.error || npm.status !== 0) {
    const why = npm.error ? `could not run npm: ${npm.error.message}` : `npm exited with ${npm.status ?? npm.signal}`;
    console.error(`[tds] Upgrade failed (${why}); the daemon was left as it was. To run it by hand: npm install -g --prefix "${prefix}" ${target}`);
    if (process.platform === "win32") console.error("[tds] If npm reported EBUSY or EPERM, the running daemon holds the files: run 'tds stop', 'tds upgrade', then 'tds start'.");
    process.exit(1);
  }
  const version = findCliPackage(pkg.dir)?.version ?? "unknown";
  console.log(version === pkg.version ? `[tds] Already on the latest version (v${version}).` : `[tds] Upgraded v${pkg.version} \u2192 v${version}.`);
  const duplicates = duplicateInstallsNotice(installsOnPath(), pkg.dir);
  if (duplicates) warn(duplicates);
  const daemon = readDaemon();
  if (!daemon || !isAlive(daemon.pid)) {
    console.log("[tds] No background daemon to restart. Start it with 'tds start' \u2014 or, if pm2, systemd or a container runs tds, restart it there.");
    return;
  }
  if (daemon.runner === "desktop") {
    console.log("[tds] The Todos app runs this machine and updates with the app; it was left running.");
    return;
  }
  if (daemon.version === version) {
    console.log(`[tds] The daemon already runs v${version}; nothing to restart.`);
    return;
  }
  return restartCommand([]);
}

// src/commands/logs.ts
var import_fs8 = require("fs");
var TAIL_LINES = 200;
var SCAN_BYTES = 256 * 1024;
var POLL_MS2 = 500;
function readRange(fd, start, end) {
  const buf = Buffer.alloc(end - start);
  let off = 0;
  while (off < buf.length) {
    const n = (0, import_fs8.readSync)(fd, buf, off, buf.length - off, start + off);
    if (n === 0) break;
    off += n;
  }
  return buf.subarray(0, off);
}
function printTail(fd) {
  const size = (0, import_fs8.fstatSync)(fd).size;
  const start = Math.max(0, size - SCAN_BYTES);
  let lines = readRange(fd, start, size).toString("utf8").split("\n");
  if (start > 0) lines = lines.slice(1);
  if (lines[lines.length - 1] === "") lines = lines.slice(0, -1);
  const tail = lines.slice(-TAIL_LINES);
  if (tail.length) process.stdout.write(tail.join("\n") + "\n");
  return size;
}
async function logsCommand(args2) {
  const { bools } = parseFlags(args2, { f: "follow" });
  const p = logPath();
  if (!(0, import_fs8.existsSync)(p)) {
    console.log(`[tds] No log file yet (${p}). Run 'tds start' first.`);
    return;
  }
  console.error(`[tds] ${p}`);
  const fd = (0, import_fs8.openSync)(p, "r");
  try {
    let offset = printTail(fd);
    while (bools.follow) {
      await delay(POLL_MS2);
      const size = (0, import_fs8.fstatSync)(fd).size;
      if (size < offset) offset = 0;
      if (size > offset) {
        process.stdout.write(readRange(fd, offset, size));
        offset = size;
      }
    }
  } finally {
    (0, import_fs8.closeSync)(fd);
  }
}

// src/commands/status.ts
var import_fs9 = require("fs");
async function statusCommand() {
  await printStatus();
  const duplicates = duplicateInstallsNotice();
  if (duplicates) warn(duplicates);
}
async function printStatus() {
  const d = readDaemon();
  const unmanaged = findUnmanagedWorkers();
  const outside = `outside the daemon (pid ${unmanaged.join(", ")}) \u2014 'tds stop' and 'tds restart' do not manage it`;
  if (d && isAlive(d.pid)) {
    const since = d.startedAt ? new Date(d.startedAt).toLocaleString() : "unknown";
    const by = d.runner === "desktop" ? "the Todos app" : "tds start";
    console.log(`[tds] Daemon:   running (pid ${d.pid}${d.version ? `, v${d.version}` : ""}, since ${since}, started by ${by})`);
    if (d.version && d.version !== getVersion()) {
      console.log(`[tds]           this tds is v${getVersion()}, not the daemon's \u2014 'tds restart' moves the daemon onto this one`);
    }
    if (unmanaged.length) console.log(`[tds] Warning:  a second worker runs ${outside}`);
  } else if (unmanaged.length) {
    console.log(`[tds] Daemon:   not running, but a worker runs ${outside}`);
  } else {
    console.log("[tds] Daemon:   not running");
  }
  const missing2 = configuredWorkspacesDir() && !(0, import_fs9.existsSync)(workspacesRoot());
  console.log(`[tds] Workspaces: ${workspacesRoot()}${missing2 ? " (not found \u2014 is the drive mounted?)" : ""}`);
  const config = loadConfig();
  if (!config) {
    console.log("[tds] Not registered. Run: tds start");
    return;
  }
  let res;
  try {
    res = await serverRequest(config.serverUrl, "/api/machine/me", { token: config.token, timeoutMs: TIMEOUTS_MS.statusProbe });
  } catch (e) {
    console.log(`[tds] Machine: ${config.machineId}`);
    console.log(`[tds] Server:   ${config.serverUrl} (unreachable: ${formatError(e)})`);
    return;
  }
  if (!res.ok) {
    console.log(`[tds] Machine: ${config.machineId}`);
    console.log(`[tds] Server:   ${config.serverUrl} (unreachable: ${res.status})`);
    return;
  }
  const data = await res.json();
  console.log(`[tds] Machine: ${data.name} (${data.machineId})`);
  console.log(`[tds] Team:     ${data.teamId}`);
  console.log(`[tds] Agents:   ${data.agentIds.length ? data.agentIds.join(", ") : "(none \u2014 create one in the web UI)"}`);
  console.log(`[tds] Server:   ${config.serverUrl}`);
}

// src/commands/logout.ts
async function logoutCommand() {
  const config = loadConfig();
  await stopCommand();
  clearConfig();
  if (config) console.log(`[tds] Logged out (was machine ${config.machineId}, team ${config.teamId}).`);
  else console.log("[tds] No local registration found.");
  console.log("[tds] Run 'tds start' to enroll again.");
}

// src/commands/version.ts
async function versionCommand() {
  console.log(`tds ${getVersion()}`);
}

// src/index.ts
var COMMANDS = {
  start: {
    run: startCommand,
    longLived: true,
    summary: "Bring this machine online in the background (enroll if needed)",
    help: `Usage: tds start [options]

Bring this machine online. By default it runs in the background (detached) and a
supervisor keeps it alive across crashes \u2014 use 'tds status', 'tds logs', 'tds stop'.
On first run (no local registration) this enrolls the machine into a team:
  \u2022 no flags       open a browser to log in and pick the team to authorize.
  \u2022 --api-key <k>  enroll non-interactively into --team (handy for CI).

Once online the machine claims builds for its agents; agent shell access is managed
from the machine's page in the web app \u2014 the daemon picks changes
up within a few seconds, no restart needed.

Options:
  --foreground, -f  Run attached in this terminal instead of in the background (no
                    supervisor; Ctrl+C to stop). Use this when a process manager
                    (pm2/systemd) or a container already supervises tds.
  --api-key <key>   Enroll with an API key (requires --team; overwrites an existing
                    registration to switch team/account)
  --team <id>       Team id to join, used with --api-key (or set TDS_TEAM)
  --name <name>     Machine display name (default: hostname)
  --server <url>    Override the server URL
  --workspaces-dir <dir>
                    Root directory for cloned repos and worktrees (default:
                    ~/.tds/workspaces). Persisted across restarts. The parent
                    directory must already exist \u2014 handy for keeping heavy
                    checkouts on an external drive; if that drive is unmounted
                    tds refuses to start instead of cloning onto the boot disk.
                    Existing clones are not moved when the dir changes.`
  },
  stop: {
    run: () => stopCommand(),
    summary: "Stop the background machine",
    help: `Usage: tds stop

Stop the background daemon started by 'tds start'. Sends SIGTERM so in-flight tasks
shut down cleanly; SIGKILLs only if it doesn't exit in time.`
  },
  restart: {
    run: restartCommand,
    longLived: true,
    summary: "Restart the background machine",
    help: `Usage: tds restart [options]

Stop the background daemon (if running) and start it again in the background. The
stop\u2192start sequence runs in a detached helper process, so it completes even if this
shell dies with the daemon \u2014 including a shell the daemon itself hosts (an agent's
remote shell). Takes the same options as 'tds start'.

A worker running outside the daemon ('tds start --foreground') is not restarted: the
command refuses rather than start a second one \u2014 restart it where it is managed.`
  },
  upgrade: {
    run: () => upgradeCommand(),
    summary: "Upgrade this tds install and restart the background machine",
    help: `Usage: tds upgrade

Upgrade the tds install this command runs from to the latest release, then restart
the background daemon onto it the way 'tds restart' does. The install is located
from this command's own path rather than from whichever npm comes first on PATH,
so a machine with several Node setups does not end up with a second copy while
the daemon keeps running the old one.

A daemon that already runs the installed version is left alone, as is one the
Todos app runs. Nothing is started when no background daemon is running. Other
copies of tds found on PATH are listed, with their versions.`
  },
  logs: {
    run: logsCommand,
    summary: "Show the background machine's logs",
    help: `Usage: tds logs [-f]

Print the background daemon's log (~/.tds/daemon.log).

Options:
  -f, --follow   Follow the log as it grows (like 'tail -f')`
  },
  logout: {
    run: () => logoutCommand(),
    summary: "Forget this machine's local registration",
    help: `Usage: tds logout

Stop the background daemon (if running), then clear ~/.tds/machine.json so the next
'tds start' enrolls again. Local only \u2014 it does not remove the machine from the team
(an admin does that in the web UI).`
  },
  status: {
    run: () => statusCommand(),
    summary: "Show this machine's registration and status",
    help: `Usage: tds status

Show this machine's registration and current status. Warns when PATH reaches more
than one copy of tds, listing each with its version.`
  },
  version: {
    run: () => versionCommand(),
    summary: "Show the tds CLI version",
    help: `Usage: tds version

Print the installed tds CLI version.`
  },
  // Kept as a pointer, not a command: provider credentials moved to the website, and a user who
  // remembers `tds provider add` deserves directions instead of "Unknown command".
  provider: {
    run: async () => {
      const serverUrl = loadConfig()?.serverUrl ?? "https://todos.dev";
      console.log("Model providers are managed on the website now; this machine receives credentials per task.");
      console.log(`  Manage providers: ${serverUrl}/resources/providers`);
      console.log(`  How it works:     ${serverUrl}/docs/providers`);
    },
    summary: "Providers are managed on the website",
    help: `Usage: tds provider

Model providers (API keys, OAuth logins, custom endpoints) are configured on the
website, per team: Resources > Providers. Machines receive credentials with each
task, so there is nothing to set up here.`
  },
  "mcp-bridge": {
    run: () => serveToolsBridge(),
    internal: true,
    summary: "Serve a turn's platform tools to an external runtime over MCP",
    help: `Usage: tds mcp-bridge

Internal. A turn on an external runtime (Claude Code, Codex, Grok Build, Cursor,
Antigravity, Devin, GitHub Copilot, Gemini CLI, OpenCode, Qwen Code, Droid, Cline, dsh) spawns
this as its MCP server for the platform's tools (ask_user, todos, git, \u2026); the daemon supplies
its environment. Not for running by hand.`
  }
};
var args = process.argv.slice(2);
var cmd = args[0];
var rest = args.slice(1);
if (cmd === "--version" || cmd === "-v") {
  console.log(`tds ${getVersion()}`);
  process.exit(0);
}
if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
  const topic = cmd === "help" ? rest[0] : void 0;
  if (topic && COMMANDS[topic]) {
    console.log(COMMANDS[topic].help);
    process.exit(0);
  }
  printHelp();
  process.exit(0);
}
if (COMMANDS[cmd] && (rest.includes("--help") || rest.includes("-h"))) {
  console.log(COMMANDS[cmd].help);
  process.exit(0);
}
var command = COMMANDS[cmd];
if (!command) {
  console.error(`[tds] Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}
if (command.internal) console.log = console.error;
ensureProxy().then(() => command.longLived ? command.run(rest) : command.run(rest).then(() => process.exit(0))).catch(fatal);
function fatal(err) {
  console.error("[tds] Fatal:", formatError(err));
  process.exit(1);
}
function printHelp() {
  console.log("Usage: tds <command> [options]");
  console.log("");
  console.log("Commands:");
  const listed = Object.entries(COMMANDS).filter(([, c]) => !c.internal);
  const pad = Math.max(...listed.map(([name]) => name.length));
  for (const [name, { summary }] of listed) {
    console.log(`  ${name.padEnd(pad)}  ${summary}`);
  }
  console.log("");
  console.log("Run 'tds <command> --help' for command-specific options.");
  console.log("");
  console.log("Env vars:");
  console.log("  TDS_SERVER                Default server URL");
  console.log("  TDS_API_KEY               API key for non-interactive enroll");
  console.log("  TDS_TEAM                  Team name/id for --api-key enroll");
  console.log("  TDS_WORKSPACES_DIR        One-shot override of the workspaces root (not persisted;");
  console.log("                            prefer 'tds start --workspaces-dir')");
  console.log("  TDS_HOME                  Data dir for registration, daemon state, workspaces and tunnel state (default ~/.tds)");
}
