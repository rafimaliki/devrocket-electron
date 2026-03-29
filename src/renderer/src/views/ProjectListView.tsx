import { useState, useRef, useEffect } from 'react'
import type { Project } from '@shared/types'
import ConfirmDialog from '../components/ConfirmDialog'

interface ProjectListViewProps {
  projects: Project[]
  onSelect: (projectId: string) => void
  onCreateProject: (name: string) => void
  onUpdateProject: (id: string, name: string) => void
  onDeleteProject: (projectId: string) => void
}

export default function ProjectListView({
  projects,
  onSelect,
  onCreateProject,
  onUpdateProject,
  onDeleteProject
}: ProjectListViewProps) {
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onCreateProject(name)
    setNewName('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
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

  const inputStyle = {
    flex: 1,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    borderRadius: '6px',
    padding: '8px 12px',
    outline: 'none'
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
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Create project */}
      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="new project name"
          style={inputStyle}
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
            cursor: newName.trim() ? 'pointer' : 'default',
            transition: 'background-color 0.15s'
          }}
        >
          create
        </button>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          no projects yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                cursor: editingId === p.id ? 'default' : 'pointer'
              }}
              onClick={() => editingId !== p.id && onSelect(p.id)}
            >
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
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    flex: 1
                  }}
                >
                  {p.name}
                </span>
              )}
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {p.repos.length} repo{p.repos.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={(e) => startEdit(p, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 4px'
                  }}
                  title="Rename"
                >
                  edit
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    fontSize: '16px',
                    padding: '0 4px',
                    lineHeight: 1
                  }}
                  title="Delete project"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
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
