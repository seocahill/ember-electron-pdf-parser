import Ember from 'ember';

const fs = requireNode('fs');
const { ipcRenderer, remote } = requireNode('electron');
const { dialog } = remote;


export default Ember.Component.extend({
  actions: {

    parsePdf() {
      ipcRenderer.send('parse-pdf');
      ipcRenderer.on('parse-pdf-done', function (e, pdfData) {
        fs.writeFile("electron-pdf-test.json", JSON.stringify(pdfData));
        alert("Success!")
      })
    },
    
    pickFile() {
      dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
    }
  }
});
