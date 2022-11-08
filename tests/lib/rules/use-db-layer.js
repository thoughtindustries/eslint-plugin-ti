const rule = require('../../../lib/rules/use-db-layer');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const options = [];

ruleTester.run('use-db-layer', rule, {
  valid: [
    {
      code: `async function dbFunc() {
        const tableName = 'learningPaths';
        await r[tableName].update({ updatedAt: new Date() });
      }`,
      options
    },
    {
      code: `async function dbFunc() {
        await r.learningPaths.update({ updatedAt: new Date() });
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `async function dbFunc() {
        await r.pool.run(
          r.table('translations').insert({ id: 'sso-block', bundle: uuidv5('oid', 'global-bundle') })
        );
      }`,
      options,
      errors: [{ messageId: 'useDbLayer', data: { table: 'translations' } }]
    },
    {
      code: `async function dbFunc() {
        const tableName = 'translations';
        await r.pool.run(r.table(tableName).update({ updatedAt: r.now() }));
      }`,
      options,
      errors: [{ messageId: 'useDbLayer', data: { table: 'translations' } }]
    },
    {
      code: `async function dbFunc() {
        await r.translations.insert(r, { updatedAt: r.now() })
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        await r.translations.insert(r, [{ updatedAt: r.now() }])
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        const item = { updatedAt: r.now() };
        await r.translations.insert(r, [item])
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        const item = { updatedAt: r.now() };
        await r.translations.insert(r, item)
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        const item = { updatedAt: r.now() };
        await r.translations.insertAndReturnFirstRow(r, item)
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        const item = { updatedAt: r.now() };
        await r.translations.updateAndReturnFirstRow(r, 'id', item)
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        const item = { updatedAt: r.now() };
        await r.translations.update(r, 'id', item)
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    }
  ]
});
