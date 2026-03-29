import { ipcMain } from 'electron'
import { launchRepo, killRepo, getSessionStatus } from '../services/session'
import { listProjects, touchProjectLastOpened } from '../services/config'
import type { LaunchMode } from '../services/session'

export function registerSessionHandlers(): void {
  ipcMain.handle('session:launch', (_event, repoId: string, mode: LaunchMode) => {
    // Find the repo config from store
    const projects = listProjects()
    let repo: (typeof projects)[0]['repos'][0] | null = null
    let parentProjectId: string | null = null
    for (const project of projects) {
      const found = project.repos.find((r) => r.id === repoId)
      if (found) {
        repo = found
        parentProjectId = project.id
        break
      }
    }
    if (!repo) throw new Error(`Repo not found: ${repoId}`)
    const result = launchRepo(repo, mode)
    if (parentProjectId) touchProjectLastOpened(parentProjectId)
    return result
  })

  ipcMain.handle('session:kill', (_event, repoId: string) => {
    killRepo(repoId)
  })

  ipcMain.handle('session:status', () => {
    return getSessionStatus()
  })
}
