const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  executeCode: (directory, code) => ipcRenderer.invoke('execute-code', directory, code),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
  openExternal: (url) => shell.openExternal(url),
  getVersionInfo: (directory) => ipcRenderer.invoke('get-version-info', directory),
  getCompletions: (directory) => ipcRenderer.invoke('get-completions', directory),
  clearCompletionCache: (directory) => ipcRenderer.invoke('clear-completion-cache', directory)
});
