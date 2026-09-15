import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { classifyProjectsPayload, CATEGORY_IDS } from "../scripts/lib/classify.mjs";
import {
  discoverProjectsModules,
  extractMarkerWindow,
  extractNamedModuleSlice,
  inventoryIdentities,
  MODULE_MAX_BYTES,
  recoverUnits,
} from "../scripts/lib/extract.mjs";
import { identitiesFingerprint } from "../scripts/lib/inventory.mjs";
import { hashFile } from "../scripts/lib/hash.mjs";
import { DEFAULT_DMG_PATH, EXPECTED_DMG_SHA256, inventoryPath, repoRoot, workPayloadDir } from "../scripts/lib/paths.mjs";
import { recoverFromDmg } from "../scripts/lib/recover.mjs";

test("hashFile of the named DMG matches the file on disk", async () => {
  const first = await hashFile(DEFAULT_DMG_PATH);
  const second = await hashFile(DEFAULT_DMG_PATH);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first, second);
  assert.equal(first, EXPECTED_DMG_SHA256);
  const metadata = await stat(DEFAULT_DMG_PATH);
  assert.equal(metadata.isFile(), true);
  assert.ok(metadata.size > 1000);
});

test("extractNamedModuleSlice and extractMarkerWindow drive the real slice functions", () => {
  const source = 'prefix O({"agentProjectService.js"(){"use strict";const k="glass.localAgentProjects.v1";}} ) trailing <pr_shared_context>hello</pr_shared_context>';
  const named = extractNamedModuleSlice(source, "agentProjectService.js", 80);
  assert.ok(named);
  assert.equal(named.start, source.indexOf('O({"agentProjectService.js"()'));
  assert.ok(named.text.includes("agentProjectService.js"));
  assert.ok(named.text.includes("glass.localAgentProjects.v1"));

  const window = extractMarkerWindow(source, "<pr_shared_context>", 12);
  assert.ok(window);
  assert.ok(window.text.includes("<pr_shared_context>"));
  assert.equal(window.hit, source.indexOf("<pr_shared_context>"));
});

test("discoverProjectsModules finds side-chat, agent-store, and archive factories in a synthetic bundle", () => {
  const source = [
    'O({"side-chats.ts"(){"use strict"}})',
    'O({"agent-store-ids.ts"(){const z="/cursor/stores"}})',
    'O({"unrelatedEditor.js"(){}})',
    'O({"ArchiveBackgroundComposer.js"(){}})',
  ].join("");
  const modules = discoverProjectsModules(source).map((row) => row.module);
  assert.ok(modules.includes("side-chats.ts"));
  assert.ok(modules.includes("agent-store-ids.ts"));
  assert.equal(modules.includes("unrelatedEditor.js"), false);
});

test("extractNamedModuleSlice extends to the next factory past the 48KiB cap", () => {
  const pad = "x".repeat(60_000);
  const source = `O({"cloudAgentRepositoryService.js"(){${pad}this.experimentService.checkFeatureGate("long")}})O({"explorerOrchestratorCacheService.js"(){}}`;
  const clipped = extractNamedModuleSlice(source, "cloudAgentRepositoryService.js", MODULE_MAX_BYTES);
  assert.equal(clipped.end - clipped.start, MODULE_MAX_BYTES);
  assert.equal(clipped.truncated, true);

  const slice = extractNamedModuleSlice(source, "cloudAgentRepositoryService.js");
  assert.equal(slice.truncated, false);
  assert.notEqual(slice.end - slice.start, MODULE_MAX_BYTES);
  assert.ok(slice.end - slice.start > MODULE_MAX_BYTES);
  assert.ok(slice.text.includes("this.experimentService.checkFeatureGate"));
  assert.equal(slice.text.includes('O({"explorerOrchestratorCacheService.js"()'), false);
});

test("recoverFromDmg classifies Projects units and writes recovered files + inventory", { timeout: 600_000 }, async () => {
  const dmgSha256 = await hashFile(DEFAULT_DMG_PATH);
  const result = await recoverFromDmg({ dmgPath: DEFAULT_DMG_PATH, outDir: repoRoot });

  assert.equal(result.provenance.dmgSha256, dmgSha256);
  assert.equal(result.provenance.dmgSha256, EXPECTED_DMG_SHA256);
  assert.equal(result.provenance.payload.kind, "unpacked-app");
  assert.ok(result.provenance.payload.primaryBundle?.sha256);
  assert.equal(result.classification.missingCategories.length, 0, result.classification.missingCategories.join(","));

  for (const category of CATEGORY_IDS) {
    const classified = result.classification.byCategory[category];
    assert.ok(classified.length >= 1, `classify missing ${category}`);
    assert.ok(classified[0].shippedPath.length > 0);
    assert.ok(classified[0].shippedSymbols.length > 0);

    const recovered = result.inventory.units.filter((unit) => unit.category === category);
    assert.ok(recovered.length >= 1, `recovered missing ${category}`);
    for (const unit of recovered) {
      assert.ok(unit.shippedPath, unit.id);
      assert.ok(unit.shippedSymbols.length, unit.id);
      assert.match(unit.recoveredPath, /^recovered\//);
      const recoveredAbs = path.join(repoRoot, unit.recoveredPath);
      const meta = await stat(recoveredAbs);
      assert.ok(meta.size > 0, unit.recoveredPath);
      const onDiskSha = await hashFile(recoveredAbs);
      assert.equal(onDiskSha, unit.sha256, unit.recoveredPath);
    }
  }

  const inventory = JSON.parse(await readFile(inventoryPath(repoRoot), "utf8"));
  const folded = new Map();
  for (const unit of inventory.units) {
    const key = unit.recoveredPath.toLowerCase();
    assert.equal(folded.has(key), false, `case-fold collision ${folded.get(key)} vs ${unit.recoveredPath}`);
    folded.set(key, unit.recoveredPath);
  }
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.provenance.dmgSha256, dmgSha256);
  assert.equal(inventory.units.length, result.inventory.units.length);
  for (const unit of inventory.units) {
    assert.equal(typeof unit.shippedPath, "string");
    assert.ok(unit.shippedPath.length > 0);
    assert.ok(Array.isArray(unit.shippedSymbols));
  }

  const payloadRoot = workPayloadDir(repoRoot);
  const againClassify = await classifyProjectsPayload(payloadRoot);
  assert.equal(againClassify.missingCategories.length, 0);
  const mustRecover = ["side-chats.ts", "agent-store-ids.ts", "agentStoreSubagentMount.js", "project-subagents.ts"];
  for (const name of mustRecover) {
    assert.ok(
      inventory.units.some((unit) => unit.shippedSymbols.includes(name) || unit.id.endsWith(`:${name}`)),
      `full reverse missing ${name}`,
    );
  }

  const repoService = inventory.units.find((unit) => unit.id.endsWith(":cloudAgentRepositoryService.js"));
  assert.ok(repoService, "cloudAgentRepositoryService.js must be recovered");
  const repoSpan = repoService.byteRange[1] - repoService.byteRange[0];
  assert.notEqual(repoSpan, MODULE_MAX_BYTES);
  assert.ok(repoSpan > MODULE_MAX_BYTES, `cloudAgentRepositoryService span ${repoSpan}`);
  assert.equal(repoService.truncated, false);
  const repoText = await readFile(path.join(repoRoot, repoService.recoveredPath), "utf8");
  const repoBody = repoText.split("\n").filter((line) => !line.startsWith("//")).join("\n").trim();
  assert.equal(repoBody.endsWith("this.experimentService.checkFeature"), false);
  assert.ok(repoText.includes("cloudAgentRepositoryService.js"));

  async function recoveredHits(symbol) {
    const hits = [];
    for (const unit of inventory.units) {
      const text = await readFile(path.join(repoRoot, unit.recoveredPath), "utf8");
      if (text.includes(symbol)) hits.push(unit.recoveredPath);
    }
    return hits;
  }
  for (const symbol of ["connect_slack", "Connect Slack", "IngestConversationRequest", "promptUploadRef"]) {
    const hits = await recoveredHits(symbol);
    assert.ok(hits.length >= 1, `recovered tree missing ${symbol}`);
  }

  const againUnits = await recoverUnits({ payloadRoot, outDir: repoRoot });
  assert.equal(JSON.stringify(inventoryIdentities(againUnits)), JSON.stringify(inventoryIdentities(result.recoveredUnits)));
  assert.equal(identitiesFingerprint({ identities: inventoryIdentities(againUnits) }), identitiesFingerprint(result.inventory));

  const review = await readFile(path.join(repoRoot, "SECURITY-REVIEW.md"), "utf8");
  assert.equal(review.includes("recovered/") && /recovered\/\S+slackConnect\.js/.test(review), false);
  assert.equal(/recovered\/\S+cloudAgentPromptUpload\.js/.test(review), false);
  const cited = [...review.matchAll(/recovered\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+/g)].map((m) => m[0]);
  assert.ok(cited.length >= 8, "security review should cite recovered paths");
  for (const relative of new Set(cited)) {
    const onDisk = inventory.units.some((unit) => unit.recoveredPath === relative || unit.recoveredPath.startsWith(`${relative}/`));
    const fileOk = await stat(path.join(repoRoot, relative)).then(() => true, () => false);
    assert.ok(onDisk || fileOk, `citation missing from inventory/tree: ${relative}`);
  }
  const citationMustContain = [
    ["aiSettingsService.js", "cursor.connectSlack"],
    ["connect_slack.slice.js", "connect_slack"],
    ["Connect-Slack.slice.js", "Connect Slack"],
    ["analytics_pb.js", "IngestConversationRequest"],
    ["pendingReadOverride.js", "promptUploadRef"],
  ];
  for (const [fileName, symbol] of citationMustContain) {
    const citedPath = cited.find((relative) => relative.endsWith(`/${fileName}`));
    assert.ok(citedPath, `review must cite recovered ${fileName}`);
    const text = await readFile(path.join(repoRoot, citedPath), "utf8");
    assert.ok(text.includes(symbol), `${citedPath} missing ${symbol}`);
  }
});
