export interface VSCodeWindow {
  id: string
  directory: string
}

export interface TerminalInstance {
  id: string
  shell: string
  directory: string
}

export interface Repo {
  id: string
  projectId: string
  name: string
  vscodeWindows: VSCodeWindow[]
  terminals: TerminalInstance[]
}

export interface Project {
  id: string
  name: string
  createdAt: string
  repos: Repo[]
}

export interface ConfigStore {
  projects: Project[]
}

// Session state — in-memory only, never persisted
export interface SessionState {
  repoId: string
  pids: number[]
  active: boolean
  warnings?: string[]
}
