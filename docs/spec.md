# devrocket — App Specification

## 1. Project Overview

devrocket is a local-only Windows desktop app built with Electron and Vite that lets programmers define, manage, and launch their dev environments in a single click. Users configure projects with one or more repositories — each repository being a named setup of VSCode windows, terminal instances, and working directories. Launching a repo fires up the entire environment instantly, and switching between repos kills the old session and starts the new one, keeping the workspace clean and focused.

## 2. Problem Statement

Developers working across multiple projects lose time every day doing the same repetitive setup: opening VSCode, navigating to the right directory, opening terminals, configuring shells. Context-switching is even more painful — there's no clean way to say "stop working on project A, start project B" without manually closing each window and re-opening everything. Existing tools like VS Code workspaces or terminal profiles partially solve this but don't integrate the full environment launch (editor + terminal + directory) into one action, and none of them handle session switching as a first-class concept.

## 3. Target Users

### Solo Windows Developer
- **Who they are:** A programmer working locally on Windows, switching between 5–20 active projects.
- **What they need:** Fast environment launch, clean context switching, minimal friction.
- **What frustrates them:** Manually opening editors and terminals for each project; leftover windows from the last session cluttering the desktop.

> 💡 Suggested — **Power User / Multi-Repo Developer**
- **Who they are:** A developer who splits a single project across multiple repositories (e.g. frontend + backend + infra).
- **What they need:** Ability to launch all repos in a project at once, or selectively spawn individual repos.
- **What frustrates them:** Tools that only manage one terminal or one editor at a time.

## 4. Goals & Success Metrics

- **Goal:** Launch a full dev environment in under 3 seconds.
  - Metric: Time from clicking "Launch" to all windows open.
- **Goal:** Switch project context without leftover windows.
  - Metric: All tracked processes from the previous repo are terminated before new ones open.
- **Goal:** Zero configuration friction for new projects.
  - Metric: A new project and its first repo can be set up in under 60 seconds.
- **Goal:** App stays out of the way — lightweight, fast, always accessible.
  - Metric: App launches in under 2 seconds; idle memory under 100MB.

## 5. Core Features

### Must-Have (MVP)

- **Feature:** Project List
  - Description: A home view showing all saved projects. Users can create, rename, and delete projects.

- **Feature:** Repository Configuration
  - Description: Each project holds one or more repositories. A repository defines: a name, one or more working directories, one or more VSCode windows (each pointing to a directory), and one or more terminal instances (with configurable shell — PowerShell, CMD, etc. — and working directory).

- **Feature:** One-Click Launch
  - Description: A "Launch" button per repository that spawns all configured VSCode windows and terminal instances simultaneously.

- **Feature:** Multi-Repo Launch
  - Description: Repos within a project can be launched independently or together. Each repo is spawned as its own tracked session.

- **Feature:** Active Session Tracking
  - Description: The app tracks which repos are currently running (by monitoring spawned process IDs). Running repos are visually marked as active.

- **Feature:** Kill Session
  - Description: A "Kill" action terminates all processes associated with a repo's session.

- **Feature:** Context Switch ("Switch To")
  - Description: When launching a repo with "Switch To", the app first kills all currently active repo sessions, then launches the new one. Replaces the current dev context cleanly.

- **Feature:** Launch New (Independent)
  - Description: Launch a repo without killing existing sessions — adds to the current set of running environments.

- **Feature:** JSON File Storage
  - Description: All project and repo configuration is stored in a local JSON file. No database, no auth, no cloud sync.

- **Feature:** Dark Minimalist UI
  - Description: Dev-focused dark theme. Clean layout, keyboard-friendly, no decorative chrome.

### Nice-to-Have (Post-MVP)

> 💡 Suggested — review and remove anything that doesn't fit

- **Feature:** System Tray Integration
  - Description: App lives in the system tray so it's always one click away without cluttering the taskbar.

- **Feature:** Keyboard Shortcuts
  - Description: Launch, switch, and kill repos via configurable hotkeys — useful for power users.

- **Feature:** Launch on Windows Startup
  - Description: Option to auto-start devrocket with Windows so the launcher is always ready.

- **Feature:** Per-Terminal Environment Variables
  - Description: Set custom env vars per terminal instance (e.g. NODE_ENV=development), written into the shell session on launch.

- **Feature:** Repo Templates
  - Description: Save a repo configuration as a template to quickly create similar setups for new projects.

- **Feature:** Search / Filter Projects
  - Description: Quick filter on the project list for users with many projects.

## 6. Out of Scope

- **Cloud sync or multi-device support** — local-only by design.
- **Authentication or user accounts** — single-user, no login.
- **Remote SSH or WSL environments** — Windows-native processes only (at least in MVP).
- **Code editor integrations beyond launching** — no in-app editing, no extension management.
- **Git operations** — no pull, push, status, or branch management.
- **Task running or build pipelines** — not a task runner; just an environment launcher.
- **macOS / Linux support** — Windows-only for now.

## 7. Tech Stack

| Layer         | Choice                        | Rationale                                                    |
|---------------|-------------------------------|--------------------------------------------------------------|
| Shell/Runtime | Electron                      | User-specified; enables native Windows process spawning.     |
| Frontend      | Vite + React                  | User-specified Vite; React keeps UI simple and composable.   |
| Styling       | Tailwind CSS                  | 💡 Suggested — utility-first, fast to build dark UIs with.   |
| Storage       | JSON file (via Node `fs`)     | User-specified; simple, no deps, human-readable config.      |
| Process Mgmt  | Node.js `child_process`       | Native Electron capability for spawning/killing processes.   |
| Auth          | None                          | Local-only app, no auth needed.                              |
| Hosting       | Local desktop (packaged .exe) | 💡 Suggested — packaged via `electron-builder` for Windows.  |

## 8. Risks & Open Questions

### Risks

- **Process tracking reliability:** Windows doesn't always guarantee clean process trees. Child processes (e.g. terminals spawning sub-processes) may not be killed when the parent is. Mitigation: use `taskkill /F /T /PID` to kill the full process tree, not just the parent PID.

- **VSCode detection:** Launching `code .` depends on VSCode being in the system PATH. If it isn't, launch silently fails. Mitigation: detect `code` on first run and warn the user if not found.

- **Stale process state:** If the user closes a VSCode or terminal manually, devrocket still thinks it's running. Mitigation: periodically poll PID liveness or watch for process exit events.

- **JSON file corruption:** If the app crashes mid-write, the config JSON could be corrupted. Mitigation: write to a temp file and atomically rename, keep a `.bak` copy.

### Open Questions

- Should "Switch To" kill **all** active repos across all projects, or only within the current project?
- Should the app support launching terminals that aren't PowerShell or CMD (e.g. Git Bash, Windows Terminal)?
- Should devrocket remember window positions/sizes for VSCode instances, or just launch them?
- What is the expected behavior if a repo's directory no longer exists at launch time?
