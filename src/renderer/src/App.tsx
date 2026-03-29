import { useState } from 'react'
import { useProjects } from './hooks/useProjects'
import { useSession } from './hooks/useSession'
import ProjectListView from './views/ProjectListView'
import ProjectDetailView from './views/ProjectDetailView'

type View = 'list' | 'detail'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('list')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { projects, loading, createProject, deleteProject, createRepo, updateRepo, deleteRepo } =
    useProjects()
  const { isActive, launch, kill } = useSession()

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

  if (view === 'detail' && selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        isActive={isActive}
        onLaunch={launch}
        onKill={kill}
        onCreateRepo={createRepo}
        onUpdateRepo={updateRepo}
        onDeleteRepo={deleteRepo}
        onBack={() => {
          setView('list')
          setSelectedProjectId(null)
        }}
      />
    )
  }

  return (
    <ProjectListView
      projects={projects}
      onSelect={(id) => {
        setSelectedProjectId(id)
        setView('detail')
      }}
      onCreateProject={createProject}
      onDeleteProject={deleteProject}
    />
  )
}

export default App
