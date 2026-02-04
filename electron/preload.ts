import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
  ping: () => 'pong',

  saveGame: (data: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('save-game', data),

  loadGame: (): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('load-game'),

  hasSave: (): Promise<{ success: boolean; exists: boolean }> => ipcRenderer.invoke('has-save'),

  clearSave: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('clear-save'),

  getSavePath: (): Promise<{ success: boolean; path: string }> =>
    ipcRenderer.invoke('get-save-path'),
});
