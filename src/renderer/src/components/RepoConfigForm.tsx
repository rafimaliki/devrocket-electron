import { useState } from 'react'
import type { VSCodeWindow, TerminalInstance } from '@shared/types'
import { system } from '../ipc/bridge'

const IconFolder = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3.5C1 2.95 1.45 2.5 2 2.5H5L6.5 4H11C11.55 4 12 4.45 12 5V10C12 10.55 11.55 11 11 11H2C1.45 11 1 10.55 1 10V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface RepoConfigFormProps {
  initialName?: string
  initialVscodeWindows?: Omit<VSCodeWindow, 'id'>[]
  initialTerminals?: Omit<TerminalInstance, 'id'>[]
  onSubmit: (
    name: string,
    vscodeWindows: Omit<VSCodeWindow, 'id'>[],
    terminals: Omit<TerminalInstance, 'id'>[]
  ) => void
  onCancel: () => void
}

export default function RepoConfigForm({
  initialName = '',
  initialVscodeWindows = [],
  initialTerminals = [],
  onSubmit,
  onCancel
}: RepoConfigFormProps) {
  const [name, setName] = useState(initialName)
  const [vscodeWindows, setVscodeWindows] = useState<Omit<VSCodeWindow, 'id'>[]>(
    initialVscodeWindows.length > 0 ? initialVscodeWindows : [{ directory: '' }]
  )
  const [terminals, setTerminals] = useState<Omit<TerminalInstance, 'id'>[]>(
    initialTerminals.length > 0 ? initialTerminals : [{ shell: 'powershell.exe', directory: '' }]
  )

  function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const validWindows = vscodeWindows.filter((w) => w.directory.trim())
    const validTerminals = terminals.filter((t) => t.directory.trim() && t.shell.trim())
    onSubmit(trimmedName, validWindows, validTerminals)
  }

  function updateWindow(i: number, directory: string) {
    setVscodeWindows((prev) => prev.map((w, idx) => (idx === i ? { directory } : w)))
  }

  async function browseWindow(i: number) {
    const dir = await system.pickDirectory()
    if (dir) updateWindow(i, dir)
  }

  function addWindow() {
    setVscodeWindows((prev) => [...prev, { directory: '' }])
  }

  function removeWindow(i: number) {
    setVscodeWindows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateTerminal(i: number, field: 'shell' | 'directory', value: string) {
    setTerminals((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))
  }

  async function browseTerminal(i: number) {
    const dir = await system.pickDirectory()
    if (dir) updateTerminal(i, 'directory', dir)
  }

  function addTerminal() {
    setTerminals((prev) => [...prev, { shell: 'powershell.exe', directory: '' }])
  }

  function removeTerminal(i: number) {
    setTerminals((prev) => prev.filter((_, idx) => idx !== i))
  }

  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    borderRadius: '4px',
    padding: '6px 8px',
    width: '100%',
    outline: 'none'
  }

  const labelStyle = {
    color: 'var(--color-text-muted)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '4px'
  }

  const sectionTitleStyle = {
    color: 'var(--color-text-muted)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px'
  }

  const addBtnStyle = {
    color: 'var(--color-accent)',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    padding: '2px 0'
  }

  const removeBtnStyle = {
    color: 'var(--color-text-muted)',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    flexShrink: 0
  }

  const browseBtnStyle = {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '5px 7px',
    flexShrink: 0
  }

  return (
    <div
      className="rounded-lg border p-5"
      style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-4">
        <label style={labelStyle}>Repo Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. backend"
          autoFocus
        />
      </div>

      {/* VSCode Windows */}
      <div className="mb-4">
        <p style={sectionTitleStyle}>VSCode Windows</p>
        {vscodeWindows.map((w, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              style={inputStyle}
              value={w.directory}
              onChange={(e) => updateWindow(i, e.target.value)}
              placeholder="C:\path\to\directory"
            />
            <button style={browseBtnStyle} onClick={() => browseWindow(i)} title="Browse">
              <IconFolder />
            </button>
            {vscodeWindows.length > 1 && (
              <button style={removeBtnStyle} onClick={() => removeWindow(i)} title="Remove">
                ×
              </button>
            )}
          </div>
        ))}
        <button style={addBtnStyle} onClick={addWindow}>
          + add window
        </button>
      </div>

      {/* Terminals */}
      <div className="mb-5">
        <p style={sectionTitleStyle}>Terminals</p>
        {terminals.map((t, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div style={{ flex: '0 0 160px' }}>
                <input
                  style={inputStyle}
                  value={t.shell}
                  onChange={(e) => updateTerminal(i, 'shell', e.target.value)}
                  placeholder="powershell.exe"
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  style={inputStyle}
                  value={t.directory}
                  onChange={(e) => updateTerminal(i, 'directory', e.target.value)}
                  placeholder="C:\path\to\directory"
                />
              </div>
              <button style={browseBtnStyle} onClick={() => browseTerminal(i)} title="Browse">
                <IconFolder />
              </button>
              {terminals.length > 1 && (
                <button style={removeBtnStyle} onClick={() => removeTerminal(i)} title="Remove">
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
        <button style={addBtnStyle} onClick={addTerminal}>
          + add terminal
        </button>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm rounded border cursor-pointer"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-mono)'
          }}
        >
          cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-1.5 text-sm rounded cursor-pointer"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            fontFamily: 'var(--font-mono)'
          }}
        >
          save
        </button>
      </div>
    </div>
  )
}
