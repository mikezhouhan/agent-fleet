import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function attachDmg(dmgPath) {
  const mountPoint = await mkdtemp(path.join(tmpdir(), "manus-dmg-"));
  let attached = false;
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await execFileAsync("hdiutil", ["attach", "-readonly", "-nobrowse", "-mountpoint", mountPoint, dmgPath], {
        maxBuffer: 16 * 1024 * 1024,
      });
      attached = true;
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      const detail = `${error.stderr?.toString?.() || error.message}`;
      if (!/资源忙|busy/i.test(detail) || attempt === 5) break;
      await sleep(1000 * attempt);
    }
  }
  if (!attached) {
    await rm(mountPoint, { recursive: true, force: true });
    const detail = lastError?.stderr?.toString?.() || lastError?.message || "unknown error";
    throw new Error(`hdiutil attach failed for ${dmgPath}: ${detail}`);
  }
  return { mountPoint, attached };
}

export async function detachDmg(mount) {
  if (!mount?.attached || !mount.mountPoint) return;
  try {
    await execFileAsync("hdiutil", ["detach", mount.mountPoint, "-force"], { maxBuffer: 1024 * 1024 });
  } finally {
    await rm(mount.mountPoint, { recursive: true, force: true }).catch(() => {});
  }
}

export function findManusApp(mountPoint) {
  return path.join(mountPoint, "Manus.app");
}
