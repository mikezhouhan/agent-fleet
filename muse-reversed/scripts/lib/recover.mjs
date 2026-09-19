import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { attachDmg, detachDmg, findMuseApp } from "./dmg.mjs";
import { recoverUnits } from "./extract.mjs";
import { classifyMusePayload } from "./classify.mjs";
import { buildInventory, writeInventory } from "./inventory.mjs";
import { hashFile } from "./hash.mjs";
import { copyPayloadToWork, locatePayload, payloadIdentity, readInfoPlist } from "./payload.mjs";
import { inventoryPath, provenancePath, recoveredDir, workPayloadDir } from "./paths.mjs";

const GAPS = [
  {
    mechanic: "planner/executor loop",
    status: "dmg-absent",
    note: "Hatch CVM talks to hatch.metaaivm.com over Noise WS /v1/noise. The VM planner is not Swift source in this DMG.",
  },
  {
    mechanic: "MCP server config",
    status: "dmg-absent",
    note: "No mcp_servers.json / SKILL.md loader in the native app. mcpSetup appears as a Swift ivar; desktop MCP is not a first-class config file like Cursor or Manus operator.",
  },
];

export async function recoverFromDmg({ dmgPath, outDir }) {
  const dmgBytes = (await stat(dmgPath)).size;
  const dmgSha256 = await hashFile(dmgPath);
  const mount = await attachDmg(dmgPath);
  try {
    const appPath = findMuseApp(mount.mountPoint);
    const infoPlist = await readInfoPlist(appPath);
    const payload = await locatePayload(appPath);
    const extractedRoot = workPayloadDir(outDir);
    await copyPayloadToWork(payload, extractedRoot);
    const identity = await payloadIdentity(payload, infoPlist);
    const classification = await classifyMusePayload(extractedRoot);
    classification.gaps = GAPS;

    const recoveredRoot = recoveredDir(outDir);
    await rm(recoveredRoot, { recursive: true, force: true });
    await mkdir(recoveredRoot, { recursive: true });
    const recoveredUnits = await recoverUnits({ payloadRoot: extractedRoot, outDir });

    const provenance = {
      dmgPath,
      dmgBytes,
      dmgSha256,
      payload: identity,
      hdiutilAttach: "success (read-only)",
      asarExtract: "not applicable; native Muse.app + Resources chrome/hatch",
    };

    const inventory = buildInventory({ provenance, classification, recoveredUnits });
    await writeInventory(inventoryPath(outDir), inventory);
    await writeFile(provenancePath(outDir), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");
    return { provenance, classification, recoveredUnits, inventory };
  } finally {
    await detachDmg(mount);
  }
}
