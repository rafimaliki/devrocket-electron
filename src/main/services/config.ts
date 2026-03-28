import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, renameSync, copyFileSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { ConfigStore, Project, Repo, VSCodeWindow, TerminalInstance } from '@shared/types'

const DATA_DIR = app.getPath('userData')
const STORE_PATH = join(DATA_DIR, 'projects.json')
const BACKUP_PATH = join(DATA_DIR, 'projects.json.bak')
const TMP_PATH = join(DATA_DIR, 'projects.tmp.json')

function ensureStore(): ConfigStore {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const empty: ConfigStore = { projects: [] }
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf-8')) as ConfigStore
  } catch {
    // Corrupt file — restore from backup if available
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, STORE_PATH)
      return JSON.parse(readFileSync(STORE_PATH, 'utf-8')) as ConfigStore
    }
    const empty: ConfigStore = { projects: [] }
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
}

function saveStore(store: ConfigStore): void {
  // Atomic write: write to tmp, backup current, then rename tmp → store
  writeFileSync(TMP_PATH, JSON.stringify(store, null, 2), 'utf-8')
  if (existsSync(STORE_PATH)) copyFileSync(STORE_PATH, BACKUP_PATH)
  renameSync(TMP_PATH, STORE_PATH)
}

// --- Projects ---

export function listProjects(): Project[] {
  return ensureStore().projects
}

export function createProject(name: string): Project {
  const store = ensureStore()
  const project: Project = {
    id: randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    repos: []
  }
  store.projects.push(project)
  saveStore(store)
  return project
}

export function updateProject(id: string, name: string): Project {
  const store = ensureStore()
  const project = store.projects.find((p) => p.id === id)
  if (!project) throw new Error(`Project not found: ${id}`)
  project.name = name
  saveStore(store)
  return project
}

export function deleteProject(id: string): void {
  const store = ensureStore()
  store.projects = store.projects.filter((p) => p.id !== id)
  saveStore(store)
}

// --- Repos ---

export function createRepo(
  projectId: string,
  name: string,
  vscodeWindows: Omit<VSCodeWindow, 'id'>[],
  terminals: Omit<TerminalInstance, 'id'>[]
): Repo {
  const store = ensureStore()
  const project = store.projects.find((p) => p.id === projectId)
  if (!project) throw new Error(`Project not found: ${projectId}`)

  const repo: Repo = {
    id: randomUUID(),
    projectId,
    name,
    vscodeWindows: vscodeWindows.map((w) => ({ ...w, id: randomUUID() })),
    terminals: terminals.map((t) => ({ ...t, id: randomUUID() }))
  }
  project.repos.push(repo)
  saveStore(store)
  return repo
}

export function updateRepo(
  repoId: string,
  name: string,
  vscodeWindows: Omit<VSCodeWindow, 'id'>[],
  terminals: Omit<TerminalInstance, 'id'>[]
): Repo {
  const store = ensureStore()
  for (const project of store.projects) {
    const idx = project.repos.findIndex((r) => r.id === repoId)
    if (idx !== -1) {
      project.repos[idx] = {
        ...project.repos[idx],
        name,
        vscodeWindows: vscodeWindows.map((w) => ({ ...w, id: randomUUID() })),
        terminals: terminals.map((t) => ({ ...t, id: randomUUID() }))
      }
      saveStore(store)
      return project.repos[idx]
    }
  }
  throw new Error(`Repo not found: ${repoId}`)
}

export function deleteRepo(repoId: string): void {
  const store = ensureStore()
  for (const project of store.projects) {
    const before = project.repos.length
    project.repos = project.repos.filter((r) => r.id !== repoId)
    if (project.repos.length !== before) {
      saveStore(store)
      return
    }
  }
  throw new Error(`Repo not found: ${repoId}`)
}
