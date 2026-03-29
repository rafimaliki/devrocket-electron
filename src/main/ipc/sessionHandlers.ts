import { ipcMain } from 'electron'
import { launchRepo, killRepo, getSessionStatus } from '../services/session'
import { listProjects } from '../services/config'
import type { LaunchMode } from '../services/session'

export function registerSessionHandlers(): void {
  ipcMain.handle('session:launch', (_event, repoId: string, mode: LaunchMode) => {
    // Find the repo config from store
    const projects = listProjects()
    let repo: (typeof projects)[0]['repos'][0] | null = null
    for (const project of projects) {
      const found = project.repos.find((r) => r.id === repoId)
      if (found) {
        repo = found
        break
      }
    }
    if (!repo) throw new Error(`Repo not found: ${repoId}`)
    return launchRepo(repo, mode)
  })

  ipcMain.handle('session:kill', (_event, repoId: string) => {
    killRepo(repoId)
  })

  ipcMain.handle('session:status', () => {
    return getSessionStatus()
  })
}
