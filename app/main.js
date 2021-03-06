const { app, BrowserWindow, dialog } = require('electron');
const windowStateManager = require('electron-window-state');
const fs = require('fs');

const windows = new Set();
const fileWatchers = new Map();

const createWindow = filePath => {
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
    if (filePath) openFile(newWindow, filePath);
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
    stopWatchingFile(newWindow);
    newWindow = null;
  });
};

const getFileFromUserSelection = targetWindow => {
  const files = dialog.showOpenDialog(targetWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }, { name: 'Markdown Files', extensions: ['md'] }]
  });

  if (!files) return;

  return files[0];
};

const openFile = (targetWindow, filePath) => {
  const file = filePath || getFileFromUserSelection(targetWindow);

  const content = fs.readFileSync(file).toString();

  targetWindow.webContents.send('file-opened', { file, content });
  targetWindow.setRepresentedFilename(file);

  app.addRecentDocument(file);
  startWatchingFile(targetWindow, file);
};

const saveMarkdown = (targetWindow, file, content) => {
  if (!file) {
    file = dialog.showSaveDialog(targetWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'Markdown Files', extensions: ['md'] }]
    });
  }

  if (!file) return;

  fs.writeFileSync(file, content);
  targetWindow.webContents.send('file-opened', { file, content });
};

const saveHtml = (targetWindow, content) => {
  const file = dialog.showSaveDialog(targetWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  });

  if (!file) return;

  fs.writeFileSync(file, content);
};

const startWatchingFile = (targetWindow, file) => {
  stopWatchingFile(targetWindow);

  const watcher = fs.watch(file, e => {
    if (e === 'change') {
      const content = fs.readFileSync(file).toString();
      targetWindow.webContents.send('file-changed', { file, content });
    }
  });

  fileWatchers.set(targetWindow, watcher);
};

const stopWatchingFile = targetWindow => {
  if (fileWatchers.has(targetWindow)) {
    fileWatchers.get(targetWindow).close();
    fileWatchers.delete(targetWindow);
  }
};

app.on('will-finish-launching', () => {
  app.on('open-file', (e, filePath) => {
    createWindow(filePath);
  });
});

app.on('ready', () => createWindow());

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

module.exports = { openFile, createWindow, saveMarkdown, saveHtml };
