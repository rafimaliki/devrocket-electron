# devrocket — Known Bugs & Limitations

## BUG-001: VSCode kill may close other VS Code instances

**Status:** Known limitation
**Severity:** Medium
**Affects:** Kill session, Switch To

### Description
When killing a repo session, devrocket may close VS Code windows that belong to other open projects, not just the one that was launched.

### Root Cause
VS Code does not expose a reliable per-window PID. devrocket tracks VS Code by diffing all `Code.exe` PIDs before and after launch (using a 3-second snapshot). Any new `Code.exe` processes that appeared during that 3-second window — even from unrelated VS Code activity (e.g. extension processes spawning, another window opening) — get included in the kill list.

### Workaround
- Close other VS Code windows before killing a devrocket session.
- Or use "Kill" on terminals only and close VS Code windows manually.

### Possible Fix (future)
- Use VS Code's `--extensionDevelopmentPath` or `--user-data-dir` flags to force isolated Code.exe instances with trackable PIDs.
- Or hook into VS Code's IPC protocol to close a specific window by workspace path.
