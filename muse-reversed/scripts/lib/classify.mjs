import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listPresentCandidates } from "./payload.mjs";

const execFileAsync = promisify(execFile);

export const CATEGORY_MARKERS = Object.freeze({
  sandbox: Object.freeze([
    "hatch.metaaivm.com",
    "hatch_web:hatch_web_cvm",
    "hatch_web:hatch_reset_vm",
    "HATCH_SHARED_LB_HOST",
    "/v1/noise",
  ]),
  skills: Object.freeze(["SKILL.md", "jarvis SKILL.md"]),
  session: Object.freeze([
    "parentAgentId",
    "parent_agent_id",
    "HatchConnection",
    "agent.meta.ai",
    "hatch.meta.ai",
  ]),
  computer: Object.freeze([
    "chrome.debugger",
    "HatchConnection",
    "AGENT_TABS_KEY",
    "ComputerControl",
    "BackgroundComputerControl",
  ]),
});

export const CATEGORY_IDS = Object.freeze(Object.keys(CATEGORY_MARKERS));

function findMarkers(text, markers) {
  return markers.filter((marker) => text.includes(marker));
}

async function stringsFromBinary(binaryPath) {
  const { stdout } = await execFileAsync("strings", ["-a", binaryPath], { maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

export async function classifyMusePayload(payloadRoot) {
  const units = [];
  const byCategory = Object.fromEntries(CATEGORY_IDS.map((id) => [id, []]));
  const scannedFiles = [];

  for (const item of await listPresentCandidates(payloadRoot)) {
    scannedFiles.push(item.relative);
    let text;
    if (item.relative === "MacOS/Muse") {
      text = await stringsFromBinary(item.abs);
    } else {
      text = await readFile(item.abs, "utf8");
    }
    const bytes = (await stat(item.abs)).size;
    for (const category of CATEGORY_IDS) {
      const symbols = findMarkers(text, CATEGORY_MARKERS[category]);
      if (symbols.length === 0) continue;
      const unit = { category, shippedPath: item.relative, shippedSymbols: symbols, bytes };
      units.push(unit);
      byCategory[category].push(unit);
    }
  }

  units.sort((a, b) => a.category.localeCompare(b.category) || a.shippedPath.localeCompare(b.shippedPath));
  const missingCategories = CATEGORY_IDS.filter((id) => byCategory[id].length === 0);
  return { units, byCategory, missingCategories, scannedFiles: [...new Set(scannedFiles)].sort() };
}
