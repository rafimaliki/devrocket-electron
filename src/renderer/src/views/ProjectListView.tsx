import { useState, useRef, useEffect } from 'react'
import type { Project } from '@shared/types'
import type { LaunchMode } from '../ipc/bridge'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'

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
  onUpdateProject,
  onDeleteProject,
  onLaunch,
  onKill
}: ProjectListViewProps) {
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation()
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

  function startEdit(p: Project, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(p.id)
    setEditingName(p.name)
  }

  function commitEdit(id: string) {
    const name = editingName.trim()
    if (name) onUpdateProject(id, name)
    setEditingId(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') commitEdit(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  const monoSm = { fontFamily: 'var(--font-mono)', fontSize: '12px' }
  const mutedColor = { color: 'var(--color-text-muted)' }

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
          {projects.map((p) => {
            const expanded = expandedIds.has(p.id)
            return (
              <div
                key={p.id}
                className="rounded-lg border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {/* Project header row */}
                <div className="flex items-center gap-2 px-3 py-3">
                  {/* Expand toggle */}
                  <button
                    onClick={(e) => toggleExpand(p.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      fontSize: '14px',
                      padding: '0 4px',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'transform 0.15s',
                      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={expanded ? 'Collapse' : 'Expand repos'}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Project name / inline edit */}
                  {editingId === p.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitEdit(p.id)}
                      onKeyDown={(e) => handleEditKeyDown(e, p.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--color-accent)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        outline: 'none',
                        padding: '0 0 2px 0'
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => onSelect(p.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        color: 'var(--color-text)',
                        padding: 0,
                        flex: 1,
                        textAlign: 'left'
                      }}
                      title="Open project"
                    >
                      {p.name}
                    </button>
                  )}

                  {/* Meta + actions */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span style={{ ...monoSm, ...mutedColor }}>
                      {p.repos.length} repo{p.repos.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => startEdit(p, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', ...monoSm, ...mutedColor, padding: '2px 4px' }}
                      title="Rename"
                    >
                      edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '16px', padding: '0 2px', lineHeight: 1 }}
                      title="Delete project"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded repo list */}
                {expanded && p.repos.length > 0 && (
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg)'
                    }}
                  >
                    {p.repos.map((repo, i) => {
                      const active = isActive(repo.id)
                      return (
                        <div
                          key={repo.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{
                            borderBottom: i < p.repos.length - 1 ? '1px solid var(--color-border)' : undefined
                          }}
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
                  <div
                    style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', padding: '10px 16px' }}
                  >
                    <span style={{ ...monoSm, ...mutedColor }}>no repos — open project to add one</span>
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
