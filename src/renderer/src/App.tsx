import { useState, useEffect } from 'react'
import { useProjects } from './hooks/useProjects'
import { useSession } from './hooks/useSession'
import ProjectListView from './views/ProjectListView'
import ProjectDetailView from './views/ProjectDetailView'
import Toast from './components/Toast'
import { system } from './ipc/bridge'

type View = 'list' | 'detail'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('list')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [vscodeWarning, setVscodeWarning] = useState(false)
  const [toastMessages, setToastMessages] = useState<string[]>([])

  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createRepo,
    updateRepo,
    deleteRepo
  } = useProjects()
  const { isActive, launch, kill } = useSession()

  useEffect(() => {
    system.checkVscode().then((ok) => {
      if (!ok) setVscodeWarning(true)
    })
  }, [])

  async function handleLaunch(repoId: string, mode: Parameters<typeof launch>[1]): Promise<void> {
    const warnings = await launch(repoId, mode)
    if (warnings.length > 0) setToastMessages(warnings)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.1em'
          }}
        >
          loading...
        </span>
      </div>
    )
  }

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) ?? null
    : null

  return (
    <>
      {vscodeWarning && (
        <div
          style={{
            backgroundColor: '#2a1a00',
            borderBottom: '1px solid #7c4a00',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f59e0b' }}>
            VSCode "code" command not found in PATH — launch will not open VSCode windows
          </span>
          <button
            onClick={() => setVscodeWarning(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#f59e0b',
              fontSize: '16px',
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'detail' && selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            isActive={isActive}
            onLaunch={handleLaunch}
            onKill={kill}
            onCreateRepo={createRepo}
            onUpdateRepo={updateRepo}
            onDeleteRepo={deleteRepo}
            onBack={() => {
              setView('list')
              setSelectedProjectId(null)
            }}
          />
        ) : (
          <ProjectListView
            projects={projects}
            onSelect={(id) => {
              setSelectedProjectId(id)
              setView('detail')
            }}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
          />
        )}
      </div>

      <Toast messages={toastMessages} onDismiss={() => setToastMessages([])} />
    </>
  )
}

export default App
