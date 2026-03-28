function App(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1
          className="text-2xl font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
        >
          devrocket
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          dev environment launcher
        </p>
      </div>
    </div>
  )
}

export default App
