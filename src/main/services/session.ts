import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Repo, SessionState } from '@shared/types'

// In-memory PID map — keyed by repoId
const sessions = new Map<string, SessionState>()

export type LaunchMode = 'new' | 'switch'

// --- Spawn helpers ---

function spawnVscodeWindow(directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] VSCode: directory not found: ${directory}`)
    return null
  }
  const proc = spawn('code', ['--new-window', directory], {
    shell: true,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  })
  proc.unref()
  return proc.pid ?? null
}

function spawnTerminal(shell: string, directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] Terminal: directory not found: ${directory}`)
    return null
  }
  const proc = spawn(shell, [], {
    cwd: directory,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  })
  proc.unref()
  return proc.pid ?? null
}

function killPid(pid: number): void {
  try {
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } catch {
    // Process may have already exited — ignore
  }
}

// --- Public API ---

export function launchRepo(repo: Repo, mode: LaunchMode): SessionState {
  if (mode === 'switch') {
    // Kill all active sessions before launching
    for (const [repoId] of sessions) {
      killRepo(repoId)
    }
  }

  const pids: number[] = []

  // Spawn all VSCode windows in parallel
  for (const win of repo.vscodeWindows) {
    const pid = spawnVscodeWindow(win.directory)
    if (pid) pids.push(pid)
  }

  // Spawn all terminal instances in parallel
  for (const term of repo.terminals) {
    const pid = spawnTerminal(term.shell, term.directory)
    if (pid) pids.push(pid)
  }

  const state: SessionState = { repoId: repo.id, pids, active: pids.length > 0 }
  sessions.set(repo.id, state)
  return state
}

export function killRepo(repoId: string): void {
  const state = sessions.get(repoId)
  if (!state) return
  for (const pid of state.pids) {
    killPid(pid)
  }
  sessions.delete(repoId)
}

export function killAllSessions(): void {
  for (const [repoId] of sessions) {
    killRepo(repoId)
  }
}

export function getSessionStatus(): SessionState[] {
  return Array.from(sessions.values())
}

export function updateSessionState(repoId: string, pids: number[], active: boolean): void {
  if (sessions.has(repoId)) {
    sessions.set(repoId, { repoId, pids, active })
  }
}

export function removeSession(repoId: string): void {
  sessions.delete(repoId)
}

export { sessions }
