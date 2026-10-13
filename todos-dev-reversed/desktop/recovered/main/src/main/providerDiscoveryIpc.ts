import { ipcMain } from 'electron'
import { discoverModels } from '@tds/core'
import { DESKTOP_IPC } from '@tds/types/desktop'
import { fromApp } from './ipc'
import { isDiscoverRequest } from './providerDiscovery'

// The page's probe of a custom provider's /models, run here instead: a local endpoint that answers
// curl but sends no CORS header is unreadable from the page and unreachable from the server.
export function installProviderDiscoveryIpc(): void {
  ipcMain.handle(DESKTOP_IPC.discoverModels, (e, r: unknown) => {
    if (!fromApp(e) || !isDiscoverRequest(r)) throw new Error('rejected')
    return discoverModels(r)
  })
}
