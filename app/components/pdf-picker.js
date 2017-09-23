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
  max: 40,
  min: 0,

  currentPage: null,

  currentIndex: Ember.computed('currentPage', function() {
    return this.get('pages').indexOf(this.get('currentPage'));
  }),

  currentThreshold: Ember.computed('currentIndex', 'currentPage', function() {
    const idx = this.get('currentIndex');
    return this.get('thresholds').objectAt(idx);
  }),

  actions: {

    updateCell(row, idx, newVal) {
      row[idx] = newVal
    },

    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this._parsePdf(files[0]));
    },

    reset() {
      this.setProperties({ pages: [], data: [], thresholds: [], currentPage: null, max: 40 });
      this.get('pageNumber')(null);
      this.get('pageLength')(null);
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

    concatRow(row, idx) {
      let page = this.get('currentPage');
      const value = row.join('');
      let newRow = Array((row.length)).fill("");
      newRow[0] = value;
      page.removeAt(idx);
      page.insertAt(idx, newRow);
    },

    adjustDomain(adjustment) {
      const pageIdx = this.get('currentIndex');
      const page = this.get('data').objectAt(pageIdx);
      this._pageToRows(page, pageIdx, 0, adjustment);
    },

    reRenderUsingSplit() {
      const pageIdx = this.get('currentIndex');
      const page = this.get('data').objectAt(pageIdx);
      this._pageToRows(page, pageIdx, 0, 0, true);
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
    ipcRenderer.once('parse-pdf-done', (e, pdfData) => {
      // uncomment to debug
      // dialog.showSaveDialog({
      //   filters: [{ name: 'Json', extensions: ['json'] }]
      // }, (path) => fs.writeFile(path, JSON.stringify(pdfData)));
      this._displayPdf(pdfData)
    });
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

  _pageToRows(page, idx, adjustment = 0, maxAdj = 0, split = false) {
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
    let max = this.get('max');
    let min = this.get('min');
    let pdfMax = Math.round(Math.max(...xPositions));
    let pdfMin = Math.round(Math.min(...xPositions));
    max = Math.max(max, pdfMax);
    min = Math.max(min, pdfMin);
    max += maxAdj;
    this.set('max', max);
    this.set('min', min);
    const domain = [min, max];

    let threshold = this.get('thresholds').objectAt(idx) || Math.max(...values);
    threshold += adjustment
    this.get('thresholds')[idx] = threshold;
    const histogram = d3.histogram().domain(domain).thresholds(threshold);
    const bins = histogram(xPositions);
    let maxRow = 0;

    page.Texts.forEach((text) => {
      const y = (text.y).toFixed(1);
      const x = text.x;
      const t = unescape(text.R[0].T);

      bins.forEach((bin, index) => {
        if (bin.includes(x)) {
          rows[y] = rows[y] || [];
          if (Ember.isPresent(rows[y][index])) {
            split ? rows[y].insertAt((index + 1), t) : rows[y][index] += t;
          } else {
            rows[y][index] = t;
          }
          maxRow = Math.max(maxRow, rows[y].get('length'));
        }
      });
    });

    let rowValues = Object.values(rows);
    rowValues.forEach((row) => {
      if (row.get('length') < maxRow) {
        const padding = maxRow - row.get('length');
        const cells = Array((padding)).fill("");
        row.pushObjects(cells);
      }
    })
    
    if (this.get('pages').objectAt(idx)) {
      this.get('pages').removeAt(idx);
      this.get('pages').insertAt(idx, rowValues);
      this.set('currentPage', this.get('pages').objectAt(idx))
    } else {
      this.get('pages').addObject(rowValues);
    }
  }
});
