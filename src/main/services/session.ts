import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Repo, SessionState } from '@shared/types'

export type LaunchMode = 'new' | 'switch'

// Internal state — extends SessionState with terminal window titles for kill-by-title
interface InternalSession {
  repoId: string
  pids: number[]            // VSCode PIDs (for liveness tracking)
  terminalTitles: string[]  // Window titles used to kill terminals
  active: boolean
}

const sessions = new Map<string, InternalSession>()

// --- Spawn helpers ---

function spawnVscodeWindow(directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] VSCode: directory not found: ${directory}`)
    return null
  }
  const proc = spawn('code', ['--new-window', directory], {
    shell: true,
    detached: true,
    stdio: 'ignore'
  })
  proc.unref()
  return proc.pid ?? null
}

function spawnTerminal(shell: string, directory: string, title: string): boolean {
  if (!existsSync(directory)) {
    console.warn(`[session] Terminal: directory not found: ${directory}`)
    return false
  }
  // On Windows, `start "title" shell` opens a new visible console window.
  // The title MUST be quoted in the cmd string — spawn args are unquoted so cmd treats an
  // unquoted first arg as the executable, not the title. Pass as one shell string instead.
  spawn('cmd.exe', ['/c', `start "${title}" ${shell}`], {
    cwd: directory,
    stdio: 'ignore'
  }).unref()
  return true
}

function killPid(pid: number): void {
  try {
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } catch {
    // Process may have already exited
  }
}

function killByTitle(title: string): void {
  try {
    execSync(`taskkill /F /FI "WINDOWTITLE eq ${title}*"`, { stdio: 'ignore' })
  } catch {
    // No matching window — ignore
  }
}

// --- Public API ---

export function launchRepo(repo: Repo, mode: LaunchMode): SessionState {
  if (mode === 'switch') {
    for (const [repoId] of sessions) {
      killRepo(repoId)
    }
  }

  const pids: number[] = []
  const terminalTitles: string[] = []

  for (const win of repo.vscodeWindows) {
    const pid = spawnVscodeWindow(win.directory)
    if (pid) pids.push(pid)
  }

  repo.terminals.forEach((term, i) => {
    const title = `devrocket-${repo.id.slice(0, 8)}-t${i}`
    const launched = spawnTerminal(term.shell, term.directory, title)
    if (launched) terminalTitles.push(title)
  })

  const active = pids.length > 0 || terminalTitles.length > 0
  const session: InternalSession = { repoId: repo.id, pids, terminalTitles, active }
  sessions.set(repo.id, session)

  return { repoId: repo.id, pids, active }
}

export function killRepo(repoId: string): void {
  const session = sessions.get(repoId)
  if (!session) return
  for (const pid of session.pids) killPid(pid)
  for (const title of session.terminalTitles) killByTitle(title)
  sessions.delete(repoId)
}

export function killAllSessions(): void {
  for (const [repoId] of sessions) killRepo(repoId)
}

export function getSessionStatus(): SessionState[] {
  return Array.from(sessions.values()).map(({ repoId, pids, active }) => ({
    repoId,
    pids,
    active
  }))
}

export function removeSession(repoId: string): void {
  sessions.delete(repoId)
}

export { sessions }
