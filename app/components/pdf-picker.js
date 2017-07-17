import Ember from 'ember';

const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;
const { unparse } = requireNode('papaparse');
const fs = requireNode('fs');

export default Ember.Component.extend({
  pages: [],

  actions: {

    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this._parsePdf(files[0]));
    },

    clear() {
      this.setProperties({ rows: [], file: null });
    },

    save() {
      dialog.showSaveDialog({ 
        filters: [{ name: 'Csv', extensions: ['csv'] }]
      }, (path) => this._saveCsv(path));
    }
  },

  _saveCsv(path) {
    const rows = [];
    this.get('pages').forEach((page) => rows.addObjects(page));
    debugger
    const data = unparse(rows, { header: false });
    fs.writeFile(path, data);
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
    let rows = {};
    const xPositions = [];

    page.Texts.forEach((text) => {
      const y = (text.y).toFixed(1);
      const x = text.x;
      pageRows[y] = pageRows[y] || 0;
      pageRows[y] += 1;
      xPositions.addObject(x);
    });
    
    const values = (Object.values(pageRows));
    const domain = [0, 40];
    const threshold = Math.max(...values);
    const histogram = d3.histogram().domain(domain).thresholds(threshold);
    const bins = histogram(xPositions);

    page.Texts.forEach((text) => {
      const y = (text.y).toFixed(1);
      const x = text.x;
      const t = unescape(text.R[0].T);

      bins.forEach((bin, index) => {
        if (bin.includes(x)) {
          rows[y] = rows[y] || Array((threshold + 1)).fill("");
          rows[y][index] = t;
        }
      });
    });
    this.get('pages').addObject(Object.values(rows));
  }
});
