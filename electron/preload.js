const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
  ping: () => 'pong',

  saveGame: (data) => ipcRenderer.invoke('save-game', data),

  loadGame: () => ipcRenderer.invoke('load-game'),

  hasSave: () => ipcRenderer.invoke('has-save'),

  clearSave: () => ipcRenderer.invoke('clear-save'),

  getSavePath: () => ipcRenderer.invoke('get-save-path'),
});
