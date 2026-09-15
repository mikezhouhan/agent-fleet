import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { attachDmg, detachDmg, findCursorApp } from "./dmg.mjs";
import { recoverUnits } from "./extract.mjs";
import { classifyProjectsPayload } from "./classify.mjs";
import { buildInventory, writeInventory } from "./inventory.mjs";
import { hashFile } from "./hash.mjs";
import {
  listPresentCandidates,
  locatePayload,
  payloadIdentity,
  readInfoPlist,
  readProductJson,
} from "./payload.mjs";
import { inventoryPath, provenancePath, recoveredDir, workPayloadDir } from "./paths.mjs";

async function copyWorkingPayload(payloadRoot, destDir) {
  await rm(destDir, { recursive: true, force: true });
  const copied = [];
  for (const { relative, abs } of await listPresentCandidates(payloadRoot)) {
    const dest = path.join(destDir, ...relative.split("/"));
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(abs, dest);
    copied.push(relative);
  }
  copied.sort();
  return copied;
}

/**
 * Mount the named DMG, classify Projects units, recover the subset, write inventory.
 */
export async function recoverFromDmg({ dmgPath, outDir }) {
  const dmgBytes = (await stat(dmgPath)).size;
  const dmgSha256 = await hashFile(dmgPath);
  const mount = await attachDmg(dmgPath);
  try {
    const appPath = findCursorApp(mount.mountPoint);
    const infoPlist = await readInfoPlist(appPath);
    const payload = await locatePayload(appPath);
    const product = await readProductJson(payload.payloadRoot);
    const identity = await payloadIdentity(payload, infoPlist, product);
    const classification = await classifyProjectsPayload(payload.payloadRoot);

    const recoveredRoot = recoveredDir(outDir);
    await rm(recoveredRoot, { recursive: true, force: true });
    await mkdir(recoveredRoot, { recursive: true });
    const recoveredUnits = await recoverUnits({ payloadRoot: payload.payloadRoot, outDir });

    const workCopied = await copyWorkingPayload(payload.payloadRoot, workPayloadDir(outDir));

    const provenance = {
      dmgPath,
      dmgBytes,
      dmgSha256,
      payload: identity,
      workPayloadCopied: workCopied,
    };

    const inventory = buildInventory({ provenance, classification, recoveredUnits });
    await writeInventory(inventoryPath(outDir), inventory);
    await writeFile(provenancePath(outDir), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");

    return { provenance, classification, recoveredUnits, inventory };
  } finally {
    await detachDmg(mount);
  }
}

/** Re-extract from an already copied work/payload tree (no DMG remount). */
export async function recoverFromPayloadRoot({ payloadRoot, outDir, provenanceBase = null }) {
  const classification = await classifyProjectsPayload(payloadRoot);
  const recoveredRoot = recoveredDir(outDir);
  await rm(recoveredRoot, { recursive: true, force: true });
  await mkdir(recoveredRoot, { recursive: true });
  const recoveredUnits = await recoverUnits({ payloadRoot, outDir });
  const provenance = provenanceBase ?? { payloadRoot, note: "recovered from existing payload tree" };
  const inventory = buildInventory({ provenance, classification, recoveredUnits });
  await writeInventory(inventoryPath(outDir), inventory);
  return { provenance, classification, recoveredUnits, inventory };
}
