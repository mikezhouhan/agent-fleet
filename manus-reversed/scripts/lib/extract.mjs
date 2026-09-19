import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sha256Buffer } from "./hash.mjs";
import { CANDIDATE_RELATIVE_PATHS, RESOURCES_CANDIDATES, listFrontendChunkFiles } from "./payload.mjs";

export const FRONTEND_MARKERS = Object.freeze([
  { category: "skills", marker: "SKILL.md" },
  { category: "session", marker: "selectPlannerVisible" },
]);

const WINDOW_RADIUS = 4096;

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
    `// Recovered Manus 1.7.6 client unit. Not original TypeScript.`,
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
  if (n.includes("skill")) return "skills";
  if (n.includes("mcp") || n.includes("operator")) return "mcp";
  if (n.includes("session") || n.includes("mycomputer") || n.includes("sidecar") || n.includes("socket")) {
    return "session";
  }
  if (n.includes("computer") || n.includes("workspace") || n.includes("addon") || n.includes("filegrant")) {
    return "sandbox";
  }
  return "session";
}

export async function recoverUnits({ payloadRoot, resourcesPath, outDir }) {
  const units = [];

  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    const abs = path.join(payloadRoot, ...relative.split("/"));
    let raw;
    try {
      raw = await readFile(abs, "utf8");
    } catch {
      continue;
    }
    const category = categorizeFullCopy(relative);
    const fileName = path.posix.basename(relative);
    const body = headerComment({
      shippedPath: relative,
      kind: "full-copy",
      name: fileName,
      start: 0,
      end: raw.length,
    }) + raw;
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

  if (resourcesPath) {
    for (const relative of RESOURCES_CANDIDATES) {
      const abs = path.join(resourcesPath, ...relative.split("/"));
      let raw;
      try {
        raw = await readFile(abs, "utf8");
      } catch {
        continue;
      }
      const shippedPath = `Resources/${relative}`;
      const category = relative.includes("skill") ? "skills" : "sandbox";
      const fileName = path.posix.basename(relative);
      const written = await writeRecoveredFile(outDir, recoveredRelative(category, shippedPath, fileName), raw);
      units.push({
        id: `${category}:${shippedPath}:full`,
        category,
        shippedPath,
        shippedSymbols: [fileName],
        recoveredPath: written.relative,
        sha256: written.sha256,
        bytes: written.bytes,
        byteRange: [0, raw.length],
        kind: "full-copy",
        truncated: false,
      });
    }
  }

  for (const spec of FRONTEND_MARKERS) {
    for (const chunk of await listFrontendChunkFiles(payloadRoot)) {
      const source = await readFile(chunk.abs, "utf8");
      const slice = extractMarkerWindow(source, spec.marker);
      if (!slice) continue;
      const safeName = spec.marker.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") + ".slice.js";
      const body = headerComment({
        shippedPath: chunk.relative,
        kind: "marker-window",
        name: spec.marker,
        start: slice.start,
        end: slice.end,
      }) + slice.text;
      const written = await writeRecoveredFile(
        outDir,
        recoveredRelative(spec.category, chunk.relative, safeName),
        body,
      );
      units.push({
        id: `${spec.category}:${chunk.relative}:marker:${spec.marker}`,
        category: spec.category,
        shippedPath: chunk.relative,
        shippedSymbols: [spec.marker],
        recoveredPath: written.relative,
        sha256: written.sha256,
        bytes: written.bytes,
        byteRange: [slice.start, slice.end],
        kind: "marker-window",
        truncated: false,
      });
      break;
    }
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
