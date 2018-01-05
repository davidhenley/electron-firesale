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

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

markdownView.addEventListener('keyup', e => {
  renderMarkdownToHtml(e.target.value);
  currentWindow.setDocumentEdited(true);
});

openFileButton.addEventListener('click', () => {
  mainProcess.openFile(currentWindow);
});

newFileButton.addEventListener('click', () => {
  mainProcess.createWindow();
});

ipcRenderer.on('file-opened', (_, { file, content }) => {
  markdownView.value = content;
  renderMarkdownToHtml(content);
});
