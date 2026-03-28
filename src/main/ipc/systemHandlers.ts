import { ipcMain } from 'electron'
import { execSync } from 'child_process'

function isVscodeAvailable(): boolean {
  try {
    execSync('where code', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function checkVscodeOnStartup(): void {
  if (!isVscodeAvailable()) {
    console.warn(
      '[devrocket] VSCode "code" command not found in PATH. ' +
        'Install VSCode and run "Shell Command: Install code command in PATH" from the Command Palette.'
    )
  }
}

export function registerSystemHandlers(): void {
  ipcMain.handle('system:check-vscode', () => isVscodeAvailable())
}
