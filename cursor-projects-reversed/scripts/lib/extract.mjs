import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sha256Buffer } from "./hash.mjs";
import { candidateAbsPath } from "./payload.mjs";

/** Named `O({"module.js"()` factories in workbench.glass.main.js that implement Projects. */
export const NAMED_MODULES = Object.freeze([
  { category: "coordinator", module: "agentProjectService.js" },
  { category: "coordinator", module: "agentProjectReactive.js" },
  { category: "coordinator", module: "coordinatorAgentTaskProjection.js" },
  { category: "coordinator", module: "coordinator_tools_pb.js" },
  { category: "coordinator", module: "isComposerProjectAgent.js" },
  { category: "coordinator", module: "project-agents.js" },
  { category: "coordinator", module: "projectAgentRole.js" },
  { category: "coordinator", module: "projectAgentHeader.js" },
  { category: "coordinator", module: "project-subagent-roster.js" },
  { category: "coordinator", module: "projectFollowupSteeringPolicy.js" },
  { category: "coordinator", module: "glass-new-project-service.js" },
  { category: "coordinator", module: "create-project-dialog.react.js" },
  { category: "coordinator", module: "create-local-workspace-project.js" },
  { category: "coordinator", module: "projectLineage.js" },
  { category: "coordinator", module: "projectWorkerMembership.js" },
  { category: "coordinator", module: "glass-prompt-submit-validation.js" },
  { category: "cloud_local_agents", module: "cloudAgentRepositoryService.js" },
  { category: "cloud_local_agents", module: "cloudAgentEnvironment.js" },
  { category: "cloud_local_agents", module: "cloudAgentStorageService.js" },
  { category: "cloud_local_agents", module: "pendingReadOverride.js" },
  { category: "cloud_local_agents", module: "analytics_pb.js" },
  { category: "cloud_local_agents", module: "analytics_connectweb.js" },
  { category: "cloud_local_agents", module: "localAgentEnvironment.js" },
  { category: "cloud_local_agents", module: "localAgentGatewayConfiguration.js" },
  { category: "cloud_local_agents", module: "localAgentRepository.js" },
  { category: "cloud_local_agents", module: "lazyLocalAgentEnvironment.js" },
  { category: "cloud_local_agents", module: "cloudProjects.js" },
  { category: "cloud_local_agents", module: "origin-cloud-projects.js" },
  { category: "cloud_local_agents", module: "loadedCloudAgent.js" },
  { category: "cloud_local_agents", module: "localAgentStorageService.js" },
  { category: "shared_context", module: "projectContextContent.js" },
  { category: "shared_context", module: "project-notes-document.react.js" },
  { category: "shared_context", module: "project-notes-only-context-toggle.react.js" },
  { category: "shared_context", module: "workspaceProjectPaths.js" },
  { category: "shared_context", module: "transcriptPaths.js" },
  { category: "shared_context", module: "cloudTranscriptResidencySession.js" },
  { category: "shared_context", module: "projectPermissionsFileUtils.js" },
  { category: "shared_context", module: "composerEffectiveAllowlistService.js" },
  { category: "shared_context", module: "agentTranscriptService.js" },
  { category: "shared_context", module: "secrets.js" },
  { category: "cloud_local_agents", module: "env-setup-secret.js" },
  { category: "cloud_local_agents", module: "secret-variable-names.js" },
  { category: "subscriptions", module: "localSubscriptions.js" },
  { category: "subscriptions", module: "localSubscriptionMailbox.js" },
  { category: "subscriptions", module: "subscription-row.react.js" },
  { category: "subscriptions", module: "subscriptions-tab-content.react.js" },
  { category: "subscriptions", module: "aiSettingsService.js" },
  { category: "subscriptions", module: "fsd-mcp-tool-description.js" },
  { category: "subscriptions", module: "slackSubscriptionEvent.js" },
  { category: "subscriptions", module: "use-event-subscriptions.react.js" },
  { category: "subscriptions", module: "AgentTranscriptSubscriptionEvents.js" },
  { category: "subscriptions", module: "ComposerSubscriptionEvents.react.js" },
]);

export const FULL_COPY_FILES = Object.freeze([
  { category: "cloud_local_agents", shippedPath: "extensions/cursor-always-local/schemas/environment.schema.json" },
  { category: "shared_context", shippedPath: "extensions/cursor-always-local/schemas/permissions.schema.json" },
  { category: "cloud_local_agents", shippedPath: "extensions/cursor-always-local/package.json" },
  { category: "cloud_local_agents", shippedPath: "extensions/cursor-agent-exec/package.json" },
  { category: "cloud_local_agents", shippedPath: "extensions/cursor-agent-host/package.json" },
  { category: "cloud_local_agents", shippedPath: "extensions/cursor-local-agent-runtime/package.json" },
]);

export const MARKER_WINDOWS = Object.freeze([
  {
    category: "coordinator",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "isProjectCoordinator",
  },
  {
    category: "shared_context",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "<pr_shared_context>",
  },
  {
    category: "subscriptions",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "SUBSCRIPTION_SOURCE_SLACK",
  },
  {
    category: "subscriptions",
    shippedPath: "out/vs/workbench/services/agentData/browser/cloudAgentTranscriptIndexWorkerMain.js",
    marker: "SUBSCRIPTION_SOURCE_SLACK",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.desktop.main.js",
    marker: "localAgentStorageService",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "extensions/cursor-always-local/dist/main.js",
    marker: "LocalAgentStoreIntoProject",
  },
  {
    category: "coordinator",
    shippedPath: "extensions/cursor-agent-host/dist/agent-host-daemon/dist/bin/daemon.cjs",
    marker: "CursorProject",
  },
  {
    category: "subscriptions",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "connect_slack",
  },
  {
    category: "subscriptions",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "Connect Slack",
  },
  {
    category: "subscriptions",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "cursor.connectSlack",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "IngestConversationRequest",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/main.js",
    marker: "IngestConversationRequest",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "promptUploadRef",
  },
  {
    category: "side_chats",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "Side chat boundary.",
  },
  {
    category: "side_chats",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "Cannot create a side chat inside a side chat",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "Your environment snapshot has expired after inactivity.",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "ArchiveBackgroundComposer",
  },
  {
    category: "cloud_local_agents",
    shippedPath: "out/vs/workbench/workbench.glass.main.js",
    marker: "new_cloud_vm",
  },
]);

/** Optional safety cap only. Recover does not pass this; tests may. */
export const MODULE_MAX_BYTES = 48 * 1024;
const WINDOW_RADIUS = 4096;
const BUNDLE_SOURCES = Object.freeze([
  "out/vs/workbench/workbench.glass.main.js",
  "out/vs/workbench/workbench.desktop.main.js",
]);

export async function beautifyJs(code) {
  try {
    const esbuild = await import("esbuild");
    const result = await esbuild.transform(code, {
      loader: "js",
      minify: false,
      target: "es2022",
      legalComments: "inline",
    });
    return { code: result.code, beautified: true };
  } catch {
    return { code, beautified: false };
  }
}

const FACTORY_PREFIXES = Object.freeze(['O({"', 'j({"']);

/** Filename patterns that belong to Cursor Projects (not the whole workbench). */
export const DISCOVERY_RE =
  /project|subagent|coordinator|agentstore|agent-store|side-chat|sidechat|subscription|slack|worktree|sandbox|mcp|skill|cloudagent|localagent|backgroundcomposer|mailbox|kanban|transcript|secret|oauth|egress|snapshot|create-project|new-project|environment-setup|env-egress|cloudsubagent|composerlocalworktree/i;

export function listFactoryNames(source) {
  const names = new Set();
  for (const match of source.matchAll(/[Oj]\(\{"([^"]+)"\(\)/g)) names.add(match[1]);
  return [...names].sort();
}

export function isProjectsRelatedFactory(name) {
  if (name.endsWith(".css")) return false;
  return DISCOVERY_RE.test(name);
}

export function categorizeModule(name) {
  const n = name.toLowerCase();
  if (n.includes("side-chat") || n.includes("sidechat") || n.includes("side_chat")) return "side_chats";
  if (n.includes("agent-store") || n.includes("agentstore") || n.includes("skillstore")) return "agent_store";
  if (n.includes("subscription") || n.includes("slack") || n.includes("mailbox")) return "subscriptions";
  if (/(transcript|secret|kanban|project-document|project-task|project-notes|projectdatabase|project-database)/.test(n)) {
    return "shared_context";
  }
  if (
    /(worktree|sandbox|cloudagent|localagent|backgroundcomposer|cloudsubagent|environment-setup|env-egress|mcp|skill|plugin|snapshot)/.test(
      n,
    )
  ) {
    return "cloud_local_agents";
  }
  if (/(project|coordinator|subagent|create-project|new-project)/.test(n)) return "coordinator";
  return "cloud_local_agents";
}

export function discoverProjectsModules(source) {
  const byName = new Map();
  for (const spec of NAMED_MODULES) byName.set(spec.module, spec);
  for (const module of listFactoryNames(source).filter(isProjectsRelatedFactory)) {
    if (!byName.has(module)) byName.set(module, { category: categorizeModule(module), module });
  }
  return [...byName.values()].sort((a, b) => a.module.localeCompare(b.module) || a.category.localeCompare(b.category));
}

export function extractNamedModuleSlice(source, moduleName, maxBytes = Number.POSITIVE_INFINITY) {
  for (const prefix of FACTORY_PREFIXES) {
    const needle = `${prefix}${moduleName}"()`;
    const start = source.indexOf(needle);
    if (start < 0) continue;
    const searchFrom = start + needle.length;
    const nextFactory = source.indexOf(prefix, searchFrom);
    const naturalEnd = nextFactory > searchFrom ? nextFactory : source.length;
    const truncated = Number.isFinite(maxBytes) && naturalEnd - start > maxBytes;
    const end = truncated ? start + maxBytes : naturalEnd;
    return { start, end, text: source.slice(start, end), truncated };
  }
  return null;
}

export function extractMarkerWindow(source, marker, radius = WINDOW_RADIUS) {
  const startHit = source.indexOf(marker);
  if (startHit < 0) return null;
  const start = Math.max(0, startHit - radius);
  const end = Math.min(source.length, startHit + marker.length + radius);
  return { start, end, hit: startHit, text: source.slice(start, end) };
}

function recoveredRelative(category, shippedPath, fileName) {
  const stem = shippedPath.replaceAll("/", "__");
  return path.posix.join("recovered", category, stem, fileName);
}

function headerComment({ shippedPath, kind, name, start, end, beautified, truncated = false }) {
  return [
    `// Recovered Cursor Projects client unit. Not original TypeScript.`,
    `// shippedPath: ${shippedPath}`,
    `// kind: ${kind}`,
    `// name: ${name}`,
    `// byteRange: [${start}, ${end})`,
    `// beautified: ${beautified}`,
    `// truncated: ${truncated}`,
    ``,
  ].join("\n");
}

async function writeRecoveredFile(outDir, relative, body) {
  const abs = path.join(outDir, relative);
  await mkdir(path.dirname(abs), { recursive: true });
  const contents = body.endsWith("\n") ? body : `${body}\n`;
  await writeFile(abs, contents, "utf8");
  return { relative, sha256: sha256Buffer(contents), bytes: Buffer.byteLength(contents) };
}

/**
 * Recover Projects-related units from a payload root into outDir/recovered.
 */
export async function recoverUnits({ payloadRoot, outDir }) {
  const sourceCache = new Map();
  async function loadSource(shippedPath) {
    if (sourceCache.has(shippedPath)) return sourceCache.get(shippedPath);
    const abs = candidateAbsPath(payloadRoot, shippedPath);
    const text = await readFile(abs, "utf8");
    sourceCache.set(shippedPath, text);
    return text;
  }

  const units = [];

  const seenIds = new Set();
  for (const bundle of BUNDLE_SOURCES) {
    let source;
    try {
      source = await loadSource(bundle);
    } catch {
      continue;
    }
    for (const spec of discoverProjectsModules(source)) {
      const slice = extractNamedModuleSlice(source, spec.module);
      if (!slice) continue;
      const pretty =
        slice.text.length > 80_000 ? { code: slice.text, beautified: false } : await beautifyJs(slice.text);
      const body = headerComment({
        shippedPath: bundle,
        kind: "named-module",
        name: spec.module,
        start: slice.start,
        end: slice.end,
        beautified: pretty.beautified,
        truncated: slice.truncated,
      }) + pretty.code;
      const fileName = spec.module.endsWith(".js") || spec.module.endsWith(".ts") || spec.module.endsWith(".mjs")
        ? spec.module
        : `${spec.module}.js`;
      const id = `${spec.category}:${bundle}:${spec.module}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const written = await writeRecoveredFile(outDir, recoveredRelative(spec.category, bundle, fileName), body);
      units.push({
        id,
        category: spec.category,
        shippedPath: bundle,
        shippedSymbols: [spec.module],
        recoveredPath: written.relative,
        sha256: written.sha256,
        bytes: written.bytes,
        byteRange: [slice.start, slice.end],
        kind: "named-module",
        truncated: slice.truncated,
      });
    }
  }

  for (const spec of MARKER_WINDOWS) {
    let source;
    try {
      source = await loadSource(spec.shippedPath);
    } catch {
      continue;
    }
    const slice = extractMarkerWindow(source, spec.marker);
    if (!slice) continue;
    const pretty = await beautifyJs(slice.text);
    const body = headerComment({
      shippedPath: spec.shippedPath,
      kind: "marker-window",
      name: spec.marker,
      start: slice.start,
      end: slice.end,
      beautified: pretty.beautified,
    }) + pretty.code;
    const safeName = spec.marker.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") + ".slice.js";
    const written = await writeRecoveredFile(
      outDir,
      recoveredRelative(spec.category, spec.shippedPath, safeName),
      body,
    );
    units.push({
      id: `${spec.category}:${spec.shippedPath}:marker:${spec.marker}`,
      category: spec.category,
      shippedPath: spec.shippedPath,
      shippedSymbols: [spec.marker],
      recoveredPath: written.relative,
      sha256: written.sha256,
      bytes: written.bytes,
      byteRange: [slice.start, slice.end],
      kind: "marker-window",
    });
  }

  for (const spec of FULL_COPY_FILES) {
    let raw;
    try {
      raw = await readFile(candidateAbsPath(payloadRoot, spec.shippedPath), "utf8");
    } catch {
      continue;
    }
    const fileName = path.posix.basename(spec.shippedPath);
    const body = spec.shippedPath.endsWith(".json")
      ? raw
      : headerComment({
          shippedPath: spec.shippedPath,
          kind: "full-copy",
          name: fileName,
          start: 0,
          end: raw.length,
          beautified: false,
        }) + raw;
    const written = await writeRecoveredFile(
      outDir,
      recoveredRelative(spec.category, spec.shippedPath, fileName),
      body.endsWith("\n") ? body : `${body}\n`,
    );
    units.push({
      id: `${spec.category}:${spec.shippedPath}:full`,
      category: spec.category,
      shippedPath: spec.shippedPath,
      shippedSymbols: [fileName],
      recoveredPath: written.relative,
      sha256: written.sha256,
      bytes: written.bytes,
      byteRange: [0, raw.length],
      kind: "full-copy",
    });
  }

  units.sort((a, b) => a.id.localeCompare(b.id));
  return units;
}

export function inventoryIdentities(units) {
  return units.map((unit) => ({
    id: unit.id,
    category: unit.category,
    shippedPath: unit.shippedPath,
    shippedSymbols: [...unit.shippedSymbols],
    recoveredPath: unit.recoveredPath,
    sha256: unit.sha256,
  }));
}
