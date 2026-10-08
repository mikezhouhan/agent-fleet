import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from 'electron'
import { DESKTOP_IPC, type DesktopImportRequest } from '@tds/types/desktop'
import { fromApp } from './ipc'
import { importFolder, inspectFolder, isGitMissing } from './localImport'
import { prefetchShellEnv } from './machine/worker'
import { mergeChildEnv } from './machine/shellEnv'

// Only a folder the user picked in this run may be pushed: the page names the dir, the shell
// decides whether it was ever offered.
const picked = new Set<string>()

async function gitEnv(): Promise<NodeJS.ProcessEnv> {
  return mergeChildEnv(process.env, await prefetchShellEnv(), {})
}

function isImportRequest(r: unknown): r is DesktopImportRequest {
  const o = r as Record<string, unknown> | null
  const author = o?.author as Record<string, unknown> | undefined
  return !!o
    && ['dir', 'repoUrl', 'token', 'defaultBranch'].every((k) => typeof o[k] === 'string' && o[k] !== '')
    && typeof author?.name === 'string' && typeof author?.email === 'string'
}

export function installLocalImportIpc(): void {
  ipcMain.handle(DESKTOP_IPC.localImportPick, async (e) => {
    if (!fromApp(e)) throw new Error('rejected')
    const options: OpenDialogOptions = { properties: ['openDirectory', 'createDirectory'] }
    const win = BrowserWindow.fromWebContents(e.sender)
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    const dir = result.canceled ? undefined : result.filePaths[0]
    if (!dir) return null
    try {
      const inspection = await inspectFolder(dir, await gitEnv())
      picked.add(dir)
      return inspection
    } catch (err) {
      // The page matches on the code; electron wraps the message as it crosses the bridge.
      throw new Error(isGitMissing(err) ? 'git_missing' : 'inspect_failed')
    }
  })
  ipcMain.handle(DESKTOP_IPC.localImportPush, async (e, r: unknown) => {
    if (!fromApp(e) || !isImportRequest(r) || !picked.has(r.dir)) throw new Error('rejected')
    return importFolder(r, await gitEnv())
  })
}
