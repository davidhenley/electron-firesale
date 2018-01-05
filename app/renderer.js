const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main');
const currentWindow = remote.getCurrentWindow();
const marked = require('marked');

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');

let filePath = null;
let originalContent = '';

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

markdownView.addEventListener('keyup', e => {
  const currentContent = e.target.value;

  renderMarkdownToHtml(currentContent);
  currentWindow.setDocumentEdited(originalContent !== currentContent);
});

openFileButton.addEventListener('click', () => {
  mainProcess.openFile(currentWindow);
});

newFileButton.addEventListener('click', () => {
  mainProcess.createWindow();
});

ipcRenderer.on('file-opened', (_, { file, content }) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);
});
