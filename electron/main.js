const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

app.name = 'Scrap Yard';

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Scrap Yard Idle',
    frame: true,
    show: false,
    fullscreen: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
    },
  });

  // Remove the default application menu (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);

  // Escape only exits fullscreen, never closes the app
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });

  // Load from compiled files (independent mode)
  const indexPath = path.join(app.getAppPath(), 'dist', 'scrap-yard', 'browser', 'index.html');

  mainWindow
    .loadFile(indexPath)
    .then(() => {
      mainWindow.show();
    })
    .catch((err) => {
      console.error('[Electron] Failed to load file:', err);
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key === 'I') ||
        (input.control && input.shift && input.key === 'J') ||
        (input.control && input.key === 'U')
      ) {
        event.preventDefault();
      }
    });
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('save-game', async (event, data) => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = path.join(userDataPath, 'save.json');
    const tempPath = path.join(userDataPath, 'save.tmp');

    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, savePath);

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-game', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = path.join(userDataPath, 'save.json');

    const data = await fs.readFile(savePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'FILE_NOT_FOUND' };
    }
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('has-save', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = path.join(userDataPath, 'save.json');

    await fs.access(savePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('clear-save', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = path.join(userDataPath, 'save.json');
    const tempPath = path.join(userDataPath, 'save.tmp');

    try {
      await fs.unlink(savePath);
    } catch {}
    try {
      await fs.unlink(tempPath);
    } catch {}

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-save-path', async () => {
  const userDataPath = app.getPath('userData');
  return { success: true, path: userDataPath };
});

ipcMain.handle('set-window-mode', (event, { mode, resolution }) => {
  if (!mainWindow) return;
  if (mode === 'fullscreen') {
    mainWindow.setFullScreen(true);
  } else if (mode === 'maximized') {
    mainWindow.setFullScreen(false);
    mainWindow.maximize();
  } else {
    // windowed
    mainWindow.setFullScreen(false);
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    const [w, h] = resolution.split('x').map(Number);
    if (w && h) {
      mainWindow.setSize(w, h);
      mainWindow.center();
    }
  }
});

ipcMain.handle('set-resolution', (event, resolution) => {
  if (!mainWindow || mainWindow.isFullScreen()) return;
  const [w, h] = resolution.split('x').map(Number);
  if (!w || !h) return;
  mainWindow.setSize(w, h);
  mainWindow.center();
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

ipcMain.handle('open-external', (event, url) => {
  if (typeof url !== 'string' || !url.startsWith('https://')) return;
  shell.openExternal(url);
});
