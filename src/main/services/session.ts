import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Repo, SessionState } from '@shared/types'

export type LaunchMode = 'new' | 'switch'

interface InternalSession {
  repoId: string
  pids: number[]
  active: boolean
}

const sessions = new Map<string, InternalSession>()

// --- Spawn helpers ---

/**
 * Spawns a process using PowerShell Start-Process -PassThru to get a real PID.
 * Uses -EncodedCommand to avoid all quoting/escaping issues with paths.
 */
function spawnAndGetPid(executable: string, args: string[], directory: string): number | null {
  const argsPart =
    args.length > 0
      ? `-ArgumentList ${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(', ')} `
      : ''
  const psScript = `(Start-Process -FilePath '${executable.replace(/'/g, "''")}' ${argsPart}-WorkingDirectory '${directory.replace(/'/g, "''")}' -PassThru).Id`

  // Encode as UTF-16LE base64 — avoids all shell quoting issues
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64')

  try {
    const result = execSync(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
      encoding: 'utf-8',
      timeout: 8000
    })
    const pid = parseInt(result.trim(), 10)
    return !isNaN(pid) && pid > 0 ? pid : null
  } catch (err) {
    console.error(`[session] Failed to spawn '${executable}':`, err)
    return null
  }
}

function spawnVscodeWindow(directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] VSCode: directory not found: ${directory}`)
    return null
  }
  return spawnAndGetPid('code', ['--new-window', directory], directory)
}

function spawnTerminal(shell: string, directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] Terminal: directory not found: ${directory}`)
    return null
  }
  return spawnAndGetPid(shell, [], directory)
}

function killPid(pid: number): void {
  try {
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } catch {
    // Already exited — ignore
  }
}

// --- Public API ---

export function launchRepo(repo: Repo, mode: LaunchMode): SessionState {
  if (mode === 'switch') {
    for (const [repoId] of sessions) killRepo(repoId)
  }

  const pids: number[] = []

  for (const win of repo.vscodeWindows) {
    const pid = spawnVscodeWindow(win.directory)
    if (pid) pids.push(pid)
  }

  for (const term of repo.terminals) {
    const pid = spawnTerminal(term.shell, term.directory)
    if (pid) pids.push(pid)
  }

  const active = pids.length > 0
  sessions.set(repo.id, { repoId: repo.id, pids, active })
  return { repoId: repo.id, pids, active }
}

export function killRepo(repoId: string): void {
  const session = sessions.get(repoId)
  if (!session) return
  for (const pid of session.pids) killPid(pid)
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
