# ZCode Snippets

A fast, local-first code snippet manager for developers. Built with Tauri, Rust, React, and TypeScript.

## Features

- **Instant search** — FTS5 full-text search across titles, bodies, and descriptions
- **Code editor** — CodeMirror 6 by default; switch to Monaco on demand
- **Tags & Collections** — organise snippets any way you want
- **Pin** — keep frequently used snippets at the top
- **One-key copy** — press `Enter` on any snippet to copy it to clipboard
- **Keyboard-first** — full shortcut set, works on macOS, Windows, and Linux
- **Dark-mode first** — single polished dark theme
- **100% local** — all data lives in a SQLite database on your machine, nothing leaves your device

## Downloads

Pre-built binaries are available at **[zsync.eu/zcodesnippets](https://zsync.eu/zcodesnippets)** for:

| Platform | Formats |
|----------|---------|
| macOS Apple Silicon (M1–M4) | `.dmg`, `.app.tar.gz` |
| macOS Intel (x86_64) | `.dmg` |
| Linux (amd64) | `.deb`, `.rpm`, `.AppImage` |
| Windows 10/11 (x64) | NSIS `.exe`, `.msi` |
| Windows 10/11 (ARM64) | NSIS `.exe` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ N` | New snippet |
| `Ctrl/⌘ F` | Focus search |
| `Enter` | Copy selected snippet |
| `Ctrl/⌘ E` | Edit selected snippet |
| `Ctrl/⌘ P` | Toggle pin |
| `Ctrl/⌘ D` | Delete snippet (with confirm) |
| `Ctrl/⌘ B` | Collapse / expand sidebar |
| `Alt ↑ / ↓` | Navigate snippet list |
| `Esc` | Close dialogs / clear search |

## Building from Source

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ (`npm install -g pnpm`)
- Tauri v2 system dependencies — see [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

### Steps

```bash
git clone https://github.com/theholyonez/zcode-snippets.git
cd zcode-snippets

pnpm install
pnpm tauri dev        # development build
pnpm tauri build      # production build → src-tauri/target/release/bundle/
```

The SQLite database is created automatically on first launch at:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/com.zcode.snippets/zcode-snippets.db` |
| Linux | `~/.local/share/com.zcode.snippets/zcode-snippets.db` |
| Windows | `%APPDATA%\com.zcode.snippets\zcode-snippets.db` |

## Stack

| Layer | Technology |
|-------|-----------|
| Shell | Tauri v2 |
| Backend | Rust + rusqlite (SQLite, FTS5) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind v4 |
| State | Zustand + TanStack Query v5 |
| Editor | CodeMirror 6 / Monaco Editor |
| Animations | Framer Motion |

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).
