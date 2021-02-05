const rule = require('../../../lib/rules/walk');
const RuleTester = require('eslint').RuleTester;
const fs = require('fs');
const path = require('path');
const ruleTester = new RuleTester();
const indexerTestPath = `${path.resolve('tests/lib/rules/mocks/indexers/')}/`;
const mockFileContents = fs.readFileSync(path.resolve('tests/lib/rules/mocks/walk/mock_walk_file.js'), 'utf8');


ruleTester.run('walk', rule, {
  valid: [],
  invalid: [
    {
      code: mockFileContents,
      filename: './mocks/walk/mock_walk_file.js',
      options: [{ filePath: './mocks/walk/**/*.js', indexerPath: `${indexerTestPath}*_indexer.js`, indexerPathPrefix: indexerTestPath }],
      errors: [{ messageId: 'missingUpdate', data: { variableName: 'newLearningPathAttrs', table: 'learningPaths' } }],
      parserOptions: { ecmaVersion: 2018 }
    }
  ]
});
