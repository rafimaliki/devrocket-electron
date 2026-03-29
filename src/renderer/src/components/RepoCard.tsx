import StatusBadge from './StatusBadge'
import type { Repo } from '@shared/types'
import type { LaunchMode } from '../ipc/bridge'

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

interface RepoCardProps {
  repo: Repo
  active: boolean
  onLaunch: (mode: LaunchMode) => void
  onKill: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function RepoCard({ repo, active, onLaunch, onKill, onEdit, onDelete }: RepoCardProps) {
  const btnBase = {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none'
  }

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
          >
            {repo.name}
          </span>
          <StatusBadge active={active} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Edit repo"
          >
            <IconPencil />
          </button>
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Delete repo"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {repo.vscodeWindows.length} window{repo.vscodeWindows.length !== 1 ? 's' : ''} · {repo.terminals.length} terminal{repo.terminals.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        {active ? (
          <>
            <button
              onClick={() => onLaunch('new')}
              style={{ ...btnBase, backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
            >
              + launch new
            </button>
            <button
              onClick={onKill}
              style={{ ...btnBase, backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-border)' }}
            >
              kill
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onLaunch('switch')}
              style={{ ...btnBase, backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              switch to
            </button>
            <button
              onClick={() => onLaunch('new')}
              style={{ ...btnBase, backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              launch
            </button>
          </>
        )}
      </div>
    </div>
  )
}
