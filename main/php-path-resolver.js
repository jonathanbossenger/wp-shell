// Restore PATH environment variable for packaged apps
try {
  const fixPath = require('fix-path');
  if (typeof fixPath === 'function') {
    fixPath();
  } else if (fixPath.default && typeof fixPath.default === 'function') {
    fixPath.default();
  }
  console.log('fix-path applied successfully');
} catch (error) {
  console.warn('Could not apply fix-path:', error.message);
  // Continue anyway - we have fallback search
}

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { dialog } = require('electron');
const { glob } = require('glob');

const execAsync = promisify(exec);

/**
 * Test if a PHP binary path is valid
 * @param {string} phpPath - Path to PHP binary
 * @returns {Promise<boolean>}
 */
async function isValidPhpBinary(phpPath) {
  try {
    // Check if file exists and is executable
    await fs.promises.access(phpPath, fs.constants.X_OK);

    // Verify it's actually PHP by running php -v
    const { stdout } = await execAsync(`"${phpPath}" -v`, { timeout: 5000 });
    return stdout.includes('PHP');
  } catch (error) {
    return false;
  }
}

/**
 * Search common PHP installation locations
 * @returns {Promise<string|null>}
 */
async function searchCommonLocations() {
  const locations = [];

  if (process.platform === 'darwin') {
    // macOS locations
    locations.push(
      '/opt/homebrew/bin/php',  // Apple Silicon Homebrew
      '/usr/local/bin/php',      // Intel Homebrew
      '/usr/bin/php',             // System PHP
      '/Applications/MAMP/bin/php/php*/bin/php',  // MAMP (glob pattern)
      '/Applications/XAMPP/bin/php'  // XAMPP
    );
  } else if (process.platform === 'linux') {
    // Linux locations
    locations.push(
      '/usr/bin/php',
      '/usr/local/bin/php',
      '/opt/php/bin/php'
    );
  } else if (process.platform === 'win32') {
    // Windows locations
    locations.push(
      'C:\\php\\php.exe',
      'C:\\xampp\\php\\php.exe',
      'C:\\wamp\\bin\\php\\php*\\php.exe'  // WAMP (glob pattern)
    );
  }

  // Test each location
  for (const location of locations) {
    // Check if it's a glob pattern
    if (location.includes('*')) {
      try {
        const matches = await glob(location, { windowsPathsNoEscape: true });
        // Sort to get the latest version (higher version numbers sort last)
        matches.sort();
        // Test from newest to oldest
        for (let i = matches.length - 1; i >= 0; i--) {
          if (await isValidPhpBinary(matches[i])) {
            console.log(`Found PHP at: ${matches[i]}`);
            return matches[i];
          }
        }
      } catch (error) {
        // Glob pattern didn't match anything, continue
        continue;
      }
    } else {
      // Direct path check
      if (await isValidPhpBinary(location)) {
        console.log(`Found PHP at: ${location}`);
        return location;
      }
    }
  }

  return null;
}

/**
 * Check if 'php' command works in PATH
 * @returns {Promise<boolean>}
 */
async function isPhpInPath() {
  try {
    const command = process.platform === 'win32' ? 'where php' : 'which php';
    const { stdout } = await execAsync(command, { timeout: 5000 });
    const phpPath = stdout.trim().split('\n')[0]; // Get first result

    if (phpPath && await isValidPhpBinary(phpPath)) {
      console.log(`PHP found in PATH: ${phpPath}`);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Resolve PHP binary path with fallback strategy
 * @param {Object} store - Electron store instance
 * @param {boolean} forceFresh - Force re-detection, ignore cache
 * @returns {Promise<string|null>} - Path to PHP binary or null if not found
 */
async function resolvePhpPath(store, forceFresh = false) {
  console.log('Resolving PHP path...');

  // 1. Check for stored custom path (unless forceFresh)
  if (!forceFresh && store) {
    const customPath = store.get('customPhpPath');
    if (customPath) {
      if (await isValidPhpBinary(customPath)) {
        console.log(`Using stored custom PHP path: ${customPath}`);
        return customPath;
      } else {
        console.warn('Stored custom PHP path is no longer valid, clearing it');
        store.delete('customPhpPath');
      }
    }
  }

  // 2. Check if php is in PATH (fix-path should have restored it)
  if (await isPhpInPath()) {
    return 'php'; // Use 'php' command directly
  }

  // 3. Search common installation locations
  console.log('PHP not found in PATH, searching common locations...');
  const foundPath = await searchCommonLocations();
  if (foundPath) {
    return foundPath;
  }

  // 4. Not found - caller should prompt user
  console.warn('PHP not found automatically. User will need to specify location.');
  return null;
}

/**
 * Prompt user to select PHP binary location
 * @param {Object} store - Electron store instance
 * @returns {Promise<string|null>} - Selected PHP path or null if canceled
 */
async function promptForPhpPath(store) {
  const filters = process.platform === 'win32'
    ? [{ name: 'Executables', extensions: ['exe'] }]
    : [{ name: 'All Files', extensions: ['*'] }];

  const result = await dialog.showOpenDialog({
    title: 'Select PHP Binary',
    buttonLabel: 'Select PHP',
    filters,
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];

  // Validate it's actually PHP
  if (await isValidPhpBinary(selectedPath)) {
    // Store the path
    if (store) {
      store.set('customPhpPath', selectedPath);
    }
    console.log(`User selected valid PHP path: ${selectedPath}`);
    return selectedPath;
  } else {
    throw new Error('Selected file is not a valid PHP binary. Please select the correct PHP executable.');
  }
}

/**
 * Clear stored custom PHP path
 * @param {Object} store - Electron store instance
 */
function clearPhpPath(store) {
  if (store) {
    store.delete('customPhpPath');
    console.log('Cleared custom PHP path');
  }
}

module.exports = {
  resolvePhpPath,
  promptForPhpPath,
  clearPhpPath,
  isValidPhpBinary
};
