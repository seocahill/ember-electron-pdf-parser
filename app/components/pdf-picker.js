/* global d3 */

import Ember from 'ember';

const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;
const { unparse } = requireNode('papaparse');
const fs = requireNode('fs');

export default Ember.Component.extend({
  pages: [],
  data: [],
  thresholds: [],

  currentPage: null,

  currentIndex: Ember.computed('currentPage', function() {
    return this.get('pages').indexOf(this.get('currentPage'));
  }),

  actions: {

    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this._parsePdf(files[0]));
    },

    reset() {
      this.setProperties({ pages: [], data: [], thresholds: [], currentPage: null });
    },

    insert() {
      dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this._insertPage(files[0]));
    },

    adjustThreshold(adjustment) {
      const pageIdx = this.get('currentIndex');
      const page = this.get('data').objectAt(pageIdx);
      this._pageToRows(page, pageIdx, adjustment)
    },

    save() {
      dialog.showSaveDialog({ 
        filters: [{ name: 'Csv', extensions: ['csv'] }]
      }, (path) => this._saveCsv(path));
    },

    next() {
      let idx = this.get('currentIndex');
      const nextPage = this.get('pages').objectAt(idx + 1)
      if (nextPage) {
        this.set('currentPage', nextPage);
      } else {
        this.set('currentPage', this.get('pages.firstObject'));
      }
      this.get('pageNumber')(this.get('currentIndex') + 1);
    },

    prev() {
      let idx = this.get('currentIndex');
      const lastPage = this.get('pages').objectAt(idx - 1)
      if (lastPage) {
        this.set('currentPage', lastPage);
      } else {
        this.set('currentPage', this.get('pages.lastObject'));
      }
      this.get('pageNumber')(this.get('currentIndex') + 1);
    }
  },

  _insertPage(file) {
    ipcRenderer.send('parse-pdf', file);
    ipcRenderer.once('parse-pdf-done', (e, pdfData) => this._pageToRows(pdfData.formImage.Pages[0], this.get('currentIndex')));
  },

  _saveCsv(path) {
    const rows = [];
    this.get('pages').forEach((page) => rows.addObjects(page));
    const data = unparse(rows, { header: false });
    fs.writeFile(path, data);
  },

  _parsePdf(file) {
    ipcRenderer.send('parse-pdf', file);
    ipcRenderer.once('parse-pdf-done', (e, pdfData) => this._displayPdf(pdfData));
  },

  _displayPdf(data) {
    this.set('data', data.formImage.Pages);
    data.formImage.Pages.forEach((page, idx) => {
      this._pageToRows(page, idx);
    });
    this.set('currentPage', this.get('pages.firstObject'));
    this.get('pageNumber')(1);
    this.get('pageLength')(this.get('pages.length'));
  },

  _pageToRows(page, idx, adjustment = 0) {
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
    let threshold = this.get('thresholds').objectAt(idx) || Math.max(...values);
    threshold += adjustment
    this.get('thresholds').insertAt(idx, threshold);
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
    
    if (this.get('pages').objectAt(idx)) {
      this.get('pages').removeAt(idx);
      this.get('pages').insertAt(idx, Object.values(rows));
      this.set('currentPage', this.get('pages').objectAt(idx))
    } else {
      this.get('pages').addObject(Object.values(rows));
    }
  }
});
