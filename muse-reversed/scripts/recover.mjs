import { recoverFromDmg } from "./lib/recover.mjs";
import { DEFAULT_DMG_PATH, repoRoot } from "./lib/paths.mjs";
import { identitiesFingerprint } from "./lib/inventory.mjs";

const args = process.argv.slice(2);
let dmgPath = DEFAULT_DMG_PATH;
let outDir = repoRoot;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dmg" && args[i + 1]) dmgPath = args[++i];
  else if (args[i] === "--out" && args[i + 1]) outDir = args[++i];
}

const result = await recoverFromDmg({ dmgPath, outDir });
const categories = Object.fromEntries(
  ["sandbox", "skills", "session", "computer"].map((id) => [
    id,
    result.inventory.units.filter((u) => u.category === id).length,
  ]),
);
console.log(`dmgSha256=${result.provenance.dmgSha256}`);
console.log(`payloadKind=${result.provenance.payload.kind}`);
console.log(`appVersion=${result.provenance.payload.app.shortVersion}`);
console.log(`bundleId=${result.provenance.payload.app.bundleId}`);
console.log(`primaryBundleSha256=${result.provenance.payload.primaryBundle.sha256}`);
console.log(`recoveredUnits=${result.inventory.units.length}`);
console.log(`categories=${JSON.stringify(categories)}`);
console.log(`missingCategories=${JSON.stringify(result.classification.missingCategories)}`);
console.log(`gaps=${JSON.stringify(result.classification.gaps.map((g) => g.mechanic))}`);
console.log(`identitiesFingerprint=${identitiesFingerprint(result.inventory).length}`);
console.log(`inventory=${outDir}/inventory.json`);
