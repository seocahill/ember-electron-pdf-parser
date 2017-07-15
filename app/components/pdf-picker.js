import Ember from 'ember';

const fs = requireNode('fs');
const PDFParser = requireNode("pdf2json");

export default Ember.Component.extend({
  actions: {
    parsePdf() {
      let pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
      pdfParser.on("pdfParser_dataReady", pdfData => {
        fs.writeFile("./pdf-test.json", JSON.stringify(pdfData));
      });
      alert("Success!")
    }
  }
});
