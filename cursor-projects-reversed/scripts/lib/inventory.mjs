import { writeFile } from "node:fs/promises";
import { inventoryIdentities } from "./extract.mjs";

export function buildInventory({ provenance, classification, recoveredUnits }) {
  return {
    schemaVersion: 1,
    provenance,
    scannedFiles: classification.scannedFiles,
    missingCategories: classification.missingCategories,
    classification: classification.units.map((unit) => ({
      category: unit.category,
      shippedPath: unit.shippedPath,
      shippedSymbols: unit.shippedSymbols,
      bytes: unit.bytes,
    })),
    units: recoveredUnits.map((unit) => ({
      id: unit.id,
      category: unit.category,
      shippedPath: unit.shippedPath,
      shippedSymbols: unit.shippedSymbols,
      recoveredPath: unit.recoveredPath,
      sha256: unit.sha256,
      bytes: unit.bytes,
      byteRange: unit.byteRange,
      kind: unit.kind,
      truncated: unit.truncated === true,
    })),
    identities: inventoryIdentities(recoveredUnits),
  };
}

export async function writeInventory(filePath, inventory) {
  const text = `${JSON.stringify(inventory, null, 2)}\n`;
  await writeFile(filePath, text, "utf8");
  return text;
}

export function identitiesFingerprint(inventory) {
  return JSON.stringify(inventory.identities);
}
