import Ember from 'ember';

const fs = requireNode('fs');
const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;


export default Ember.Component.extend({
  file: null,

  actions: {

    parsePdf() {
      ipcRenderer.send('parse-pdf', this.get('file'));
      ipcRenderer.on('parse-pdf-done', function (e, pdfData) {
        fs.writeFile("electron-pdf-test.json", JSON.stringify(pdfData));
        alert("Success!")
      })
    },
    
    pickFile() {
      dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{ name: 'Pdf', extensions: ['pdf'] }]
      }, (files) => this.set('file', files[0]));
    }
  }
});
