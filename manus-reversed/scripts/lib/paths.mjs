import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DEFAULT_DMG_PATH = "/Users/jasper/Downloads/Manus-Setup-1.7.6.dmg";

/** Plan-time SHA-256 of the named DMG. Tests re-hash the file on disk rather than trusting this blob. */
export const EXPECTED_DMG_SHA256 = "41e9915db4bde4ce3234deba5df6e762b1e2a73b5490abe35769c51a14c94ba0";

export const recoveredDir = (outDir = repoRoot) => path.join(outDir, "recovered");
export const inventoryPath = (outDir = repoRoot) => path.join(outDir, "inventory.json");
export const provenancePath = (outDir = repoRoot) => path.join(outDir, "provenance.json");
export const workPayloadDir = (outDir = repoRoot) => path.join(outDir, "work", "payload");
