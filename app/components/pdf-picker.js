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
    const vendor = data.formImage.Agency;
    data.formImage.Pages.forEach((page) => {
      this._pageToRows(page);
    });
  },

  _pageToRows(page) {
    let pageRows = {}
    page.Texts.forEach((text) => {
      const idx = (text.y).toFixed(1);
      pageRows[idx] = pageRows[idx] || [];
      pageRows[idx].addObject(unescape(text.R[0].T));
      if (pageRows[idx].length === 1 && text.x > 10) {
        pageRows[idx].unshiftObject("");
      }
    });
    const values = (Object.values(pageRows));
    values.forEach((value) => {
      const times = 8 - value.length;
      for (var i = 0; i < times; i++) {
        value.pushObject("");
      }
    });
    this.get('rows').addObjects(values);
    pageRows = null;
  }
});
