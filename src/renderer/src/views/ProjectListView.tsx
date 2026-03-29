import { useState } from 'react'
import type { Project } from '@shared/types'
import type { LaunchMode } from '../ipc/bridge'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function sortedByLastOpened(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (!a.lastOpenedAt && !b.lastOpenedAt) return 0
    if (!a.lastOpenedAt) return 1
    if (!b.lastOpenedAt) return -1
    return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
  })
}

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H12M5 4V2.5H9V4M5.5 6.5V10.5M8.5 6.5V10.5M3 4L3.5 11.5H10.5L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transition: 'transform 0.15s',
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      flexShrink: 0
    }}
  >
    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface ProjectListViewProps {
  projects: Project[]
  isActive: (repoId: string) => boolean
  onSelect: (projectId: string) => void
  onCreateProject: (name: string) => void
  onUpdateProject: (id: string, name: string) => void
  onDeleteProject: (projectId: string) => void
  onLaunch: (repoId: string, mode: LaunchMode) => void
  onKill: (repoId: string) => void
}

export default function ProjectListView({
  projects,
  isActive,
  onSelect,
  onCreateProject,
  onDeleteProject,
  onLaunch,
  onKill
}: ProjectListViewProps) {
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onCreateProject(name)
    setNewName('')
  }

  const monoSm = { fontFamily: 'var(--font-mono)', fontSize: '12px' }
  const mutedColor = { color: 'var(--color-text-muted)' }
  const iconBtn = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-lg font-semibold tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
        >
          devrocket
        </h1>
        <span style={{ ...monoSm, ...mutedColor }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Create project */}
      <div className="flex gap-2 mb-5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="new project name"
          style={{
            flex: 1,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            borderRadius: '6px',
            padding: '8px 12px'
          }}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            backgroundColor: newName.trim() ? 'var(--color-accent)' : 'var(--color-surface)',
            color: newName.trim() ? '#fff' : 'var(--color-text-muted)',
            border: '1px solid ' + (newName.trim() ? 'var(--color-accent)' : 'var(--color-border)'),
            borderRadius: '6px',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            cursor: newName.trim() ? 'pointer' : 'default'
          }}
        >
          create
        </button>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <p style={{ ...monoSm, ...mutedColor }}>no projects yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedByLastOpened(projects).map((p) => {
            const expanded = expandedIds.has(p.id)
            return (
              <div
                key={p.id}
                className="rounded-lg border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {/* Project header — whole row toggles accordion */}
                <div
                  className="flex items-center gap-2 px-3 py-3"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleExpand(p.id)}
                >
                  <span style={{ ...mutedColor, display: 'flex', alignItems: 'center' }}>
                    <IconChevron expanded={expanded} />
                  </span>

                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      color: 'var(--color-text)'
                    }}
                  >
                    {p.name}
                  </span>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.lastOpenedAt && (
                      <span style={{ ...monoSm, ...mutedColor, marginRight: '6px' }}>
                        {relativeTime(p.lastOpenedAt)}
                      </span>
                    )}
                    <span style={{ ...monoSm, ...mutedColor, marginRight: '6px' }}>
                      {p.repos.length} repo{p.repos.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => onSelect(p.id)}
                      style={iconBtn}
                      title="Open project"
                    >
                      <IconPencil />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      style={{ ...iconBtn, color: 'var(--color-text-muted)' }}
                      title="Delete project"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>

                {/* Expanded repo list */}
                {expanded && p.repos.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    {p.repos.map((repo, i) => {
                      const active = isActive(repo.id)
                      return (
                        <div
                          key={repo.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{ borderBottom: i < p.repos.length - 1 ? '1px solid var(--color-border)' : undefined }}
                        >
                          <span style={{ ...monoSm, color: 'var(--color-text)', flex: 1 }}>
                            {repo.name}
                          </span>
                          <StatusBadge active={active} />
                          <div className="flex gap-1.5">
                            {active ? (
                              <>
                                <button
                                  onClick={() => onLaunch(repo.id, 'new')}
                                  style={{ ...monoSm, backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
                                >
                                  + new
                                </button>
                                <button
                                  onClick={() => onKill(repo.id)}
                                  style={{ ...monoSm, backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
                                >
                                  kill
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => onLaunch(repo.id, 'new')}
                                  style={{ ...monoSm, backgroundColor: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
                                >
                                  launch
                                </button>
                                <button
                                  onClick={() => onLaunch(repo.id, 'switch')}
                                  style={{ ...monoSm, backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
                                >
                                  switch
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {expanded && p.repos.length === 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', padding: '10px 16px' }}>
                    <span style={{ ...monoSm, ...mutedColor }}>no repos — click pencil to open project and add one</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="delete project"
        message={`Delete "${deleteTarget?.name}"? This will remove all its repos.`}
        onConfirm={() => {
          if (deleteTarget) onDeleteProject(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
