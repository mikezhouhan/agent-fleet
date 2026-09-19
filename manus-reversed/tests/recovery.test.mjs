import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { classifyManusPayload, CATEGORY_IDS } from "../scripts/lib/classify.mjs";
import { extractMarkerWindow, inventoryIdentities, recoverUnits } from "../scripts/lib/extract.mjs";
import { identitiesFingerprint } from "../scripts/lib/inventory.mjs";
import { hashFile } from "../scripts/lib/hash.mjs";
import { DEFAULT_DMG_PATH, EXPECTED_DMG_SHA256, inventoryPath, repoRoot, workPayloadDir } from "../scripts/lib/paths.mjs";
import { recoverFromDmg } from "../scripts/lib/recover.mjs";

test("hashFile of the named Manus DMG matches the file on disk", async () => {
  const first = await hashFile(DEFAULT_DMG_PATH);
  const second = await hashFile(DEFAULT_DMG_PATH);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first, second);
  assert.equal(first, EXPECTED_DMG_SHA256);
  const metadata = await stat(DEFAULT_DMG_PATH);
  assert.equal(metadata.isFile(), true);
  assert.ok(metadata.size > 1000);
});

test("extractMarkerWindow drives the real slice function", () => {
  const source = 'prefix .zip or .skill file that includes a SKILL.md file at the root level trailing selectPlannerVisible';
  const window = extractMarkerWindow(source, "SKILL.md", 20);
  assert.ok(window);
  assert.ok(window.text.includes("SKILL.md"));
  assert.equal(window.hit, source.indexOf("SKILL.md"));
});

test("recoverFromDmg classifies Manus core units and writes recovered files + inventory", { timeout: 600_000 }, async () => {
  const dmgSha256 = await hashFile(DEFAULT_DMG_PATH);
  const result = await recoverFromDmg({ dmgPath: DEFAULT_DMG_PATH, outDir: repoRoot });

  assert.equal(result.provenance.dmgSha256, dmgSha256);
  assert.equal(result.provenance.dmgSha256, EXPECTED_DMG_SHA256);
  assert.equal(result.provenance.payload.kind, "app.asar");
  assert.ok(result.provenance.payload.asarSha256);
  assert.equal(result.classification.missingCategories.length, 0, result.classification.missingCategories.join(","));
  assert.ok(result.classification.gaps.some((g) => g.mechanic.includes("planner")));

  for (const category of CATEGORY_IDS) {
    const classified = result.classification.byCategory[category];
    assert.ok(classified.length >= 1, `classify missing ${category}`);
    assert.ok(classified[0].shippedPath.length > 0);
    assert.ok(classified[0].shippedSymbols.length > 0);

    const recovered = result.inventory.units.filter((unit) => unit.category === category);
    assert.ok(recovered.length >= 1, `recovered missing ${category}`);
    for (const unit of recovered) {
      assert.ok(unit.shippedPath, unit.id);
      assert.match(unit.recoveredPath, /^recovered\//);
      const recoveredAbs = path.join(repoRoot, unit.recoveredPath);
      const meta = await stat(recoveredAbs);
      assert.ok(meta.size > 0, unit.recoveredPath);
      const onDiskSha = await hashFile(recoveredAbs);
      assert.equal(onDiskSha, unit.sha256, unit.recoveredPath);
    }
  }

  const inventory = JSON.parse(await readFile(inventoryPath(repoRoot), "utf8"));
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.provenance.dmgSha256, dmgSha256);

  const payloadRoot = workPayloadDir(repoRoot);
  const againClassify = await classifyManusPayload(payloadRoot);
  assert.equal(againClassify.missingCategories.length, 0);
  const againUnits = await recoverUnits({ payloadRoot, resourcesPath: null, outDir: repoRoot });
  const withoutResources = result.recoveredUnits.filter((u) => !u.shippedPath.startsWith("Resources/"));
  assert.equal(
    JSON.stringify(inventoryIdentities(againUnits.filter((u) => !u.shippedPath.startsWith("Resources/")))),
    JSON.stringify(inventoryIdentities(withoutResources)),
  );
  assert.ok(identitiesFingerprint(result.inventory).length > 10);
});
