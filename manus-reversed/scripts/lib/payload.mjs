import { access, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { extractAll, listPackage } from "@electron/asar";
import { fileIdentity } from "./hash.mjs";

const execFileAsync = promisify(execFile);

/** Shipped paths scanned for Manus core mechanics. Relative to asar extract root unless noted. */
export const CANDIDATE_RELATIVE_PATHS = Object.freeze([
  "package.json",
  "dist/env.js",
  "dist/generated-env.js",
  "dist/consts.js",
  "dist/myComputerService/SessionSupervisor.js",
  "dist/myComputerService/sidecarManager.js",
  "dist/myComputerService/myComputerService.js",
  "dist/myComputerService/socketClient.js",
  "dist/myComputerService/types.js",
  "dist/computerUse/operatorMcpConfig.js",
  "dist/computerUse/operatorMcpTypes.js",
  "dist/computerUse/skillRecordingClient.js",
  "dist/computerUse/autoWorkspaceManager.js",
  "dist/computerUse/deviceAddonLocators.js",
  "dist/computerUse/AddonHelperLocator.js",
  "dist/computerUse/computerUseHelperProcessManager.js",
  "dist/computerUse/addonHost.js",
  "dist/agentManager/operatorManager.js",
  "dist/agentManager/operatorManagerUtils.js",
  "dist/fileGrant/fileGrantService.js",
  "dist/fileGrant/localFileHandoff.js",
  "dist/ipc/registry.js",
  "dist/ipc/handlers/localMcp.js",
  "dist/ipc/handlers/computerUse.js",
  "dist/ipc/handlers/skillRecording.js",
  "dist/ipc/handlers/desktopOperator.js",
  "dist/ipc/events/myComputer.js",
  "dist/ipc/events/skillRecording.js",
]);

export const RESOURCES_CANDIDATES = Object.freeze([
  "addons/skill-recorder/1.0.0/addon.json",
  "addons/manus-computer-use/1.0.5/addon.json",
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
  const asarPath = path.join(resources, "app.asar");
  if (!(await exists(asarPath))) {
    throw new Error(`No Manus payload under ${resources}: expected app.asar`);
  }
  const entryCount = listPackage(asarPath).length;
  return {
    kind: "app.asar",
    appPath,
    resourcesPath: resources,
    asarPath,
    payloadRoot: asarPath,
    asarEntryCount: entryCount,
  };
}

export async function extractAsarTo(asarPath, destDir) {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  extractAll(asarPath, destDir);
  return destDir;
}

export function candidateAbsPath(payloadRoot, relative) {
  return path.join(payloadRoot, ...relative.split("/"));
}

export async function listPresentCandidates(payloadRoot, resourcesPath = null) {
  const present = [];
  for (const relative of CANDIDATE_RELATIVE_PATHS) {
    const abs = candidateAbsPath(payloadRoot, relative);
    if (await exists(abs)) present.push({ relative, abs, source: "asar" });
  }
  if (resourcesPath) {
    for (const relative of RESOURCES_CANDIDATES) {
      const abs = path.join(resourcesPath, ...relative.split("/"));
      if (await exists(abs)) present.push({ relative: `Resources/${relative}`, abs, source: "resources" });
    }
  }
  const frontendChunks = path.join(payloadRoot, "frontend", "out", "_next", "static", "chunks");
  if (await exists(frontendChunks)) {
    const names = (await readdir(frontendChunks)).filter((n) => n.endsWith(".js")).sort();
    present.push({
      relative: "frontend/out/_next/static/chunks",
      abs: frontendChunks,
      source: "asar-dir",
      fileCount: names.length,
    });
  }
  return present;
}

export async function payloadIdentity(payload, infoPlist, product, extractedRoot) {
  const asarId = await fileIdentity(payload.asarPath);
  const files = [];
  for (const { relative, abs, source } of await listPresentCandidates(extractedRoot, payload.resourcesPath)) {
    const st = await stat(abs);
    if (st.isDirectory()) {
      files.push({ shippedPath: relative, kind: "directory", bytes: st.size, source });
      continue;
    }
    const id = await fileIdentity(abs);
    files.push({ shippedPath: relative, sha256: id.sha256, bytes: id.bytes, source });
  }
  files.sort((a, b) => a.shippedPath.localeCompare(b.shippedPath));
  return {
    kind: payload.kind,
    payloadRoot: "Manus.app/Contents/Resources/app.asar",
    asarPath: "Manus.app/Contents/Resources/app.asar",
    asarSha256: asarId.sha256,
    asarBytes: asarId.bytes,
    asarEntryCount: payload.asarEntryCount,
    primaryBundle: { shippedPath: "app.asar", sha256: asarId.sha256, bytes: asarId.bytes },
    files,
    app: {
      bundleId: infoPlist.CFBundleIdentifier ?? null,
      bundleName: infoPlist.CFBundleName ?? null,
      shortVersion: infoPlist.CFBundleShortVersionString ?? null,
      bundleVersion: String(infoPlist.CFBundleVersion ?? ""),
    },
    product: {
      name: product?.name ?? null,
      version: product?.version ?? null,
      main: product?.main ?? null,
    },
  };
}

export async function readProductJson(extractedRoot) {
  const raw = await readFile(path.join(extractedRoot, "package.json"), "utf8");
  return JSON.parse(raw);
}

export async function listFrontendChunkFiles(extractedRoot) {
  const dir = path.join(extractedRoot, "frontend", "out", "_next", "static", "chunks");
  if (!(await exists(dir))) return [];
  const names = (await readdir(dir)).filter((n) => n.endsWith(".js")).sort();
  return names.map((name) => ({
    relative: `frontend/out/_next/static/chunks/${name}`,
    abs: path.join(dir, name),
  }));
}
