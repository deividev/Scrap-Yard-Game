const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

app.name = 'Scrap Yard';

let mainWindow = null;

function createWindow() {
  console.log('[Electron] Creating window...');
  const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.js');
  console.log('[Electron] Preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
    },
  });

  // Remove the default application menu (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);

  // Allow exiting fullscreen or closing with Escape (convenience during testing)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      mainWindow.close();
    }
  });

  // Load from compiled files (independent mode)
  const indexPath = path.join(
    app.getAppPath(),
    'dist',
    'last-admin-online',
    'browser',
    'index.html',
  );

  console.log('[Electron] Loading from:', indexPath);

  mainWindow
    .loadFile(indexPath)
    .then(() => {
      console.log('[Electron] Window loaded successfully');
    })
    .catch((err) => {
      console.error('[Electron] Failed to load file:', err);
      console.error('[Electron] Make sure to run: pnpm run build');
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

    console.log('[Electron] Saving to:', savePath);

    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, savePath);

    console.log('[Electron] Save successful');
    return { success: true };
  } catch (error) {
    console.error('[Electron] Failed to save game:', error);
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
    console.error('[Electron] Failed to load game:', error);
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
    console.error('[Electron] Failed to clear save:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-save-path', async () => {
  const userDataPath = app.getPath('userData');
  console.log('[Electron] userData path:', userDataPath);
  return { success: true, path: userDataPath };
});
