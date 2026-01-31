# PHP Path Resolution Implementation

## Overview

This document describes the implementation of PHP path resolution for the packaged WP Shell Electron app. The solution addresses the issue where packaged apps don't inherit the user's full PATH environment variable, causing "php: command not found" errors.

## Problem

When an Electron app is packaged (e.g., as a .dmg on macOS, .exe on Windows), it doesn't have access to the user's full PATH environment variable. This means the `php` command that works in development mode fails in production with "command not found" errors.

## Solution

A three-tier fallback strategy was implemented:

1. **fix-path Package**: Automatically restores the user's PATH environment variable
2. **Common Location Search**: Falls back to searching known PHP installation locations
3. **User Prompt**: As a last resort, prompts the user to manually select the PHP binary

## Implementation Details

### 1. Dependencies Added

**package.json:**
- `fix-path@^5.0.0` - Restores PATH in packaged apps
- `glob@^13.0.0` - Pattern matching for finding PHP installations

### 2. New Module: php-path-resolver.js

**Location:** `main/php-path-resolver.js`

**Key Functions:**

- `resolvePhpPath(store, forceFresh)`: Main resolver function
  - Returns cached custom PHP path if exists
  - Checks if `php` is in PATH (after fix-path restoration)
  - Searches common installation locations
  - Returns `null` if not found (caller should prompt user)

- `promptForPhpPath(store)`: User prompt function
  - Opens native file picker dialog
  - Validates selected file is PHP (`php -v`)
  - Stores path in electron-store as `customPhpPath`

- `clearPhpPath(store)`: Clear stored custom path

- `isValidPhpBinary(phpPath)`: Validation helper
  - Checks file exists and is executable
  - Verifies it's actually PHP by running `-v`

**Common PHP Locations Searched:**

**macOS:**
- `/opt/homebrew/bin/php` (Apple Silicon Homebrew)
- `/usr/local/bin/php` (Intel Homebrew)
- `/usr/bin/php` (System PHP)
- `/Applications/MAMP/bin/php/php*/bin/php` (MAMP - glob pattern)
- `/Applications/XAMPP/bin/php` (XAMPP)

**Linux:**
- `/usr/bin/php`
- `/usr/local/bin/php`
- `/opt/php/bin/php`

**Windows:**
- `C:\php\php.exe`
- `C:\xampp\php\php.exe`
- `C:\wamp\bin\php\php*\php.exe` (WAMP - glob pattern)

### 3. Main Process Changes

**Location:** `main/index.js`

**Changes:**

1. Import resolver functions:
   ```javascript
   const { resolvePhpPath, promptForPhpPath, clearPhpPath } = require('./php-path-resolver');
   ```

2. Add state variable:
   ```javascript
   let resolvedPhpPath = null;
   ```

3. Update `initStore()`:
   - Added `customPhpPath: null` to store defaults
   - Call `resolvePhpPath(store)` after store initialization

4. Update `detectPhpVersion()`:
   - Check if `resolvedPhpPath` exists, prompt user if not
   - Use `resolvedPhpPath` instead of `'php'` in exec command
   - Quote path to handle spaces: `"${resolvedPhpPath}" -v`

5. Update `executeWordPressCode()`:
   - Check if `resolvedPhpPath` exists, prompt user if not
   - Use `resolvedPhpPath` instead of `'php'` in exec command
   - Quote both PHP path and temp file path: `"${resolvedPhpPath}" "${tempFile}"`
   - Detect PHP path errors and return special error code

6. Add IPC handlers:
   - `prompt-php-path`: Prompts user to select PHP binary
   - `clear-php-path`: Clears stored custom path and re-detects

### 4. Preload Bridge Changes

**Location:** `preload.js`

Added two new API methods:
```javascript
promptPhpPath: () => ipcRenderer.invoke('prompt-php-path'),
clearPhpPath: () => ipcRenderer.invoke('clear-php-path')
```

### 5. Renderer UI Changes

**Location:** `renderer/src/App.js`

**Changes:**

1. Add state:
   ```javascript
   const [phpPathIssue, setPhpPathIssue] = useState(false);
   ```

2. Update `handleExecuteCode()`:
   - Detect PHP path errors (PHP_PATH_ERROR, command not found)
   - Set `phpPathIssue` state to show configuration UI

3. Add `handleConfigurePhpPath()` function:
   - Calls `window.electronAPI.promptPhpPath()`
   - Reloads version info after successful configuration
   - Updates UI to show success

4. Update error UI:
   - Shows "Configure PHP Path" button when `phpPathIssue` is true
   - Button triggers the PHP path configuration dialog

## User Experience Flow

### Happy Path (Homebrew PHP)
1. User launches packaged app
2. fix-path restores PATH
3. PHP found automatically
4. App works immediately

### Fallback Path (MAMP/XAMPP)
1. User launches packaged app
2. fix-path doesn't find PHP in PATH
3. App searches common locations
4. Finds MAMP/XAMPP PHP automatically
5. App works immediately

### User Configuration Path
1. User launches packaged app
2. fix-path and common location search both fail
3. User tries to execute code
4. Error message appears with "Configure PHP Path" button
5. User clicks button, file picker opens
6. User selects PHP binary (e.g., `/usr/local/bin/php`)
7. App validates it's PHP and stores path
8. Subsequent executions work automatically

### Reset Path
Users can clear the stored custom path by:
1. Deleting the electron-store data file, or
2. Using the `clear-php-path` IPC handler (future UI feature)

## Technical Considerations

### Cross-Platform Compatibility
- Uses `process.platform` to determine OS
- Quotes paths in exec commands to handle spaces
- Windows uses `.exe` extension
- Uses forward slashes for glob patterns

### Error Handling
- Clear distinction between "PHP not found" vs "PHP execution failed"
- Special error code `PHP_PATH_ERROR` for path issues
- Validation before storing custom paths
- Graceful degradation with helpful error messages

### Security
- Validates PHP binary before storing
- Uses proper path escaping in exec commands
- Maintains context isolation in preload script

### Performance
- Caches resolved PHP path in memory
- Stores custom path in electron-store for persistence
- Only prompts user when necessary
- Fast validation using `access()` and quick `-v` checks

## Testing

### Manual Testing Steps

1. **Test Development Mode**
   ```bash
   npm run dev
   ```
   Should work normally (has full PATH)

2. **Test Packaged App (Normal Case)**
   ```bash
   npm run build && npm run make
   ```
   Install and run the packaged app. Should find PHP automatically via Homebrew.

3. **Test Fallback (Hide Homebrew PHP)**
   Temporarily rename Homebrew PHP:
   ```bash
   sudo mv /opt/homebrew/bin/php /opt/homebrew/bin/php.bak
   ```
   Run packaged app. Should find MAMP/XAMPP PHP if installed.

4. **Test User Prompt (No PHP Found)**
   Hide all PHP installations. Run packaged app and try to execute code.
   Should show error with "Configure PHP Path" button.

5. **Test Custom Path Selection**
   Click "Configure PHP Path", select a valid PHP binary.
   Should store path and allow execution.

6. **Test Invalid Selection**
   Click "Configure PHP Path", select a non-PHP file.
   Should show error and re-prompt.

7. **Restore PHP**
   ```bash
   sudo mv /opt/homebrew/bin/php.bak /opt/homebrew/bin/php
   ```

### Verification Checklist

- [ ] Development mode works
- [ ] Packaged app finds Homebrew PHP
- [ ] Packaged app finds MAMP/XAMPP PHP when Homebrew unavailable
- [ ] User prompt appears when no PHP found
- [ ] Invalid selections are rejected
- [ ] Valid selections are stored and work
- [ ] Version detection displays correctly
- [ ] Code execution works after configuration
- [ ] App remembers custom path after restart

## Future Enhancements

1. **Settings Panel**: Add UI to view/change PHP path without error
2. **Multi-Version Selection**: Detect multiple PHP versions and let user choose
3. **PHP Path Display**: Show PHP path in UI (not just version)
4. **Refresh Button**: Add "Refresh PHP detection" button
5. **Auto-Update**: Detect when PHP path becomes invalid and re-prompt
6. **PATH Editor**: Allow users to add directories to search PATH

## Files Modified

1. `package.json` - Added dependencies
2. `main/php-path-resolver.js` - New file (core logic)
3. `main/index.js` - Integrated resolver, updated PHP execution
4. `preload.js` - Exposed new IPC methods
5. `renderer/src/App.js` - Added PHP path configuration UI

## Migration Notes

No breaking changes. Existing installations will:
- Automatically detect PHP on first run after update
- Store custom paths if configured
- Continue working with existing recent directories

## Troubleshooting

### Issue: "PHP not found" after update
**Solution**: Click "Configure PHP Path" and select PHP binary

### Issue: Custom path not working after system update
**Solution**: Clear stored path and reconfigure, or update PHP installation

### Issue: Performance impact
**Impact**: Minimal. Path resolution happens once at startup (~3 seconds max)

### Issue: Multiple PHP versions causing confusion
**Workaround**: App uses first valid PHP found. To use specific version, configure custom path.

## Related Documentation

- `CLAUDE.md` - Project overview and architecture
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `README.md` - User-facing documentation
