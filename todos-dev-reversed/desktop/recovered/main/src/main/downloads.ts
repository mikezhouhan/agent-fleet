import { existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { app, type Session } from 'electron'

// A repo file or attachment download lands in ~/Downloads without a dialog, the way a browser's
// default does; the Dock bounces when it is there.
function uniqueName(dir: string, name: string): string {
  const ext = extname(name)
  const stem = basename(name, ext)
  let candidate = name
  for (let i = 2; existsSync(join(dir, candidate)); i++) candidate = `${stem} (${i})${ext}`
  return candidate
}

export function installDownloads(ses: Session): void {
  ses.on('will-download', (_event, item) => {
    const dir = app.getPath('downloads')
    const path = join(dir, uniqueName(dir, item.getFilename() || 'download'))
    item.setSavePath(path)
    item.once('done', (_e, state) => {
      if (state === 'completed') app.dock?.downloadFinished(path)
    })
  })
}
