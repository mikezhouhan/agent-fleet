import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

export function sha256Buffer(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

export async function hashFile(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

export async function fileIdentity(filePath) {
  const [digest, metadata] = await Promise.all([hashFile(filePath), stat(filePath)]);
  return { path: filePath, sha256: digest, bytes: metadata.size };
}
