import { BrowserWindow } from 'electron'
import { sessions, removeSession } from './session'

const POLL_INTERVAL_MS = 3000
let pollTimer: ReturnType<typeof setInterval> | null = null

function isPidAlive(pid: number): boolean {
  try {
    // Signal 0 tests process existence without sending a real signal
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function sendStatusUpdate(repoId: string, active: boolean): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('session:status-update', { repoId, active })
    }
  }
}

function pollSessions(): void {
  for (const [repoId, state] of sessions) {
    if (!state.active) continue

    const allDead = state.pids.every((pid) => !isPidAlive(pid))
    if (allDead) {
      removeSession(repoId)
      sendStatusUpdate(repoId, false)
    }
  }
}

export function startProcessTracker(): void {
  if (pollTimer) return
  pollTimer = setInterval(pollSessions, POLL_INTERVAL_MS)
}

export function stopProcessTracker(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
