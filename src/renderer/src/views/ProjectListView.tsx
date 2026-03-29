import { useState } from 'react'
import type { Project } from '@shared/types'
import ConfirmDialog from '../components/ConfirmDialog'

interface ProjectListViewProps {
  projects: Project[]
  onSelect: (projectId: string) => void
  onCreateProject: (name: string) => void
  onDeleteProject: (projectId: string) => void
}

export default function ProjectListView({
  projects,
  onSelect,
  onCreateProject,
  onDeleteProject
}: ProjectListViewProps) {
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onCreateProject(name)
    setNewName('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
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
          style={{
            flex: 1,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            borderRadius: '6px',
            padding: '8px 12px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            backgroundColor: newName.trim() ? 'var(--color-accent)' : 'var(--color-surface)',
            color: newName.trim() ? '#fff' : 'var(--color-text-muted)',
            border: 'none',
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
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          no projects yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
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
                  textAlign: 'left',
                  flex: 1
                }}
              >
                {p.name}
              </button>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {p.repos.length} repo{p.repos.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(p)
                  }}
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
