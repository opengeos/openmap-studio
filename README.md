# OpenMap Studio

A cross-platform desktop application for interactive maps using MapLibre GL JS, built with Electron, Vite, and TypeScript.

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/p/github/opengeos/openmap-studio)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-blue?logo=stackblitz)](https://stackblitz.com/github/opengeos/openmap-studio)

![](https://assets.gishub.org/images/openmap.png)

## Features

- Desktop-first MapLibre GIS experience (Electron + TypeScript)
- Local vector data loading (`.geojson`, `.json`, zipped shapefiles) via Vector Dataset tools and drag-and-drop
- Cloud-native geospatial controls for PMTiles, COG, STAC search, and Planetary Computer
- Layer management with rename + style persistence in `.openmap` project files
- Optional scale bar and live mouse coordinate readout
- Cross-platform support (Windows, macOS, Linux)
- Hot reload development environment

## Installation

Download the latest release for your platform from the [Releases](https://github.com/opengeos/openmap-studio/releases) page:

| Platform | Download                            |
| -------- | ----------------------------------- |
| Windows  | `.exe` installer or portable `.exe` |
| macOS    | `.dmg` disk image                   |
| Linux    | `.AppImage` or `.deb` package       |

### Platform-specific Notes

**Windows:**
- Run the `.exe` installer or use the portable version directly
- Windows may show a SmartScreen warning for unsigned apps - click "More info" then "Run anyway"

**macOS:**
- Open the `.dmg` and drag OpenMap Studio to Applications
- Since the app is not signed with an Apple Developer certificate, macOS may show "OpenMap Studio is damaged and can't be opened." To fix this, run in Terminal:
  ```bash
  xattr -cr /Applications/OpenMap\ Studio.app
  ```
  Then open the app normally.

**Linux:**
- **AppImage:** Make it executable (`chmod +x *.AppImage`) and run directly - works on most distributions
- **Deb:** Install with `sudo dpkg -i openmap-studio_*.deb`

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- npm 9.x or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/opengeos/openmap-studio.git
cd openmap-studio

# Install dependencies
npm install
```

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

### Building Distributions

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

**Code Signing (optional):**
- **Windows:** Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables
- **macOS:** Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` for notarization

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

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm run build`      | Build for production                     |
| `npm run preview`    | Preview production build                 |
| `npm run dist`       | Build distributable for current platform |
| `npm run dist:win`   | Build Windows distributable              |
| `npm run dist:mac`   | Build macOS distributable                |
| `npm run dist:linux` | Build Linux distributable                |

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