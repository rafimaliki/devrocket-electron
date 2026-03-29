import { useState, useEffect, useRef } from 'react'
import type { Project, Repo, VSCodeWindow, TerminalInstance } from '@shared/types'
import type { LaunchMode } from '../ipc/bridge'
import RepoCard from '../components/RepoCard'
import RepoConfigForm from '../components/RepoConfigForm'
import ConfirmDialog from '../components/ConfirmDialog'

interface ProjectDetailViewProps {
  project: Project
  isActive: (repoId: string) => boolean
  onLaunch: (repoId: string, mode: LaunchMode) => void
  onKill: (repoId: string) => void
  onCreateRepo: (
    projectId: string,
    name: string,
    vscodeWindows: Omit<VSCodeWindow, 'id'>[],
    terminals: Omit<TerminalInstance, 'id'>[]
  ) => void
  onUpdateRepo: (
    projectId: string,
    repoId: string,
    name: string,
    vscodeWindows: Omit<VSCodeWindow, 'id'>[],
    terminals: Omit<TerminalInstance, 'id'>[]
  ) => void
  onDeleteRepo: (projectId: string, repoId: string) => void
  onUpdateNotes: (id: string, notes: string) => void
  onBack: () => void
}

export default function ProjectDetailView({
  project,
  isActive,
  onLaunch,
  onKill,
  onCreateRepo,
  onUpdateRepo,
  onDeleteRepo,
  onUpdateNotes,
  onBack
}: ProjectDetailViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRepo, setEditingRepo] = useState<Repo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Repo | null>(null)
  const [notes, setNotes] = useState(project.notes ?? '')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | ''>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync notes if project changes (e.g. navigating between projects)
  useEffect(() => {
    setNotes(project.notes ?? '')
  }, [project.id])

  function handleNotesChange(value: string) {
    setNotes(value)
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdateNotes(project.id, value)
      setSaveStatus('saved')
    }, 600)
  }

  function handleCreate(
    name: string,
    vscodeWindows: Omit<VSCodeWindow, 'id'>[],
    terminals: Omit<TerminalInstance, 'id'>[]
  ) {
    onCreateRepo(project.id, name, vscodeWindows, terminals)
    setShowCreateForm(false)
  }

  function handleUpdate(
    name: string,
    vscodeWindows: Omit<VSCodeWindow, 'id'>[],
    terminals: Omit<TerminalInstance, 'id'>[]
  ) {
    if (!editingRepo) return
    onUpdateRepo(project.id, editingRepo.id, name, vscodeWindows, terminals)
    setEditingRepo(null)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            padding: 0
          }}
        >
          ← back
        </button>
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
        >
          {project.name}'s Repositories
        </h2>
      </div>

      {/* Repo list */}
      <div className="flex flex-col gap-3 mb-4">
        {project.repos.length === 0 && !showCreateForm && (
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            no repos yet
          </p>
        )}
        {project.repos.map((repo) =>
          editingRepo?.id === repo.id ? (
            <RepoConfigForm
              key={repo.id}
              initialName={repo.name}
              initialVscodeWindows={repo.vscodeWindows.map(({ directory }) => ({ directory }))}
              initialTerminals={repo.terminals.map(({ shell, directory }) => ({ shell, directory }))}
              onSubmit={handleUpdate}
              onCancel={() => setEditingRepo(null)}
            />
          ) : (
            <RepoCard
              key={repo.id}
              repo={repo}
              active={isActive(repo.id)}
              onLaunch={(mode) => onLaunch(repo.id, mode)}
              onKill={() => onKill(repo.id)}
              onEdit={() => setEditingRepo(repo)}
              onDelete={() => setDeleteTarget(repo)}
            />
          )
        )}
        {showCreateForm && (
          <RepoConfigForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
        )}
      </div>

      {!showCreateForm && !editingRepo && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            background: 'none',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '24px'
          }}
        >
          + add repo
        </button>
      )}

      {/* Notes */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)'
            }}
          >
            notes
          </span>
          {saveStatus && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {saveStatus === 'saving' ? 'saving…' : 'saved'}
            </span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="add notes about this project…"
          rows={4}
          style={{
            width: '100%',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            padding: '10px 12px',
            resize: 'vertical',
            lineHeight: 1.6
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="delete repo"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget) onDeleteRepo(project.id, deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
