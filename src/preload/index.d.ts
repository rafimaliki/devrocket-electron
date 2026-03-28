declare global {
  interface Window {
    devrocket: {
      projects: Record<string, unknown>
      repos: Record<string, unknown>
      session: Record<string, unknown>
      system: Record<string, unknown>
    }
  }
}
