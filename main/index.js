const { app, BrowserWindow, ipcMain, dialog, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { getAllCompletions, clearCompletionCache, getFallbackCompletions } = require('./function-loader');

let mainWindow = null;
let tray = null;
let isCleaningUp = false;
let store = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize electron store
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      recentDirectories: [],
      phpVersion: null
    }
  });
};

// Function to add a directory to recent list
const addToRecentDirectories = (directory) => {
  if (!store) return [];
  const recentDirectories = store.get('recentDirectories', []);
  const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
  filteredDirectories.unshift(directory);
  const updatedDirectories = filteredDirectories.slice(0, 5);
  store.set('recentDirectories', updatedDirectories);
  return updatedDirectories;
};

// Function to check if directory is a WordPress installation
const isWordPressDirectory = async (directory) => {
  try {
    const configPath = path.join(directory, 'wp-config.php');
    await fs.promises.access(configPath);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to detect PHP version
const detectPhpVersion = async () => {
  try {
    return new Promise((resolve, reject) => {
      exec('php -v', { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          console.warn('PHP not detected in PATH:', error.message);
          resolve(null);
          return;
        }

        // Parse PHP version from output: PHP 8.1.5 (cli) ...
        const match = stdout.match(/PHP (\d+\.\d+\.\d+)/);
        if (match) {
          const version = match[1];
          console.log(`PHP ${version} detected`);
          resolve(version);
        } else {
          console.warn('Could not parse PHP version from output');
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error detecting PHP version:', error);
    return null;
  }
};

// Function to detect WordPress version
const detectWordPressVersion = async (directory) => {
  try {
    const versionFile = path.join(directory, 'wp-includes', 'version.php');
    const content = await fs.promises.readFile(versionFile, 'utf8');

    // Parse $wp_version = '6.4.2';
    const match = content.match(/\$wp_version\s*=\s*['"]([^'"]+)['"]/);
    if (match) {
      const version = match[1];
      console.log(`WordPress ${version} detected`);
      return version;
    } else {
      console.warn('Could not parse WordPress version from version.php');
      return null;
    }
  } catch (error) {
    console.error('Error detecting WordPress version:', error);
    return null;
  }
};

// Function to get combined version info with caching
const getVersionInfo = async (wpDirectory) => {
  if (!store) {
    console.warn('Store not initialized');
    return { php: null, wordpress: null };
  }

  try {
    // Check cache for PHP version
    let phpVersion = store.get('phpVersion');
    if (!phpVersion) {
      phpVersion = await detectPhpVersion();
      if (phpVersion) {
        store.set('phpVersion', phpVersion);
      }
    }

    // Check cache for WordPress version for this directory
    const wpCacheKey = `wpVersion:${wpDirectory}`;
    let wpVersion = store.get(wpCacheKey);
    if (!wpVersion) {
      wpVersion = await detectWordPressVersion(wpDirectory);
      if (wpVersion) {
        store.set(wpCacheKey, wpVersion);
      }
    }

    return {
      php: phpVersion,
      wordpress: wpVersion
    };
  } catch (error) {
    console.error('Error getting version info:', error);
    return { php: null, wordpress: null };
  }
};

// Function to execute PHP code in WordPress context
const executeWordPressCode = async (wpDirectory, code) => {
  try {
    // Create a temporary PHP file
    const tempFile = path.join(wpDirectory, 'wp-shell-temp.php');
    
    // Normalize path for PHP (use forward slashes even on Windows)
    const wpLoadPath = path.join(wpDirectory, 'wp-load.php').replace(/\\/g, '/');
    
    // Wrap the code to load WordPress and capture output
    const wrappedCode = `<?php
define('WP_USE_THEMES', false);
require_once('${wpLoadPath}');

// Start output buffering
ob_start();

// Execute user code
try {
    ${code}
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\\n";
    echo "File: " . $e->getFile() . "\\n";
    echo "Line: " . $e->getLine() . "\\n";
    echo "Trace:\\n" . $e->getTraceAsString();
}

// Get the output
$output = ob_get_clean();
echo $output;
?>`;

    await fs.promises.writeFile(tempFile, wrappedCode);

    // Execute the PHP file
    return new Promise((resolve, reject) => {
      exec(`php ${tempFile}`, {
        cwd: wpDirectory,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000, // 30 second timeout
      }, async (error, stdout, stderr) => {
        // Clean up temp file
        try {
          await fs.promises.unlink(tempFile);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }

        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve(stdout);
      });
    });
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
};

const createTray = async () => {
  // Use the pre-generated PNG icon
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray-icon.png'));
  
  tray = new Tray(trayIcon);
  tray.setToolTip('WP Shell');
  
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    title: 'WP Shell',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && !isCleaningUp) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

const createMenu = () => {
  const template = [
    {
      label: 'WP Shell',
      submenu: [
        {
          label: 'About WP Shell',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 300,
              height: 340,
              title: 'About WP Shell',
              resizable: false,
              minimizable: false,
              maximizable: false,
              fullscreenable: false,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js'),
              }
            });

            aboutWindow.loadFile(path.join(__dirname, '..', 'renderer', 'about.html'));
            
            // Open dev tools immediately in development mode
            if (process.env.NODE_ENV === 'development') {
              aboutWindow.webContents.openDevTools({ mode: 'detach' });
            }

            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { 
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: async () => {
            if (!isCleaningUp) {
              isCleaningUp = true;
              await cleanup();
              app.isQuitting = true;
              app.quit();
            }
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select WordPress Installation Directory',
  });
  
  if (!result.canceled) {
    const directory = result.filePaths[0];
    // Verify it's a WordPress directory
    if (await isWordPressDirectory(directory)) {
      // Add to recent directories
      addToRecentDirectories(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress installation');
    }
  }
  return null;
});

// Get recent directories
ipcMain.handle('get-recent-directories', async () => {
  if (!store) return [];
  return store.get('recentDirectories', []);
});

// Handle selecting a recent directory
ipcMain.handle('select-recent-directory', async (event, directory) => {
  if (await isWordPressDirectory(directory)) {
    addToRecentDirectories(directory);
    return directory;
  } else {
    if (store) {
      const recentDirectories = store.get('recentDirectories', []);
      const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
      store.set('recentDirectories', filteredDirectories);
    }
    throw new Error('Selected directory is no longer a valid WordPress installation');
  }
});

// Handle code execution
ipcMain.handle('execute-code', async (event, wpDirectory, code) => {
  try {
    const result = await executeWordPressCode(wpDirectory, code);
    return result;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
});

// Handle version info request
ipcMain.handle('get-version-info', async (event, wpDirectory) => {
  try {
    const versionInfo = await getVersionInfo(wpDirectory);
    return versionInfo;
  } catch (error) {
    console.error('Error getting version info:', error);
    return { php: null, wordpress: null };
  }
});

// Handle completions request
ipcMain.handle('get-completions', async (event, wpDirectory) => {
  try {
    // Get version info
    const versionInfo = await getVersionInfo(wpDirectory);

    // If no versions detected, return fallback completions
    if (!versionInfo.php && !versionInfo.wordpress) {
      console.warn('No PHP or WordPress version detected, using fallback completions');
      return getFallbackCompletions();
    }

    // Get all completions with caching
    const completions = await getAllCompletions(wpDirectory, versionInfo, store);
    return completions;
  } catch (error) {
    console.error('Error getting completions:', error);
    return getFallbackCompletions();
  }
});

// Handle clear completion cache request
ipcMain.handle('clear-completion-cache', async (event, wpDirectory) => {
  try {
    clearCompletionCache(wpDirectory, store);
    return { success: true };
  } catch (error) {
    console.error('Error clearing completion cache:', error);
    return { success: false, error: error.message };
  }
});

// Handle quitting the app
ipcMain.handle('quit-app', async () => {
  if (!isCleaningUp) {
    isCleaningUp = true;
    await cleanup();
    app.isQuitting = true;
    app.quit();
  }
});

// Function to cleanup
const cleanup = async () => {
  try {
    // Any cleanup needed before quitting
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

app.whenReady().then(async () => {
  await initStore();
  createMenu();
  await createTray();
  createWindow();

  // Handle dock icon clicks
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle macOS dock menu
  if (process.platform === 'darwin' && app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'Show Window',
        click() {
          if (mainWindow === null) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }
});

// Handle before-quit event
app.on('before-quit', async (event) => {
  if (!isCleaningUp && !app.isQuitting) {
    event.preventDefault();
    app.isQuitting = true;
    await cleanup();
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin' && !isCleaningUp) {
    isCleaningUp = true;
    await cleanup();
    app.quit();
  }
});
