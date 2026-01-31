const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.js');
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
    },
  });

  // Remove the default application menu (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);
  // Hide the menu bar so it doesn't display on Windows (good for games)
  mainWindow.setMenuBarVisibility(false);

  // Allow exiting fullscreen or closing with Escape (convenience during testing)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      if (mainWindow.isFullScreen && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      } else {
        // close the window to allow quick exit from the game
        mainWindow.close();
      }
    }
  });

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // When packaged, app.getAppPath() points inside the asar or unpacked app directory.
    // Our built web assets are under `dist/last-admin-online/browser/index.html`.
    const indexPath = path.join(
      app.getAppPath(),
      'dist',
      'last-admin-online',
      'browser',
      'index.html',
    );
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index file:', indexPath, err);
    });
  }

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
