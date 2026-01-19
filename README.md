# OpenMap Studio

A cross-platform desktop application for interactive maps using MapLibre GL JS, built with Electron, Vite, and TypeScript.

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/p/github/opengeos/openmap-studio)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-blue?logo=stackblitz)](https://stackblitz.com/github/opengeos/openmap-studio)

## Features

- Full-screen interactive map with OpenStreetMap tiles
- Pan, zoom, and navigation controls
- Cross-platform support (Windows, macOS, Linux)
- Hot reload development environment

## Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- npm 9.x or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/opengeos/openmap-studio.git
cd openmap-studio

# Install dependencies
npm install
```

## Usage

### Development

Start the development server with hot reload:

```bash
npm run dev
```

This will:
- Start the Vite dev server
- Launch Electron with the app
- Enable hot module replacement for rapid development

### Production Build

Build the application for production:

```bash
npm run build
```

This compiles TypeScript and bundles the application into the `dist/` and `dist-electron/` directories.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Building Distributions

Build distributable packages for your platform:

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:win    # Windows (exe, portable)
npm run dist:mac    # macOS (dmg, zip)
npm run dist:linux  # Linux (AppImage, deb)
```

Built packages are output to the `release/` directory.

### Platform-specific Notes

**Windows:**
- Builds `.exe` installer and portable executable
- Code signing requires setting `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables

**macOS:**
- Builds `.dmg` disk image and `.zip` archive
- Notarization requires Apple Developer credentials (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`)
- **Unsigned app warning:** Since the app is not signed with an Apple Developer certificate, macOS may show "OpenMap Studio is damaged and can't be opened." To fix this, run in Terminal:
  ```bash
  xattr -cr /Applications/OpenMap\ Studio.app
  ```
  Then open the app normally.

**Linux:**
- Builds `.AppImage` and `.deb` packages
- AppImage works on most distributions without installation

## Project Structure

```
openmap-studio/
├── electron/
│   ├── main.ts              # Electron main process
│   └── preload.ts           # Preload script for IPC
├── src/
│   ├── main.ts              # Renderer entry point
│   ├── map.ts               # MapLibre map initialization
│   └── style.css            # Application styles
├── index.html               # HTML entry point
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript config (renderer)
├── tsconfig.node.json       # TypeScript config (Node/Electron)
└── vite.config.ts           # Vite bundler configuration
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run dist` | Build distributable for current platform |
| `npm run dist:win` | Build Windows distributable |
| `npm run dist:mac` | Build macOS distributable |
| `npm run dist:linux` | Build Linux distributable |

## Configuration

### Map Settings

Edit `src/map.ts` to customize:
- Initial center coordinates
- Default zoom level
- Map style and tile sources
- Navigation controls

### Electron Settings

Edit `electron/main.ts` to customize:
- Window dimensions
- Security preferences
- Application menu

## License

MIT License - see [LICENSE](LICENSE) for details.