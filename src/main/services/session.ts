import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Repo, SessionState } from '@shared/types'

export type LaunchMode = 'new' | 'switch'

interface InternalSession {
  repoId: string
  pids: number[]             // terminal PIDs — killed with taskkill
  vscodeDirectories: string[] // VSCode dirs — closed by window title at kill time
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

function spawnVscodeWindow(directory: string): boolean {
  if (!existsSync(directory)) {
    console.warn(`[session] VSCode: directory not found: ${directory}`)
    return false
  }
  try {
    execSync(`code --new-window "${directory}"`, { shell: true, stdio: 'ignore', timeout: 8000 })
    return true
  } catch (err) {
    console.warn('[session] VSCode launch error:', err)
    return false
  }
}

function closeVscodeWindow(directory: string): void {
  // Match on both the full path and just the folder name — handles custom VS Code title formats.
  // Use EnumWindows to find all visible windows owned by Code.exe and close the matching one.
  const folderName = directory.split(/[\\/]/).filter(Boolean).pop() ?? ''
  const escapedDir = directory.replace(/\\/g, '\\\\').replace(/'/g, "''")
  const escapedFolder = folderName.replace(/'/g, "''")

  const script = `
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class DR {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWndProc e, IntPtr p);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern IntPtr PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  public delegate bool EnumWndProc(IntPtr h, IntPtr p);
  public static void Close(string[] patterns, uint[] pids) {
    var ps = new HashSet<uint>(pids);
    EnumWindows((hWnd, _) => {
      if (!IsWindowVisible(hWnd)) return true;
      var sb = new StringBuilder(512); GetWindowText(hWnd, sb, 512);
      string t = sb.ToString();
      uint pid; GetWindowThreadProcessId(hWnd, out pid);
      if (ps.Contains(pid)) {
        foreach (var p in patterns) {
          if (t.IndexOf(p, StringComparison.OrdinalIgnoreCase) >= 0) {
            PostMessage(hWnd, 0x0010, IntPtr.Zero, IntPtr.Zero); return true;
          }
        }
      }
      return true;
    }, IntPtr.Zero);
  }
}
"@ -ErrorAction SilentlyContinue
$pids = (Get-Process Code -ErrorAction SilentlyContinue).Id
if ($pids) { [DR]::Close(@('${escapedFolder}', '${escapedDir}'), $pids) }
`
  try {
    runEncoded(script, 8000)
  } catch {
    // Best effort
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

  const pids: number[] = []
  const vscodeDirectories: string[] = []

  for (const win of repo.vscodeWindows) {
    if (spawnVscodeWindow(win.directory)) {
      vscodeDirectories.push(win.directory)
    }
  }

  for (const term of repo.terminals) {
    const pid = spawnTerminal(term.shell, term.directory)
    if (pid) pids.push(pid)
  }

  const active = vscodeDirectories.length > 0 || pids.length > 0
  sessions.set(repo.id, { repoId: repo.id, pids, vscodeDirectories, active })
  return { repoId: repo.id, pids, active }
}

export function killRepo(repoId: string): void {
  const session = sessions.get(repoId)
  if (!session) return
  for (const dir of session.vscodeDirectories) closeVscodeWindow(dir)
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
