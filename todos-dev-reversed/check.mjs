import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const root = new URL("./", import.meta.url);
const cli = readFileSync(new URL("cli/dist/index.js", root));
const sha = createHash("sha256").update(cli).digest("hex");
assert.equal(sha, "6753d4ff4a494cf6195b6a48b1d67b6bea3598211465fa84e9394dc961b2494f");

const text = cli.toString("utf8");
for (const needle of [
  "async function enrollViaDeviceFlow",
  "async function enrollViaApiKey",
  "var PollClient = class",
  "var EXTERNAL_RUNTIMES =",
  "async function prepareConversationWorkspace",
  "function startHeartbeat",
  "function acpAutoReply",
]) {
  assert.ok(text.includes(needle), needle);
}

const pkg = JSON.parse(readFileSync(new URL("cli/package.json", root), "utf8"));
assert.equal(pkg.name, "@todos-dev/cli");
assert.equal(pkg.version, "0.1.60");

const desktop = JSON.parse(readFileSync(new URL("desktop/package.json", root), "utf8"));
assert.equal(desktop.name, "@tds/desktop");
assert.equal(desktop.version, "0.1.12");

const worker = readFileSync(new URL("desktop/recovered/main/src/main/machine/worker.ts", root), "utf8");
assert.match(worker, /export async function forkWorker/);
const localApp = readFileSync(new URL("desktop/recovered/main/src/main/localApp.ts", root), "utf8");
assert.match(localApp, /export function installLocalApp/);

const index = JSON.parse(readFileSync(new URL("cli/module-index.json", root), "utf8"));
for (const file of ["src/PollClient.ts", "src/lib/enroll.ts", "src/machine.ts", "src/lib/externalRuntimes.ts"]) {
  assert.ok(index.files[file]?.length, file);
}

console.log(`ok cli@${pkg.version} sha256=${sha} desktop@${desktop.version}`);
