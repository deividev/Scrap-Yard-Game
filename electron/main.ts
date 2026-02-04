import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/last-admin-online/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('save-game', async (event, data: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = join(userDataPath, 'save.json');
    const tempPath = join(userDataPath, 'save.tmp');

    console.log('[Electron] Saving to:', savePath);

    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, savePath);

    console.log('[Electron] Save successful');
    return { success: true };
  } catch (error) {
    console.error('Failed to save game:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-game', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = join(userDataPath, 'save.json');

    const data = await fs.readFile(savePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: false, error: 'FILE_NOT_FOUND' };
    }
    console.error('Failed to load game:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('has-save', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = join(userDataPath, 'save.json');

    await fs.access(savePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('clear-save', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const savePath = join(userDataPath, 'save.json');
    const tempPath = join(userDataPath, 'save.tmp');

    try {
      await fs.unlink(savePath);
    } catch {}
    try {
      await fs.unlink(tempPath);
    } catch {}

    return { success: true };
  } catch (error) {
    console.error('Failed to clear save:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-save-path', async () => {
  const userDataPath = app.getPath('userData');
  return { success: true, path: userDataPath };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
