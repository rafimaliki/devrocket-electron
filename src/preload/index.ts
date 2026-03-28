import { contextBridge, ipcRenderer } from 'electron'

const devrocketAPI = {
  // Config channels — populated in Phase 2
  projects: {},
  repos: {},
  // Session channels — populated in Phase 3
  session: {},
  // System channels — populated in Phase 2
  system: {}
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

export { ipcRenderer }
