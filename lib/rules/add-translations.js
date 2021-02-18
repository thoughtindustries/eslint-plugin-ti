// https://astexplorer.net/ is your friend

const fs = require('fs');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Make sure all translation documents are up to date with en.json',
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          languageFilePath: {
            type: 'string'
          },
          namespaces: {
            type: 'array'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingTranslation: 'Missing translation key "{{translation}}" in {{namespace}}/locals/{{langKey}}.json'
    },
    fixable: 'code'
  },
  create(context) {
    return {
      Program() {
        if (!(context.options || []).length) {
          throw new Error('`languageFilePath` must be set');
        }

        const { languageFilePath, namespaces } = context.options[0];

        if (!languageFilePath) {
          throw new Error('`languageFilePath` must be set');
        }

        if (!namespaces) {
          throw new Error('`namespaces` must be set');
        }

        const namespace = context.getFilename().split('/').find(l => namespaces.includes(l));

        if (!namespace) {
          return;
        }

        try {
          const languages = require(languageFilePath);

          const english = languages.en;
          Object.keys(languages).forEach(langKey => {
            if (langKey === 'en') {
              return;
            }
            let fixFiles = false;

            Object.keys(english[namespace])
              .filter((l, i) => {
                if (!Object.keys(languages[langKey][namespace]).includes(l)) {
                  context.report({
                    ruleId: 'ti/add-translations',
                    messageId: 'missingTranslation',
                    data: { translation: l, namespace, langKey },
                    loc: {
                      start: { line: i, column: 0 },
                      end: { line: i, column: 0 }
                    },
                    fix() {
                      fixFiles = true;
                    }
                  });
                  return true;
                }

                return false;
              });

            if (fixFiles && process.env.NODE_ENV !== 'test') {
              const newKeys = Object.keys(english[namespace]).reduce((list, key) => {
                list[key] = languages[langKey][namespace][key] || english[namespace][key];
                return list;
              }, {});
              fs.writeFileSync(`${namespace}/locales/${langKey}.json`, JSON.stringify(newKeys, null, 2));
            }
          });
        } catch (e) {
          console.error(e);
          /* Probably a JSON syntax error, let the parser handle the error message */
        }
      }
    }
  }
};
