const { app, BrowserWindow } = require('electron');
const windowStateManager = require('electron-window-state');

let mainWindow = null;

app.on('ready', () => {
  const mainWindowState = windowStateManager({
    defaultHeight: 600,
    defaultWidth: 800
  });

  mainWindow = new BrowserWindow({
    show: false,
    height: mainWindowState.height,
    width: mainWindowState.width,
    x: mainWindowState.x,
    y: mainWindowState.y,
    minWidth: 600,
    minHeight: 400
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
