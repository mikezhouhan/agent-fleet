import { readFile } from "node:fs/promises";
import { listPresentCandidates } from "./payload.mjs";

/**
 * Distinctive shipped strings for Cursor Projects client mechanics.
 * Each category must match at least one candidate file in this DMG.
 */
export const CATEGORY_MARKERS = Object.freeze({
  coordinator: Object.freeze([
    "ProjectCoordinator",
    "isProjectCoordinator",
    "agentProjectService",
    "agentProjectServiceFacade",
    "glass.localAgentProjects.v1",
    "glass.cloudAgentProjects.v1",
    "createProjectSubagent",
    "coordinatorAgentTaskProjection",
    "isComposerProjectAgent",
  ]),
  cloud_local_agents: Object.freeze([
    "cloudAgentRepositoryService",
    "glass.cloudAgentProjects.v1",
    "LocalAgentRuntimeProvider",
    "localAgentGatewayConfiguration",
    "localAgentStorageService",
    "cursor-local-agent-runtime",
    "CloudAgentEgressProtectionMode",
  ]),
  shared_context: Object.freeze([
    "pr_shared_context",
    "sharedContext",
    "projectContextContent",
    "project-notes-document",
    "project-notes-only-context-toggle",
    "cursor.sharedSessionFileWatcher.enabled",
  ]),
  subscriptions: Object.freeze([
    "SUBSCRIPTION_SOURCE_SLACK",
    "SUBSCRIPTION_SOURCE_GITHUB",
    "SUBSCRIPTION_SOURCE_LINEAR",
    "CronSchedule",
    "localSubscriptions",
    "slackConnect",
    "connect_slack",
  ]),
});

export const CATEGORY_IDS = Object.freeze(Object.keys(CATEGORY_MARKERS));

function findMarkers(buffer, markers) {
  const found = [];
  for (const marker of markers) {
    if (buffer.indexOf(marker) !== -1) found.push(marker);
  }
  return found;
}

/**
 * Classify Projects-related units in a payload root (unpacked `Contents/Resources/app`).
 * Pure over the shipped files: no GUI, no network.
 */
export async function classifyProjectsPayload(payloadRoot) {
  const candidates = await listPresentCandidates(payloadRoot);
  const units = [];
  const byCategory = Object.fromEntries(CATEGORY_IDS.map((id) => [id, []]));

  for (const { relative, abs } of candidates) {
    const buffer = await readFile(abs);
    const text = buffer.toString("utf8");
    for (const category of CATEGORY_IDS) {
      const symbols = findMarkers(text, CATEGORY_MARKERS[category]);
      if (symbols.length === 0) continue;
      const unit = {
        category,
        shippedPath: relative,
        shippedSymbols: symbols,
        bytes: buffer.length,
      };
      units.push(unit);
      byCategory[category].push(unit);
    }
  }

  units.sort((a, b) => a.category.localeCompare(b.category) || a.shippedPath.localeCompare(b.shippedPath));
  for (const category of CATEGORY_IDS) {
    byCategory[category].sort((a, b) => a.shippedPath.localeCompare(b.shippedPath));
  }

  const missingCategories = CATEGORY_IDS.filter((id) => byCategory[id].length === 0);
  return { units, byCategory, missingCategories, scannedFiles: candidates.map((c) => c.relative) };
}
