const { app, BrowserWindow, dialog } = require('electron');
const windowStateManager = require('electron-window-state');
const fs = require('fs');

const windows = new Set();

const createWindow = () => {
  const winState = windowStateManager({
    defaultHeight: 600,
    defaultWidth: 800
  });

  let newWindow = new BrowserWindow({
    show: false,
    height: !windows.size ? winState.height : winState.defaultHeight,
    width: !windows.size ? winState.width : winState.defaultWidth,
    x: winState.x,
    y: winState.y,
    minWidth: 600,
    minHeight: 400
  });

  windows.add(newWindow);

  winState.manage(newWindow);

  newWindow.loadURL(`file://${__dirname}/index.html`);

  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });

  newWindow.on('close', e => {
    if (newWindow.isDocumentEdited()) {
      e.preventDefault();
      const result = dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'Your changes will be lost if you do not save first',
        buttons: ['Quit Anyway', 'Cancel'],
        defaultId: 1,
        cancelId: 1
      });

      if (result === 0) {
        newWindow.destroy();
      }
    }
  });

  newWindow.on('closed', () => {
    windows.delete(newWindow);
  });
};

const getFileFromUserSelection = targetWindow => {
  const files = dialog.showOpenDialog(targetWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  if (!files) return;

  return files[0];
};

const openFile = (targetWindow, filePath) => {
  const file = filePath || getFileFromUserSelection(targetWindow);

  const content = fs.readFileSync(file).toString();

  targetWindow.webContents.send('file-opened', { file, content });
  targetWindow.setTitle(`${file} - Fire Sale`);
  targetWindow.setRepresentedFilename(file);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  windows.clear();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!windows.size) {
    createWindow();
  }
});

module.exports = { openFile, createWindow };
