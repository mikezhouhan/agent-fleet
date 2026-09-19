import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { classifyMusePayload, CATEGORY_IDS } from "../scripts/lib/classify.mjs";
import { extractMarkerWindow, inventoryIdentities, recoverUnits } from "../scripts/lib/extract.mjs";
import { identitiesFingerprint } from "../scripts/lib/inventory.mjs";
import { hashFile } from "../scripts/lib/hash.mjs";
import { DEFAULT_DMG_PATH, EXPECTED_DMG_SHA256, inventoryPath, repoRoot, workPayloadDir } from "../scripts/lib/paths.mjs";
import { recoverFromDmg } from "../scripts/lib/recover.mjs";

test("hashFile of the named Muse DMG matches the file on disk", async () => {
  const first = await hashFile(DEFAULT_DMG_PATH);
  const second = await hashFile(DEFAULT_DMG_PATH);
  assert.equal(first, second);
  assert.equal(first, EXPECTED_DMG_SHA256);
  assert.ok((await stat(DEFAULT_DMG_PATH)).size > 1000);
});

test("extractMarkerWindow drives the real slice function", () => {
  const source = "host=`hatch.metaaivm.com`,path=`/v1/noise` SKILL.md trailing";
  const window = extractMarkerWindow(source, "hatch.metaaivm.com", 16);
  assert.ok(window.text.includes("hatch.metaaivm.com"));
});

test("recoverFromDmg classifies Muse core units and writes recovered files", { timeout: 600_000 }, async () => {
  const dmgSha256 = await hashFile(DEFAULT_DMG_PATH);
  const result = await recoverFromDmg({ dmgPath: DEFAULT_DMG_PATH, outDir: repoRoot });
  assert.equal(result.provenance.dmgSha256, dmgSha256);
  assert.equal(result.provenance.payload.kind, "native-macos-app");
  assert.equal(result.classification.missingCategories.length, 0, result.classification.missingCategories.join(","));
  assert.ok(result.classification.gaps.some((g) => g.mechanic.includes("planner")));

  for (const category of CATEGORY_IDS) {
    assert.ok(result.classification.byCategory[category].length >= 1, `classify missing ${category}`);
    const recovered = result.inventory.units.filter((u) => u.category === category);
    assert.ok(recovered.length >= 1, `recovered missing ${category}`);
    for (const unit of recovered) {
      const abs = path.join(repoRoot, unit.recoveredPath);
      assert.ok((await stat(abs)).size > 0, unit.recoveredPath);
      assert.equal(await hashFile(abs), unit.sha256, unit.recoveredPath);
    }
  }

  const inventory = JSON.parse(await readFile(inventoryPath(repoRoot), "utf8"));
  assert.equal(inventory.provenance.dmgSha256, dmgSha256);
  const again = await recoverUnits({ payloadRoot: workPayloadDir(repoRoot), outDir: repoRoot });
  assert.equal(JSON.stringify(inventoryIdentities(again)), JSON.stringify(inventoryIdentities(result.recoveredUnits)));
  assert.ok(identitiesFingerprint(result.inventory).length > 10);
});
