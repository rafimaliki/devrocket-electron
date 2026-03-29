import { ipcMain } from 'electron'
import {
  listProjects,
  createProject,
  updateProject,
  updateProjectNotes,
  deleteProject,
  createRepo,
  updateRepo,
  deleteRepo
} from '../services/config'

export function registerConfigHandlers(): void {
  ipcMain.handle('projects:list', () => {
    return listProjects()
  })

  ipcMain.handle('projects:create', (_event, name: string) => {
    return createProject(name)
  })

  ipcMain.handle('projects:update', (_event, id: string, name: string) => {
    return updateProject(id, name)
  })

  ipcMain.handle('projects:update-notes', (_event, id: string, notes: string) => {
    updateProjectNotes(id, notes)
  })

  ipcMain.handle('projects:delete', (_event, id: string) => {
    deleteProject(id)
  })

  ipcMain.handle(
    'repos:create',
    (_event, projectId: string, name: string, vscodeWindows, terminals) => {
      return createRepo(projectId, name, vscodeWindows, terminals)
    }
  )

  ipcMain.handle('repos:update', (_event, repoId: string, name: string, vscodeWindows, terminals) => {
    return updateRepo(repoId, name, vscodeWindows, terminals)
  })

  ipcMain.handle('repos:delete', (_event, repoId: string) => {
    deleteRepo(repoId)
  })
}
