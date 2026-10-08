import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { win32 } from "node:path"

// Which shell the build agent's `bash` tool runs commands through on Windows. The SDK's own
// resolution checks two hardcoded Program Files paths and otherwise takes the first bash.exe on
// PATH — which is `C:\Windows\System32\bash.exe`, Windows' WSL launcher, not Git Bash. On a machine
// with no distro installed that stub exits with HCS/ERROR_PATH_NOT_FOUND before the command it was
// handed ever runs, so every git call the agent makes dies, and the merge turn (buildPrompts'
// `git merge origin/<base>`) can never complete no matter how often it is retried.
//
// Mirrors tds-tunnel/winshell.go, which picks the shell for remote_shell's PTY. This one stops at
// "a real bash or nothing": the SDK's tool is bash-shaped (`-c`, Unix commands in its description),
// so handing it PowerShell would trade one confusing failure for another.

const WSL_BASH_LAUNCHER = /^[a-z]:\\windows\\(?:system32|sysnative|syswow64)\\bash\.exe$/

export function isWslBashLauncher(path: string): boolean {
  return WSL_BASH_LAUNCHER.test(path.replace(/\//g, "\\").toLowerCase())
}

export interface ShellProbe {
  lookPath: (cmd: string) => string | null
  isFile: (path: string) => boolean
  getenv: (name: string) => string | undefined
}

// Git Bash from git's own location first: the machine already requires git on PATH
// (assertGitUsable), and asking PATH for bash.exe up front is what hands us WSL.
export function pickAgentBash(probe: ShellProbe): string | null {
  // Git for Windows ships bash at <root>\bin\bash.exe while git.exe sits in <root>\cmd (or <root>\bin).
  const git = probe.lookPath("git")
  if (git) {
    const bash = win32.join(win32.dirname(win32.dirname(git)), "bin", "bash.exe")
    if (probe.isFile(bash)) return bash
  }
  // Default install locations, for a git reached through a shim whose directory says nothing
  // about where the install root is (scoop, winget links).
  for (const root of [probe.getenv("ProgramFiles"), probe.getenv("ProgramFiles(x86)")]) {
    if (!root) continue
    const bash = win32.join(root, "Git", "bin", "bash.exe")
    if (probe.isFile(bash)) return bash
  }
  // Anything else on PATH (Cygwin, MSYS2) — but never the WSL launcher.
  const onPath = probe.lookPath("bash.exe")
  return onPath && !isWslBashLauncher(onPath) ? onPath : null
}

function whereExe(cmd: string): string | null {
  const res = spawnSync("where", [cmd], { encoding: "utf-8", timeout: 5_000, windowsHide: true })
  if (res.status !== 0 || !res.stdout) return null
  const first = res.stdout.trim().split(/\r?\n/)[0]
  return first && existsSync(first) ? first : null
}

// Resolved once per process: `where` spawns a subprocess, and the answer cannot change while the
// daemon runs. undefined off Windows and when no real bash exists — the caller leaves shellPath
// unset and the SDK falls back to whatever it finds.
let resolved: string | null | undefined
export function agentShellPath(): string | undefined {
  if (process.platform !== "win32") return undefined
  // A pinned bash can vanish while the daemon runs (a Git for Windows upgrade or uninstall replaces
  // the install dir), and the SDK throws on a shellPath that no longer exists — re-probe instead of
  // staying wedged on a dead path. A cached null stays cached: probing spawns `where`.
  if (resolved != null && !existsSync(resolved)) resolved = undefined
  if (resolved === undefined) {
    resolved = pickAgentBash({ lookPath: whereExe, isFile: existsSync, getenv: (k) => process.env[k] })
  }
  return resolved ?? undefined
}

// Startup line so a machine that will fail every shell command says so once, up front, instead of
// only inside a failed build's transcript.
export function logAgentShell(): void {
  if (process.platform !== "win32") return
  const shell = agentShellPath()
  if (shell) {
    console.log(`[machine] Agent shell: ${shell}`)
    return
  }
  console.warn(
    "[machine] No Git Bash found — the agent's shell will fall back to whatever bash.exe is on PATH. " +
      "If that is C:\\Windows\\System32\\bash.exe (Windows' WSL launcher), every shell command in a " +
      "build will fail. Install Git for Windows, or put a real bash ahead of System32 on PATH.",
  )
}
