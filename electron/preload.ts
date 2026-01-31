import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
  ping: () => 'pong'
});
