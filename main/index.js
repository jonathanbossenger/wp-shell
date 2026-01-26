const { app, BrowserWindow, ipcMain, dialog, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

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
      recentDirectories: []
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

// Handle getting function definitions for IntelliSense
ipcMain.handle('get-function-definitions', async (event, wpDirectory) => {
  try {
    // Create a PHP script to extract function definitions
    const tempFile = path.join(wpDirectory, 'wp-shell-definitions.php');
    
    const wpLoadPath = path.join(wpDirectory, 'wp-load.php').replace(/\\/g, '/');
    
    const definitionsScript = `<?php
define('WP_USE_THEMES', false);
require_once('${wpLoadPath}');

// Get PHP version
$phpVersion = PHP_VERSION;

// Get WordPress version
$wpVersion = get_bloginfo('version');

// Get all defined functions
$allFunctions = get_defined_functions();
$userFunctions = array_merge($allFunctions['internal'], $allFunctions['user']);

// Filter to get WordPress-specific functions (functions that don't exist in base PHP)
$wpFunctions = [];
$phpFunctions = [];

foreach ($userFunctions as $functionName) {
  // Skip internal PHP functions for WordPress list
  if (in_array($functionName, $allFunctions['internal'])) {
    continue;
  }
  
  try {
    $reflection = new ReflectionFunction($functionName);
    $params = [];
    
    foreach ($reflection->getParameters() as $param) {
      $paramInfo = [
        'name' => $param->getName(),
        'optional' => $param->isOptional(),
        'hasType' => $param->hasType(),
        'type' => $param->hasType() ? (string)$param->getType() : null,
      ];
      
      if ($param->isDefaultValueAvailable()) {
        try {
          $default = $param->getDefaultValue();
          $paramInfo['default'] = is_array($default) ? 'array()' : var_export($default, true);
        } catch (Exception $e) {
          $paramInfo['default'] = null;
        }
      }
      
      $params[] = $paramInfo;
    }
    
    $wpFunctions[] = [
      'name' => $functionName,
      'params' => $params,
      'file' => $reflection->getFileName(),
      'docComment' => $reflection->getDocComment() ?: '',
    ];
  } catch (Exception $e) {
    // Skip functions that can't be reflected
    continue;
  }
}

// Get common PHP functions with their signatures
foreach ($allFunctions['internal'] as $functionName) {
  // Only include commonly used PHP functions to avoid overwhelming the editor
  // We'll include all string, array, file, and common utility functions
  if (preg_match('/^(str|array|file|is_|print|echo|var_|json_|serialize|unserialize|count|empty|isset|in_array|explode|implode|trim|sprintf|date|time|preg_)/', $functionName)) {
    try {
      $reflection = new ReflectionFunction($functionName);
      $params = [];
      
      foreach ($reflection->getParameters() as $param) {
        $params[] = [
          'name' => $param->getName(),
          'optional' => $param->isOptional(),
        ];
      }
      
      $phpFunctions[] = [
        'name' => $functionName,
        'params' => $params,
      ];
    } catch (Exception $e) {
      continue;
    }
  }
}

// Return as JSON
echo json_encode([
  'phpVersion' => $phpVersion,
  'wpVersion' => $wpVersion,
  'wordpressFunctions' => $wpFunctions,
  'phpFunctions' => $phpFunctions,
], JSON_PRETTY_PRINT);
?>`;

    await fs.promises.writeFile(tempFile, definitionsScript);

    return new Promise((resolve, reject) => {
      exec(\`php \${tempFile}\`, {
        cwd: wpDirectory,
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large function lists
        timeout: 60000, // 60 second timeout
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

        try {
          const definitions = JSON.parse(stdout);
          resolve(definitions);
        } catch (parseError) {
          reject(new Error('Failed to parse function definitions: ' + parseError.message));
        }
      });
    });
  } catch (error) {
    console.error('Error getting function definitions:', error);
    throw error;
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
