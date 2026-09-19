import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { attachDmg, detachDmg, findManusApp } from "./dmg.mjs";
import { recoverUnits } from "./extract.mjs";
import { classifyManusPayload } from "./classify.mjs";
import { buildInventory, writeInventory } from "./inventory.mjs";
import { hashFile } from "./hash.mjs";
import {
  extractAsarTo,
  locatePayload,
  payloadIdentity,
  readInfoPlist,
  readProductJson,
} from "./payload.mjs";
import { inventoryPath, provenancePath, recoveredDir, workPayloadDir } from "./paths.mjs";

const PLANNER_GAP = {
  mechanic: "planner/executor loop",
  status: "dmg-absent",
  note: "Desktop ships SessionSupervisor + sidecar + selectPlannerVisible UI. The actual planning/execution loop runs over wss://api.manus.im and is not in app.asar dist/.",
};

export async function recoverFromDmg({ dmgPath, outDir }) {
  const dmgBytes = (await stat(dmgPath)).size;
  const dmgSha256 = await hashFile(dmgPath);
  const mount = await attachDmg(dmgPath);
  try {
    const appPath = findManusApp(mount.mountPoint);
    const infoPlist = await readInfoPlist(appPath);
    const payload = await locatePayload(appPath);
    const extractedRoot = workPayloadDir(outDir);
    await extractAsarTo(payload.asarPath, extractedRoot);
    const product = await readProductJson(extractedRoot);
    const identity = await payloadIdentity(payload, infoPlist, product, extractedRoot);
    const classification = await classifyManusPayload(extractedRoot, payload.resourcesPath);
    classification.gaps = [PLANNER_GAP];

    const recoveredRoot = recoveredDir(outDir);
    await rm(recoveredRoot, { recursive: true, force: true });
    await mkdir(recoveredRoot, { recursive: true });
    const recoveredUnits = await recoverUnits({
      payloadRoot: extractedRoot,
      resourcesPath: payload.resourcesPath,
      outDir,
    });

    const provenance = {
      dmgPath,
      dmgBytes,
      dmgSha256,
      payload: identity,
      asarExtract: { dest: "work/payload", entryCount: payload.asarEntryCount },
      hdiutilAttach: "success (read-only)",
    };

    const inventory = buildInventory({ provenance, classification, recoveredUnits });
    await writeInventory(inventoryPath(outDir), inventory);
    await writeFile(provenancePath(outDir), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");

    return { provenance, classification, recoveredUnits, inventory };
  } finally {
    await detachDmg(mount);
  }
}
