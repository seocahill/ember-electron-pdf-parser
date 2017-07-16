import Ember from 'ember';

const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;

export default Ember.Component.extend({
  file: null,
  rows: [],

  actions: {

    parsePdf() {
      ipcRenderer.send('parse-pdf', this.get('file'));
      ipcRenderer.once('parse-pdf-done', (e, pdfData) => this._displayPdf(pdfData));
    },
    
    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this.set('file', files[0]));
    },

    clear() {
      this.setProperties({ rows: [], file: null });
    }
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
    this.get('rows').addObject(pageRows);
    pageRows = null;
  }
});
