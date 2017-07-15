import Ember from 'ember';

const fs = requireNode('fs');
const { ipcRenderer } = requireNode('electron');

export default Ember.Component.extend({
  actions: {
    parsePdf() {
      ipcRenderer.send('parse-pdf');
      ipcRenderer.on('parse-pdf-done', function (e, pdfData) {
        fs.writeFile("electron-pdf-test.json", JSON.stringify(pdfData));
        alert("Success!")
      })
    }
  }
});
