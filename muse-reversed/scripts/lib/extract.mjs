import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sha256Buffer } from "./hash.mjs";
import { CANDIDATE_RELATIVE_PATHS } from "./payload.mjs";

const execFileAsync = promisify(execFile);
const WINDOW_RADIUS = 4096;

export const HTML_MARKERS = Object.freeze([
  { category: "sandbox", marker: "hatch.metaaivm.com" },
  { category: "sandbox", marker: "hatch_web:hatch_web_cvm" },
  { category: "sandbox", marker: "hatch_web:hatch_reset_vm" },
  { category: "skills", marker: "SKILL.md" },
  { category: "session", marker: "parent_agent_id" },
]);

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

function headerComment({ shippedPath, kind, name, start, end }) {
  return [
    `// Recovered Muse 2.0 client unit. Not original Meta source.`,
    `// shippedPath: ${shippedPath}`,
    `// kind: ${kind}`,
    `// name: ${name}`,
    `// byteRange: [${start}, ${end})`,
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

function categorizeFullCopy(relative) {
  const n = relative.toLowerCase();
  if (n.includes("metaconfig")) return "sandbox";
  if (n.includes("chrome")) return "computer";
  return "session";
}

function extractEndoTypes(stringsText) {
  const names = new Set();
  for (const line of stringsText.split("\n")) {
    const m = line.match(/^_TtC4Endo(\d+)([A-Za-z0-9]+)$/);
    if (m) names.add(m[2]);
    const m2 = line.match(/^([A-Z][A-Za-z0-9]*(?:Hatch|Endo|Sandbox|Computer|Agent|Node)[A-Za-z0-9]*)$/);
    if (m2 && m2[1].length < 80) names.add(m2[1]);
  }
  return [...names].sort();
}

export async function recoverUnits({ payloadRoot, outDir }) {
  const units = [];

  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    if (relative.endsWith("index.html")) continue;
    const abs = path.join(payloadRoot, ...relative.split("/"));
    let raw;
    try {
      raw = await readFile(abs, "utf8");
    } catch {
      continue;
    }
    const category = categorizeFullCopy(relative);
    const fileName = path.posix.basename(relative);
    const body = relative.endsWith(".json")
      ? raw
      : headerComment({ shippedPath: relative, kind: "full-copy", name: fileName, start: 0, end: raw.length }) + raw;
    const written = await writeRecoveredFile(outDir, recoveredRelative(category, relative, fileName), body);
    units.push({
      id: `${category}:${relative}:full`,
      category,
      shippedPath: relative,
      shippedSymbols: [fileName],
      recoveredPath: written.relative,
      sha256: written.sha256,
      bytes: written.bytes,
      byteRange: [0, raw.length],
      kind: "full-copy",
      truncated: false,
    });
  }

  const htmlPath = path.join(payloadRoot, "hatch", "index.html");
  try {
    const html = await readFile(htmlPath, "utf8");
    for (const spec of HTML_MARKERS) {
      const slice = extractMarkerWindow(html, spec.marker);
      if (!slice) continue;
      const safeName = spec.marker.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") + ".slice.js";
      const body = headerComment({
        shippedPath: "hatch/index.html",
        kind: "marker-window",
        name: spec.marker,
        start: slice.start,
        end: slice.end,
      }) + slice.text;
      const written = await writeRecoveredFile(
        outDir,
        recoveredRelative(spec.category, "hatch/index.html", safeName),
        body,
      );
      units.push({
        id: `${spec.category}:hatch/index.html:marker:${spec.marker}`,
        category: spec.category,
        shippedPath: "hatch/index.html",
        shippedSymbols: [spec.marker],
        recoveredPath: written.relative,
        sha256: written.sha256,
        bytes: written.bytes,
        byteRange: [slice.start, slice.end],
        kind: "marker-window",
        truncated: false,
      });
    }
  } catch {
    // hatch bundle optional if copy failed
  }

  const binary = path.join(payloadRoot, "MacOS", "Muse");
  try {
    const { stdout } = await execFileAsync("strings", ["-a", binary], { maxBuffer: 32 * 1024 * 1024 });
    const types = extractEndoTypes(stdout);
    const body = types.join("\n") + "\n";
    const written = await writeRecoveredFile(
      outDir,
      recoveredRelative("session", "MacOS/Muse", "endo-swift-types.txt"),
      body,
    );
    units.push({
      id: "session:MacOS/Muse:swift-types",
      category: "session",
      shippedPath: "MacOS/Muse",
      shippedSymbols: ["HatchClient", "ComputerControl", "SandboxSchemeHandler"].filter((s) => types.includes(s)),
      recoveredPath: written.relative,
      sha256: written.sha256,
      bytes: written.bytes,
      byteRange: [0, stdout.length],
      kind: "symbol-catalog",
      truncated: false,
    });
  } catch {
    // ignore
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
