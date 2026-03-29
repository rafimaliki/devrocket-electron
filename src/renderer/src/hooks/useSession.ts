import { useState, useEffect, useCallback } from 'react'
import type { SessionState } from '@shared/types'
import type { LaunchMode } from '../ipc/bridge'
import { session as sessionIPC } from '../ipc/bridge'

export function useSession() {
  const [sessions, setSessions] = useState<Record<string, SessionState>>({})

  // Load initial session status
  useEffect(() => {
    sessionIPC.status().then((list) => {
      const map: Record<string, SessionState> = {}
      for (const s of list) map[s.repoId] = s
      setSessions(map)
    })
  }, [])

  // Subscribe to push updates from Main when a process exits unexpectedly
  useEffect(() => {
    const unsubscribe = sessionIPC.onStatusUpdate((update) => {
      setSessions((prev) => {
        if (!update.active) {
          const next = { ...prev }
          delete next[update.repoId]
          return next
        }
        return { ...prev, [update.repoId]: { ...prev[update.repoId], active: update.active } }
      })
    })
    return unsubscribe
  }, [])

  const isActive = useCallback((repoId: string) => !!sessions[repoId]?.active, [sessions])

  const launch = useCallback(async (repoId: string, mode: LaunchMode): Promise<void> => {
    const state = await sessionIPC.launch(repoId, mode)
    setSessions((prev) => {
      const next = { ...prev }
      if (mode === 'switch') {
        // Clear all other active sessions from local state
        for (const id of Object.keys(next)) delete next[id]
      }
      next[repoId] = state
      return next
    })
  }, [])

  const kill = useCallback(async (repoId: string): Promise<void> => {
    await sessionIPC.kill(repoId)
    setSessions((prev) => {
      const next = { ...prev }
      delete next[repoId]
      return next
    })
  }, [])

  return { sessions, isActive, launch, kill }
}
