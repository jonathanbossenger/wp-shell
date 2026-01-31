# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WP Shell is an Electron desktop application that allows users to connect to a local WordPress installation and execute arbitrary PHP code directly from a desktop interface. It's a companion app to WP Debug designed for testing WordPress functions, database queries, and creating content without modifying WordPress files.

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (with hot reload and DevTools)
npm run dev

# Generate icons (required before building)
npm run generate-all

# Build for production
npm run build

# Create distributable packages
npm run make

# Package without creating installers
npm run package

# Publish release to GitHub
npm run publish
```

## Architecture

### Electron Process Model

The application follows Electron's multi-process architecture:

1. **Main Process** (`main/index.js`): Handles system-level operations, IPC communication, and PHP code execution
   - Creates and manages application windows and tray icon
   - Validates WordPress directories by checking for `wp-config.php`
   - Detects PHP and WordPress versions for IntelliSense
   - Executes PHP code by creating temporary files (`wp-shell-temp.php`) that load `wp-load.php`
   - Manages persistent storage with `electron-store` for recent directories (max 5) and function caches
   - Loads and caches PHP and WordPress function metadata for IntelliSense
   - Handles cleanup on app quit

2. **Preload Script** (`preload.js`): Secure bridge between main and renderer processes
   - Uses `contextBridge` to expose IPC methods to renderer
   - Implements security best practices: `nodeIntegration: false`, `contextIsolation: true`

3. **Renderer Process** (`renderer/src/`): React-based UI
   - `App.js`: Main component with two views (directory selection and code editor)
   - `components/RecentDirectories.js`: Shows up to 5 recently used WordPress directories
   - Built with React and Tailwind CSS

### Code Execution Flow

1. User writes PHP code in the editor
2. Renderer sends code to main process via IPC (`execute-code`)
3. Main process creates `wp-shell-temp.php` with wrapped code that:
   - Loads WordPress via `wp-load.php`
   - Executes user code with error handling
   - Captures output using output buffering
4. PHP executes via `child_process.exec` (30s timeout, 10MB buffer)
5. Temporary file is deleted
6. Output returns to renderer for display

### Build System

- **Webpack**: Bundles React renderer code (`renderer/src/index.js` → `renderer/index.js`)
- **Babel**: Transpiles JSX and modern JavaScript
- **PostCSS + Tailwind**: Processes CSS with Tailwind utilities
- **Electron Forge**: Packages and creates distributables for Windows (Squirrel, WiX), macOS (DMG), and Linux (DEB, RPM)

### Icon Generation

Icons must be generated before building:
- `scripts/generate-app-icons.js`: Creates multi-resolution app icons from `assets/wp-shell.svg`
- `scripts/generate-tray-icon.js`: Creates tray icon from `assets/terminal-solid.svg`
- Output: `assets/icons/` directory with platform-specific formats (.icns, .ico, .png)

## Key Technical Details

### Version-Aware IntelliSense System

WP Shell provides comprehensive, version-aware IntelliSense for PHP and WordPress functions:

**Architecture:**
- **Version Detection** (`main/index.js`): Automatically detects PHP version via `php -v` and WordPress version from `wp-includes/version.php`
- **Function Loader** (`main/function-loader.js`): Loads and caches function metadata from bundled JSON files
- **Bundled Data** (`data/` directory):
  - PHP 7.4-8.3 functions (~260KB total, 500-800 functions per version)
  - WordPress 6.0-6.5 functions (~400KB total, 200-400 functions per version)
- **Monaco Integration** (`renderer/src/components/CodeEditor.js`): Dynamic completion provider with prefix filtering
- **Caching Strategy**: Function data cached in `electron-store` with 30-day lifetime, keyed by version

**Features:**
- 3,000+ PHP core and extension functions
- 2,000+ WordPress core functions
- Automatic version matching with fallback to earlier versions
- Prefix-based filtering (limited to 100 suggestions for performance)
- Graceful degradation when versions cannot be detected
- Version info displayed in UI (e.g., "PHP 8.1 | WordPress 6.4")

**Performance:**
- First load: <3 seconds (reads bundled JSON files)
- Cached load: <100ms (instant from electron-store)
- Completion filtering: <100ms (responsive typing)
- Memory usage: <50MB total

### WordPress Directory Validation
- Validates by checking for `wp-config.php` existence
- Invalid directories are removed from recent list

### Security Measures
- No `nodeIntegration` in renderer process
- Context isolation enabled
- IPC communication through secure preload bridge
- Proper path normalization for cross-platform compatibility

### UI Layout
The app has a **side-by-side layout** (after directory selection):
- **Left**: Code editor (dark theme: #1e1e1e) with Tab support (4 spaces) and Ctrl/Cmd+Enter to execute
- **Right**: Output panel (light theme: #f8f9fa) with monospace font

### State Management
- React state in `App.js` (no Redux/Context API)
- Persistent storage via `electron-store` for recent directories only
- No code history or saved snippets (enhancement opportunity)

## Common Issues

### PHP Execution Fails
- Ensure PHP is in system PATH
- Check that selected directory contains valid `wp-config.php`
- Verify WordPress installation isn't corrupted

### Icons Missing
- Run `npm run generate-all` before building
- Requires Sharp and PNG2Icons dependencies

### Build Errors
- Ensure `npm run build` completes before `npm run make`
- Webpack must bundle renderer code successfully first

## Related Documentation

- `README.md`: User-facing features and installation
- `IMPLEMENTATION_SUMMARY.md`: Complete implementation details and testing summary
- `UI_DOCUMENTATION.md`: UI design specifications and color scheme
- `QUICK_START.md`: Detailed getting started guide
- `CONTRIBUTING.md`: Contribution guidelines
