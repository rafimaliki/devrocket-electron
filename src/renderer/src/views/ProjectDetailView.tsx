import { useState } from 'react'
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
  onBack
}: ProjectDetailViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRepo, setEditingRepo] = useState<Repo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Repo | null>(null)

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
          {project.name}
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
            width: '100%'
          }}
        >
          + add repo
        </button>
      )}

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
