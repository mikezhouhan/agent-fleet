import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileIdentity, hashFile } from "./hash.mjs";

const execFileAsync = promisify(execFile);

export const CANDIDATE_RELATIVE_PATHS = Object.freeze([
  "chrome/manifest.json",
  "chrome/background.js",
  "chrome/hatch-web-pairing.js",
  "chrome/popup.js",
  "chrome/options.js",
  "chrome/lib/protocol.js",
  "chrome/lib/pairing-security.js",
  "chrome/lib/blocked-sites.js",
  "chrome/lib/cdp.js",
  "chrome/lib/browser-kit.js",
  "chrome/lib/cursor-overlay.js",
  "chrome/lib/commands.js",
  "chrome/lib/connection.js",
  "chrome/lib/events.js",
  "hatch/metaconfig.json",
  "hatch/index.html",
]);

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readInfoPlist(appPath) {
  const plist = path.join(appPath, "Contents", "Info.plist");
  const { stdout } = await execFileAsync("plutil", ["-convert", "json", "-o", "-", plist], {
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

export async function locatePayload(appPath) {
  const resources = path.join(appPath, "Contents", "Resources");
  const binary = path.join(appPath, "Contents", "MacOS", "Muse");
  if (!(await exists(binary))) throw new Error(`No Muse binary at ${binary}`);
  return {
    kind: "native-macos-app",
    appPath,
    resourcesPath: resources,
    binaryPath: binary,
    payloadRoot: resources,
    asarPath: null,
  };
}

export async function copyPayloadToWork(payload, destDir) {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  const copied = [];
  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    const src = path.join(payload.resourcesPath, ...relative.split("/"));
    if (!(await exists(src))) continue;
    const dest = path.join(destDir, ...relative.split("/"));
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(src, dest);
    copied.push(relative);
  }
  const binDest = path.join(destDir, "MacOS", "Muse");
  await mkdir(path.dirname(binDest), { recursive: true });
  await cp(payload.binaryPath, binDest);
  copied.push("MacOS/Muse");
  copied.sort();
  return copied;
}

export function candidateAbsPath(payloadRoot, relative) {
  return path.join(payloadRoot, ...relative.split("/"));
}

export async function listPresentCandidates(payloadRoot) {
  const present = [];
  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    const abs = candidateAbsPath(payloadRoot, relative);
    if (await exists(abs)) present.push({ relative, abs });
  }
  const binary = path.join(payloadRoot, "MacOS", "Muse");
  if (await exists(binary)) present.push({ relative: "MacOS/Muse", abs: binary });
  return present;
}

export async function payloadIdentity(payload, infoPlist) {
  const binaryId = await fileIdentity(payload.binaryPath);
  const files = [];
  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    const abs = path.join(payload.resourcesPath, ...relative.split("/"));
    if (!(await exists(abs))) continue;
    const id = await fileIdentity(abs);
    files.push({ shippedPath: `Resources/${relative}`, sha256: id.sha256, bytes: id.bytes });
  }
  files.sort((a, b) => a.shippedPath.localeCompare(b.shippedPath));
  return {
    kind: payload.kind,
    payloadRoot: "Muse.app/Contents/Resources",
    asarPath: null,
    primaryBundle: {
      shippedPath: "MacOS/Muse",
      sha256: binaryId.sha256,
      bytes: binaryId.bytes,
    },
    files,
    app: {
      bundleId: infoPlist.CFBundleIdentifier ?? null,
      bundleName: infoPlist.CFBundleName ?? null,
      shortVersion: infoPlist.CFBundleShortVersionString ?? null,
      bundleVersion: String(infoPlist.CFBundleVersion ?? ""),
    },
  };
}

export { hashFile };
