import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DEFAULT_DMG_PATH = "/Users/jasper/Downloads/Cursor-darwin-arm64.dmg";

/** Plan-time SHA-256 of the named DMG. Tests re-hash the file on disk rather than trusting this blob. */
export const EXPECTED_DMG_SHA256 = "a3cf86050ea4c322b8a63fa840f35a54318c46da9b33281c2b223a17e473c738";

export const recoveredDir = (outDir = repoRoot) => path.join(outDir, "recovered");
export const inventoryPath = (outDir = repoRoot) => path.join(outDir, "inventory.json");
export const provenancePath = (outDir = repoRoot) => path.join(outDir, "provenance.json");
export const workPayloadDir = (outDir = repoRoot) => path.join(outDir, "work", "payload");
