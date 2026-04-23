const { contextBridge, ipcRenderer } = require('electron');

// Prevent Chromium from scrolling the root window under any circumstance
window.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    html, body { overflow: hidden !important; overscroll-behavior: none !important; }
    * { overscroll-behavior: contain; scroll-margin: 0; }
    app-root { position: fixed !important; top: 0 !important; left: 0 !important; }
  `;
  document.head.appendChild(style);

  // Lock all window scroll APIs — nothing can move the viewport
  const noop = () => {};
  window.scroll = noop;
  window.scrollBy = noop;
  window.scrollTo = noop;
  if (document.documentElement) {
    Object.defineProperty(document.documentElement, 'scrollTop', { get: () => 0, set: noop });
    Object.defineProperty(document.documentElement, 'scrollLeft', { get: () => 0, set: noop });
  }

  // Disable scrollIntoView and preventScroll bypass
  Element.prototype.scrollIntoView = noop;
  const _origFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(options) {
    _origFocus.call(this, Object.assign({}, options, { preventScroll: true }));
  };
});

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
});
