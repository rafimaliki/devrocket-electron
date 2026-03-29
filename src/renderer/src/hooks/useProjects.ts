import { useState, useEffect, useCallback } from 'react'
import type { Project, VSCodeWindow, TerminalInstance } from '@shared/types'
import { projects as projectsIPC, repos as reposIPC } from '../ipc/bridge'

export function useProjects() {
  const [projectList, setProjectList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await projectsIPC.list()
      setProjectList(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createProject = useCallback(async (name: string): Promise<Project> => {
    const p = await projectsIPC.create(name)
    setProjectList((prev) => [...prev, p])
    return p
  }, [])

  const updateProject = useCallback(async (id: string, name: string): Promise<void> => {
    const updated = await projectsIPC.update(id, name)
    setProjectList((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }, [])

  const updateProjectNotes = useCallback(async (id: string, notes: string): Promise<void> => {
    await projectsIPC.updateNotes(id, notes)
    setProjectList((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)))
  }, [])

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await projectsIPC.delete(id)
    setProjectList((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const createRepo = useCallback(
    async (
      projectId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<void> => {
      const repo = await reposIPC.create(projectId, name, vscodeWindows, terminals)
      setProjectList((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, repos: [...p.repos, repo] } : p))
      )
    },
    []
  )

  const updateRepo = useCallback(
    async (
      projectId: string,
      repoId: string,
      name: string,
      vscodeWindows: Omit<VSCodeWindow, 'id'>[],
      terminals: Omit<TerminalInstance, 'id'>[]
    ): Promise<void> => {
      const updated = await reposIPC.update(repoId, name, vscodeWindows, terminals)
      setProjectList((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, repos: p.repos.map((r) => (r.id === repoId ? updated : r)) }
            : p
        )
      )
    },
    []
  )

  const deleteRepo = useCallback(async (projectId: string, repoId: string): Promise<void> => {
    await reposIPC.delete(repoId)
    setProjectList((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, repos: p.repos.filter((r) => r.id !== repoId) } : p
      )
    )
  }, [])

  return {
    projects: projectList,
    loading,
    refresh,
    createProject,
    updateProject,
    updateProjectNotes,
    deleteProject,
    createRepo,
    updateRepo,
    deleteRepo
  }
}
