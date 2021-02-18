const rule = require('../../../lib/rules/add-translations');
const RuleTester = require('eslint').RuleTester;
const path = require('path');
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const options = [{
  languageFilePath: path.join(__dirname, 'mocks', 'translations', 'languages.js'),
  namespaces: ['lms']
}]

ruleTester.run('add-translations', rule, {
  valid: [],
  invalid: [
    {
      code: ``,
      options,
      filename: '/translations/lms/en.json',
      output: null,
      errors: [
        { messageId: 'missingTranslation', data: { translation: 'learning-path', namespace: 'lms', langKey: 'es' } },
        { messageId: 'missingTranslation', data: { translation: 'course', namespace: 'lms', langKey: 'fr' } },
        { messageId: 'missingTranslation', data: { translation: 'course.title', namespace: 'lms', langKey: 'es' } },
        { messageId: 'missingTranslation', data: { translation: 'course.title', namespace: 'lms', langKey: 'fr' } }
      ]
    }
  ]
});
