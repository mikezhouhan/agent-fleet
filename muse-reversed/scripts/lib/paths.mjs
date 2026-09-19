import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DEFAULT_DMG_PATH = "/Users/jasper/Downloads/Muse-2.0.dmg";

export const EXPECTED_DMG_SHA256 = "312d7dc024797a9bd9249b155cf03afd0af5ebdc412cc6635842b8fc78a99b80";

export const recoveredDir = (outDir = repoRoot) => path.join(outDir, "recovered");
export const inventoryPath = (outDir = repoRoot) => path.join(outDir, "inventory.json");
export const provenancePath = (outDir = repoRoot) => path.join(outDir, "provenance.json");
export const workPayloadDir = (outDir = repoRoot) => path.join(outDir, "work", "payload");
