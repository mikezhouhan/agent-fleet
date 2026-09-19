import { recoverFromDmg } from "./lib/recover.mjs";
import { DEFAULT_DMG_PATH, repoRoot } from "./lib/paths.mjs";
import { identitiesFingerprint } from "./lib/inventory.mjs";

const args = process.argv.slice(2);
let dmgPath = DEFAULT_DMG_PATH;
let outDir = repoRoot;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dmg" && args[i + 1]) dmgPath = args[++i];
  else if (args[i] === "--out" && args[i + 1]) outDir = args[++i];
  else if (args[i] === "--help") {
    console.log("Usage: node scripts/recover.mjs [--dmg PATH] [--out DIR]");
    process.exit(0);
  }
}

const result = await recoverFromDmg({ dmgPath, outDir });
const units = result.inventory.units.length;
const categories = Object.fromEntries(
  ["sandbox", "skills", "mcp", "session"].map((id) => [
    id,
    result.inventory.units.filter((u) => u.category === id).length,
  ]),
);

console.log(`dmgSha256=${result.provenance.dmgSha256}`);
console.log(`payloadKind=${result.provenance.payload.kind}`);
console.log(`appVersion=${result.provenance.payload.app.shortVersion}`);
console.log(`asarSha256=${result.provenance.payload.asarSha256}`);
console.log(`asarEntries=${result.provenance.payload.asarEntryCount}`);
console.log(`recoveredUnits=${units}`);
console.log(`categories=${JSON.stringify(categories)}`);
console.log(`missingCategories=${JSON.stringify(result.classification.missingCategories)}`);
console.log(`gaps=${JSON.stringify(result.classification.gaps)}`);
console.log(`identitiesFingerprint=${identitiesFingerprint(result.inventory).length}`);
console.log(`inventory=${outDir.replace(/\\/g, "/")}/inventory.json`);
