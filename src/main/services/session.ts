import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Repo, SessionState } from '@shared/types'

export type LaunchMode = 'new' | 'switch'

interface InternalSession {
  repoId: string
  terminalPids: number[]  // terminal PIDs — killed with taskkill
  vscodePids: number[]    // Code.exe PIDs spawned for this window — killed with taskkill
  active: boolean
}

const sessions = new Map<string, InternalSession>()

// --- Spawn helpers ---

function runEncoded(psScript: string, timeoutMs = 8000): string {
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64')
  return execSync(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, {
    encoding: 'utf-8',
    timeout: timeoutMs
  })
}

function spawnVscodeWindow(directory: string): number[] {
  if (!existsSync(directory)) {
    console.warn(`[session] VSCode: directory not found: ${directory}`)
    return []
  }
  // Snapshot all Code.exe PIDs before launch
  const before = getAllCodePids()
  try {
    execSync(`code --new-window "${directory}"`, { shell: 'cmd.exe', stdio: 'ignore', timeout: 8000 })
  } catch (err) {
    console.warn('[session] VSCode launch error:', err)
    return []
  }
  // Wait for VS Code to spawn its renderer + extension host processes
  try {
    execSync('powershell.exe -NoProfile -Command "Start-Sleep -Seconds 3"', {
      stdio: 'ignore',
      timeout: 6000
    })
  } catch {}
  const after = getAllCodePids()
  return [...after].filter((pid) => !before.has(pid))
}

function getAllCodePids(): Set<number> {
  try {
    const script = `(Get-Process -Name 'Code' -ErrorAction SilentlyContinue).Id -join ','`
    const out = runEncoded(script, 5000)
    return new Set(
      out.trim().split(',').filter(Boolean).map(Number).filter((n) => n > 0)
    )
  } catch {
    return new Set()
  }
}

function spawnTerminal(shell: string, directory: string): number | null {
  if (!existsSync(directory)) {
    console.warn(`[session] Terminal: directory not found: ${directory}`)
    return null
  }
  const argsPart = `-WorkingDirectory '${directory.replace(/'/g, "''")}' `
  const psScript = `(Start-Process -FilePath '${shell.replace(/'/g, "''")}' ${argsPart}-PassThru).Id`
  try {
    const result = runEncoded(psScript)
    const pid = parseInt(result.trim(), 10)
    return pid > 0 ? pid : null
  } catch (err) {
    console.error(`[session] Terminal spawn error:`, err)
    return null
  }
}

function killPid(pid: number): void {
  try {
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } catch {
    // Already exited
  }
}

// --- Public API ---

export function launchRepo(repo: Repo, mode: LaunchMode): SessionState {
  if (mode === 'switch') {
    for (const [repoId] of sessions) killRepo(repoId)
  }

  const terminalPids: number[] = []
  let vscodePids: number[] = []
  const warnings: string[] = []

  for (const win of repo.vscodeWindows) {
    if (!existsSync(win.directory)) {
      warnings.push(`VSCode: directory not found: ${win.directory}`)
      continue
    }
    vscodePids = vscodePids.concat(spawnVscodeWindow(win.directory))
  }

  for (const term of repo.terminals) {
    if (!existsSync(term.directory)) {
      warnings.push(`Terminal: directory not found: ${term.directory}`)
      continue
    }
    const pid = spawnTerminal(term.shell, term.directory)
    if (pid) terminalPids.push(pid)
  }

  const allPids = [...vscodePids, ...terminalPids]
  const active = allPids.length > 0
  sessions.set(repo.id, { repoId: repo.id, terminalPids, vscodePids, active })
  return { repoId: repo.id, pids: allPids, active, warnings: warnings.length > 0 ? warnings : undefined }
}

export function killRepo(repoId: string): void {
  const session = sessions.get(repoId)
  if (!session) return
  for (const pid of session.vscodePids) killPid(pid)
  for (const pid of session.terminalPids) killPid(pid)
  sessions.delete(repoId)
}

export function killAllSessions(): void {
  for (const [repoId] of sessions) killRepo(repoId)
}

export function getSessionStatus(): SessionState[] {
  return Array.from(sessions.values()).map(({ repoId, terminalPids, vscodePids, active }) => ({
    repoId,
    pids: [...vscodePids, ...terminalPids],
    active
  }))
}

export function removeSession(repoId: string): void {
  sessions.delete(repoId)
}

export { sessions }
