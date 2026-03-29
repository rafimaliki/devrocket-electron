import { contextBridge, ipcRenderer } from 'electron'
import type { Project, Repo, VSCodeWindow, TerminalInstance, SessionState } from '../shared/types'

export type LaunchMode = 'new' | 'switch'

const devrocketAPI = {
  projects: {
    list: (): Promise<Project[]> => ipcRenderer.invoke('projects:list'),
    create: (name: string): Promise<Project> => ipcRenderer.invoke('projects:create', name),
    update: (id: string, name: string): Promise<Project> =>
      ipcRenderer.invoke('projects:update', id, name),
    updateNotes: (id: string, notes: string): Promise<void> =>
      ipcRenderer.invoke('projects:update-notes', id, notes),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('projects:delete', id)
  },
  repos: {
    create: (
      projectId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<Repo> =>
      ipcRenderer.invoke('repos:create', projectId, name, vscodeWindows, terminals),
    update: (
      repoId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<Repo> =>
      ipcRenderer.invoke('repos:update', repoId, name, vscodeWindows, terminals),
    delete: (repoId: string): Promise<void> => ipcRenderer.invoke('repos:delete', repoId)
  },
  session: {
    launch: (repoId: string, mode: LaunchMode): Promise<SessionState> =>
      ipcRenderer.invoke('session:launch', repoId, mode),
    kill: (repoId: string): Promise<void> => ipcRenderer.invoke('session:kill', repoId),
    status: (): Promise<SessionState[]> => ipcRenderer.invoke('session:status'),
    onStatusUpdate: (
      callback: (update: { repoId: string; active: boolean }) => void
    ): (() => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        update: { repoId: string; active: boolean }
      ): void => callback(update)
      ipcRenderer.on('session:status-update', handler)
      // Return cleanup function
      return () => ipcRenderer.removeListener('session:status-update', handler)
    }
  },
  system: {
    checkVscode: (): Promise<boolean> => ipcRenderer.invoke('system:check-vscode'),
    pickDirectory: (): Promise<string | null> => ipcRenderer.invoke('system:pick-directory')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('devrocket', devrocketAPI)
  } catch (error) {
    console.error('[preload] contextBridge error:', error)
  }
} else {
  // @ts-ignore
  window.devrocket = devrocketAPI
}

export type DevrocketAPI = typeof devrocketAPI
