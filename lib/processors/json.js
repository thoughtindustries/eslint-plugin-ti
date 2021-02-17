const jsonService = require('vscode-json-languageservice');
const jsonServiceHandle = jsonService.getLanguageService({});
const fileLintResults = {};
const fileDocuments = {};

module.exports = {
  '.json': {
    preprocess: function(text, fileName) {
      if (fileName.slice(-7) !== 'en.json') {
        return [''];
      }

      const textDocument = jsonService.TextDocument.create(fileName, 'json', 1, text);
      fileDocuments[fileName] = textDocument;
      fileLintResults[fileName] = jsonServiceHandle.parseJSONDocument(textDocument).syntaxErrors;

      return [''];
    },
    postprocess: function(messages, fileName) {
      if (fileName.slice(-7) !== 'en.json') {
        return [];
      }

      fileLintResults[fileName].forEach(error => {
        messages[0].push({
          fatal: true,
          severity: 2,
          message: error.message,
          line: error.range.start.line,
          column: error.range.start.character
        });
      });

      return messages[0];
    },
    supportsAutofix: true
  }
};
