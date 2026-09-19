import { readFile, stat } from "node:fs/promises";
import { listFrontendChunkFiles, listPresentCandidates } from "./payload.mjs";

export const CATEGORY_MARKERS = Object.freeze({
  sandbox: Object.freeze([
    "sandboxWsUrl",
    "manus-auto-workspace",
    "SidecarManager",
    "manus-computer-operator",
    "COMPUTER_USE_ADDON_ID",
  ]),
  skills: Object.freeze([
    "SKILL.md",
    "skill-recorder",
    "SkillRecordingClient",
    "recording/status",
    "SKILL_RECORDER_ADDON_ID",
  ]),
  mcp: Object.freeze([
    "mcp_servers.json",
    "operatorMcpConfig",
    "localMcp",
    '"server": "computer-use"',
    "OperatorMcpConfig",
  ]),
  session: Object.freeze([
    "SessionSupervisor",
    "selectPlannerVisible",
    "sandboxWsUrl",
    "sessionId",
    "MyComputerService",
  ]),
});

export const CATEGORY_IDS = Object.freeze(Object.keys(CATEGORY_MARKERS));

function findMarkers(text, markers) {
  return markers.filter((marker) => text.includes(marker));
}

export async function classifyManusPayload(payloadRoot, resourcesPath = null) {
  const units = [];
  const byCategory = Object.fromEntries(CATEGORY_IDS.map((id) => [id, []]));
  const scannedFiles = [];

  const candidates = await listPresentCandidates(payloadRoot, resourcesPath);
  for (const item of candidates) {
    const st = await stat(item.abs);
    if (st.isDirectory()) continue;
    const text = await readFile(item.abs, "utf8");
    scannedFiles.push(item.relative);
    for (const category of CATEGORY_IDS) {
      const symbols = findMarkers(text, CATEGORY_MARKERS[category]);
      if (symbols.length === 0) continue;
      const unit = { category, shippedPath: item.relative, shippedSymbols: symbols, bytes: st.size };
      units.push(unit);
      byCategory[category].push(unit);
    }
  }

  for (const chunk of await listFrontendChunkFiles(payloadRoot)) {
    const text = await readFile(chunk.abs, "utf8");
    scannedFiles.push(chunk.relative);
    for (const category of CATEGORY_IDS) {
      const symbols = findMarkers(text, CATEGORY_MARKERS[category]);
      if (symbols.length === 0) continue;
      const unit = {
        category,
        shippedPath: chunk.relative,
        shippedSymbols: symbols,
        bytes: (await stat(chunk.abs)).size,
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
  return { units, byCategory, missingCategories, scannedFiles: [...new Set(scannedFiles)].sort() };
}
