import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listPackage } from "@electron/asar";
import { fileIdentity, hashFile } from "./hash.mjs";

const execFileAsync = promisify(execFile);

/** Shipped paths scanned for Projects mechanics. Relative to Contents/Resources/app. */
export const CANDIDATE_RELATIVE_PATHS = Object.freeze([
  "package.json",
  "product.json",
  "node_modules.asar",
  "out/main.js",
  "out/vs/workbench/workbench.desktop.main.js",
  "out/vs/workbench/workbench.glass.main.js",
  "out/vs/workbench/workbench.anysphere-ui-automations.js",
  "out/vs/workbench/services/agentData/browser/cloudAgentTranscriptIndexWorkerMain.js",
  "out/vs/code/electron-utility/conversationSearch/conversationSearchMain.js",
  "extensions/cursor-agent-exec/package.json",
  "extensions/cursor-agent-exec/dist/main.js",
  "extensions/cursor-agent-host/package.json",
  "extensions/cursor-agent-host/dist/main.js",
  "extensions/cursor-agent-host/dist/agent-host-daemon/dist/bin/daemon.cjs",
  "extensions/cursor-local-agent-runtime/package.json",
  "extensions/cursor-local-agent-runtime/dist/main.js",
  "extensions/cursor-always-local/package.json",
  "extensions/cursor-always-local/dist/main.js",
  "extensions/cursor-always-local/schemas/environment.schema.json",
  "extensions/cursor-always-local/schemas/permissions.schema.json",
  "extensions/cursor-resolver/dist/browser/main.js",
  "extensions/cursor-agent-worker/dist/main.js",
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

/**
 * Cursor 3.20 ships an unpacked VS Code-style `Contents/Resources/app` tree.
 * `app.asar` is absent; `node_modules.asar` is an empty stub (`{"files":{}}`).
 */
export async function locatePayload(appPath) {
  const resources = path.join(appPath, "Contents", "Resources");
  const unpackedApp = path.join(resources, "app");
  const classicAsar = path.join(resources, "app.asar");
  const nodeModulesAsar = path.join(unpackedApp, "node_modules.asar");

  if (await exists(unpackedApp)) {
    let asarEntryCount = null;
    if (await exists(nodeModulesAsar)) {
      try {
        asarEntryCount = listPackage(nodeModulesAsar).length;
      } catch {
        asarEntryCount = null;
      }
    }
    return {
      kind: "unpacked-app",
      appPath,
      payloadRoot: unpackedApp,
      asarPath: (await exists(classicAsar)) ? classicAsar : null,
      nodeModulesAsarPath: (await exists(nodeModulesAsar)) ? nodeModulesAsar : null,
      asarEntryCount,
    };
  }

  if (await exists(classicAsar)) {
    return {
      kind: "app.asar",
      appPath,
      payloadRoot: classicAsar,
      asarPath: classicAsar,
      nodeModulesAsarPath: null,
      asarEntryCount: listPackage(classicAsar).length,
    };
  }

  throw new Error(`No Cursor payload under ${resources}: expected app/ or app.asar`);
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
  return present;
}

export async function payloadIdentity(payload, infoPlist, product) {
  const files = [];
  for (const { relative, abs } of await listPresentCandidates(payload.payloadRoot)) {
    const id = await fileIdentity(abs);
    files.push({ shippedPath: relative, sha256: id.sha256, bytes: id.bytes });
  }
  files.sort((a, b) => a.shippedPath.localeCompare(b.shippedPath));

  let nodeModulesAsarSha256 = null;
  if (payload.nodeModulesAsarPath) nodeModulesAsarSha256 = await hashFile(payload.nodeModulesAsarPath);

  const glass = files.find((f) => f.shippedPath.endsWith("workbench.glass.main.js"));
  const desktop = files.find((f) => f.shippedPath.endsWith("workbench.desktop.main.js"));

  return {
    kind: payload.kind,
    payloadRoot: "Cursor.app/Contents/Resources/app",
    asarPath: payload.asarPath ? "Cursor.app/Contents/Resources/app.asar" : null,
    nodeModulesAsar: payload.nodeModulesAsarPath
      ? { shippedPath: "node_modules.asar", sha256: nodeModulesAsarSha256, entryCount: payload.asarEntryCount }
      : null,
    primaryBundle: glass
      ? { shippedPath: glass.shippedPath, sha256: glass.sha256, bytes: glass.bytes }
      : desktop
        ? { shippedPath: desktop.shippedPath, sha256: desktop.sha256, bytes: desktop.bytes }
        : files[0] ?? null,
    files,
    app: {
      bundleId: infoPlist.CFBundleIdentifier ?? null,
      bundleName: infoPlist.CFBundleName ?? null,
      shortVersion: infoPlist.CFBundleShortVersionString ?? null,
      bundleVersion: String(infoPlist.CFBundleVersion ?? ""),
    },
    product: {
      nameShort: product?.nameShort ?? null,
      version: product?.version ?? null,
      commit: product?.commit ?? null,
      realCommit: product?.realCommit ?? null,
      vscodeVersion: product?.vscodeVersion ?? null,
      date: product?.date ?? null,
      dataFolderName: product?.dataFolderName ?? null,
      quality: product?.quality ?? null,
      darwinBundleIdentifier: product?.darwinBundleIdentifier ?? null,
      updateUrl: product?.updateUrl ?? null,
    },
  };
}

export async function readProductJson(payloadRoot) {
  const raw = await readFile(path.join(payloadRoot, "product.json"), "utf8");
  return JSON.parse(raw);
}
