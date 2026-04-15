const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
  ping: () => 'pong',

  saveGame: (data) => ipcRenderer.invoke('save-game', data),

  loadGame: () => ipcRenderer.invoke('load-game'),

  hasSave: () => ipcRenderer.invoke('has-save'),

  clearSave: () => ipcRenderer.invoke('clear-save'),

  getSavePath: () => ipcRenderer.invoke('get-save-path'),

  setWindowMode: ({ mode, resolution }) =>
    ipcRenderer.invoke('set-window-mode', { mode, resolution }),

  setResolution: (resolution) => ipcRenderer.invoke('set-resolution', resolution),

  quit: () => ipcRenderer.invoke('quit-app'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
