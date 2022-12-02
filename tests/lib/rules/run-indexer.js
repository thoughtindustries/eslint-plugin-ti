const rule = require('../../../lib/rules/run-indexer');
const RuleTester = require('eslint').RuleTester;
const path = require('path');
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
const indexerTestPath = `${path.resolve('tests/lib/rules/mocks/indexers/')}/`;
const options = [{ indexerPattern: `${indexerTestPath}*_indexer.js` }];

ruleTester.run('run-indexer', rule, {
  valid: [
    {
      code: `function dbFunc() {
        const tableNameVarHere = 'learningPaths';
        dbBatch.updateAll(r, tableNameVarHere, {}, { updatedAt: r.now() });
      
        learningPathIndexer.index();
      }`,
      options
    },
    {
      code: `async function dbFunc() {
        let tableName = '';
        tableName = 'learningPaths';

        await r.pool.run(
          r.table(tableName).update({ updatedAt: r.now() })
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `async function dbFunc() {
        await r.pool.run(
          r.table('skipThisTableSinceNotIndexed').update({})
        );
      }`,
      options
    },

    // comment to disable next line
    {
      code: `async function dbFunc() {
        // eslint-disable-next-line run-indexer
        await r.pool.run(
          r.table('learningPaths').update({ updatedAt: r.now() })
        );
      }`,
      options
    },
    {
      code: `function dbFunc() {
        // eslint-disable-next-line run-indexer
        dbBatch.insert(r, tableNameVarHere);
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `async function dbFunc() {
        const newLearningPathAttrs = { updatedAt: r.now() };
      
        return await r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );
      }`,
      options,
      errors: [{ messageId: 'missingIndexer', data: { table: 'learningPaths' } }]
    },
    {
      code: `async function dbFunc() {
        const newLearningPathAttrs = { updatedAt: r.now() };

        learningPathIndexer.index();
      
        return await r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );
      }`,
      options,
      errors: [{ messageId: 'missingIndexer', data: { table: 'learningPaths' } }]
    },
    {
      code: `async function dbFunc() {
        dbBatch.insert(r, 'learningPaths');
      }`,
      options,
      errors: [{ messageId: 'missingIndexer', data: { table: 'learningPaths' } }]
    }
  ]
});
