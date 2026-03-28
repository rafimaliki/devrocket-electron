import { contextBridge, ipcRenderer } from 'electron'
import type { Project, Repo, VSCodeWindow, TerminalInstance, SessionState } from '../shared/types'

const devrocketAPI = {
  projects: {
    list: (): Promise<Project[]> => ipcRenderer.invoke('projects:list'),
    create: (name: string): Promise<Project> => ipcRenderer.invoke('projects:create', name),
    update: (id: string, name: string): Promise<Project> =>
      ipcRenderer.invoke('projects:update', id, name),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('projects:delete', id)
  },
  repos: {
    create: (
      projectId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<Repo> => ipcRenderer.invoke('repos:create', projectId, name, vscodeWindows, terminals),
    update: (
      repoId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<Repo> => ipcRenderer.invoke('repos:update', repoId, name, vscodeWindows, terminals),
    delete: (repoId: string): Promise<void> => ipcRenderer.invoke('repos:delete', repoId)
  },
  session: {
    // Populated in Phase 3
    launch: null as unknown,
    kill: null as unknown,
    status: null as unknown,
    onStatusUpdate: null as unknown
  },
  system: {
    checkVscode: (): Promise<boolean> => ipcRenderer.invoke('system:check-vscode')
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
