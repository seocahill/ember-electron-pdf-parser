import Ember from 'ember';

const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;

export default Ember.Component.extend({
  rows: [],

  actions: {

    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this._parsePdf(files[0]));
    },

    clear() {
      this.setProperties({ rows: [], file: null });
    }
  },

  _parsePdf(file) {
    ipcRenderer.send('parse-pdf', file);
    ipcRenderer.once('parse-pdf-done', (e, pdfData) => this._displayPdf(pdfData));
  },

  _displayPdf(data) {
    data.formImage.Pages.forEach((page) => {
      this._pageToRows(page);
    });
  },

  _pageToRows(page) {
    let pageRows = {}
    page.Texts.forEach((text) => {
      pageRows[text.y] = pageRows[text.y] || [];
      pageRows[text.y].addObject(text.R[0].T);
    });
    this.get('rows').addObjects(Object.values(pageRows));
    pageRows = null;
  }
});
