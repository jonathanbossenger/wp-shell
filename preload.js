const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  executeCode: (directory, code) => ipcRenderer.invoke('execute-code', directory, code),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
  getFunctionDefinitions: (directory) => ipcRenderer.invoke('get-function-definitions', directory),
  openExternal: (url) => shell.openExternal(url)
});
