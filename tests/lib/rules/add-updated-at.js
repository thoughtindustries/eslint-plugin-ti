const rule = require('../../../lib/rules/add-updated-at');
const RuleTester = require('eslint').RuleTester;
const path = require('path');
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const indexerTestPath = `${path.resolve('tests/lib/rules/mocks/indexers/')}/`;
const options = [{ indexerPattern: `${indexerTestPath}*_indexer.js`, limitToIndexedTables: true }];

ruleTester.run('add-updated-at', rule, {
  valid: [
    {
      code: `function* dbFunc() {
        const newLearningPathAttrs = {
          updatedAt: r.now()
        };
      
        const lp = yield r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );
      
        learningPathIndexer.index(lp);
      
        return lp;
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        const newLearningPathAttrs = { updatedAt: r.now() };
      
        const lp = yield r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );

        learningPathIndexer.index(lp);

        return lp;
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        yield dbBatch.updateAll(
          r,
          'learningPaths',
          competencyAssessmentIds,
          { questions: [], updatedAt: r.now() }
        );
      
        learningPathIndexer.index();
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        const variableTableName = 'learningPaths';
        const lp = yield r.pool.run(
          r.table(variableTableName).update({ updatedAt: r.now() })
        );

        learningPathIndexer.index(lp);
      }`,
      options
    },
    {
      code: `function dbFunc() {
        const tableNameVarHere = 'learningPaths';
        dbBatch.updateAll(r, tableNameVarHere, {}, { updatedAt: r.now() });
      
        learningPathIndexer.index();
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('learningPaths').update({ updatedAt: r.now() })
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('learningPaths').update({ updatedAt: r.now() })
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        let tableName = '';
        tableName = 'learningPaths';

        yield r.pool.run(
          r.table(tableName).update({ updatedAt: r.now() })
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('skipThisTableSinceNotIndexed').update({})
        );
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        crypto.update();
      }`,
      options
    },

    // comment to disable next line
    {
      code: `function* dbFunc() {
        const newLearningPathAttrs = {};
      
        // eslint-disable-next-line add-updated-at
        const lp = yield r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );
      
        learningPathIndexer.index(lp);
      
        return lp;
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield dbBatch.updateAll(
          r,
          'learningPaths',
          competencyAssessmentIds,
          { questions: [] }
        );
      
        learningPathIndexer.index();
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield dbBatch.updateAll(
          r,
          'learningPaths',
          competencyAssessmentIds,
          function () {}
        );
      
        learningPathIndexer.index();
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield r.pool.run(
          r.table(variableTableName).update({ updatedAt: r.now() })
        );
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield r.pool.run(
          r.table(function() { return 'learningPaths'; }()).update({ updatedAt: r.now() })
        );
      }`,
      options
    },
    {
      code: `function dbFunc() {
        // eslint-disable-next-line add-updated-at
        dbBatch.insert(r, tableNameVarHere);
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield r.pool.run(
          r.table('learningPaths').update()
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        // eslint-disable-next-line add-updated-at
        yield r.pool.run(
          r.table('learningPaths').update({})
        );
      
        learningPathIndexer.index({});
      }`,
      options
    },
    {
      code: `function* dbFunc() {
        let tableName = '';
        tableName = 'learningPaths';

        // eslint-disable-next-line add-updated-at
        yield r.pool.run(
          r.table(tableName).update({})
        );
      
        learningPathIndexer.index({});
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `function* dbFunc() {
        const newLearningPathAttrs = {};
      
        const lp = yield r.pool.run(
          r
            .table('learningPaths')
            .insert(newLearningPathAttrs, { returnChanges: 'always' })('changes')
            .nth(0)('new_val')
        );
      
        learningPathIndexer.index(lp);
      
        return lp;
      }`,
      options,
      errors: [
        {
          messageId: 'missingUpdate',
          data: { variableName: 'newLearningPathAttrs', table: 'learningPaths' }
        }
      ]
    },
    {
      code: `function* dbFunc() {
        yield dbBatch.updateAll(
          r,
          'learningPaths',
          competencyAssessmentIds,
          { questions: [] }
        );
      
        learningPathIndexer.index();
      }`,
      options,
      errors: [
        { messageId: 'missingUpdatedDbBatch', data: { type: 'updateAll', table: 'learningPaths' } }
      ]
    },
    {
      code: `function* dbFunc() {
        yield dbBatch.updateAll(
          r,
          'learningPaths',
          competencyAssessmentIds,
          function () {}
        );
      
        learningPathIndexer.index();
      }`,
      options,
      errors: [
        { messageId: 'markedMissingDbBatch', data: { type: 'updateAll', table: 'learningPaths' } }
      ]
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table(variableTableName).update({ updatedAt: r.now() })
        );
      }`,
      options,
      errors: [{ messageId: 'markedMissing', data: { type: 'update' } }]
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table(function() { return 'learningPaths'; }()).update({ updatedAt: r.now() })
        );
      }`,
      options,
      errors: [{ messageId: 'markedMissing', data: { type: 'update' } }]
    },
    {
      code: `function dbFunc() {
        dbBatch.insert(r, tableNameVarHere);
      }`,
      options,
      errors: [{ messageId: 'batchMarkedMissing', data: { type: 'insert' } }]
    },
    {
      code: `function dbFunc() {
        dbBatch.insert(r, function() { return 'learninPaths'; }());
      }`,
      options,
      errors: [{ messageId: 'batchMarkedMissing', data: { type: 'insert' } }]
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('learningPaths').update()
        );
      
        learningPathIndexer.index({});
      }`,
      options,
      errors: [{ messageId: 'missingUpdatedTable', data: { table: 'learningPaths' } }]
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('learningPaths').update({})
        );
      
        learningPathIndexer.index({});
      }`,
      options,
      errors: [{ messageId: 'missingOnTable', data: { table: 'learningPaths' } }]
    },
    {
      code: `function* dbFunc() {
        let tableName = '';
        tableName = 'learningPaths';

        yield r.pool.run(
          r.table(tableName).update({})
        );
      
        learningPathIndexer.index({});
      }`,
      options,
      errors: [{ messageId: 'missingOnTable', data: { table: 'learningPaths' } }]
    },
    {
      code: `function* dbFunc() {
        yield r.pool.run(
          r.table('skipThisTableSinceNotIndexed').update({})
        );
      }`,
      options: [{ indexerPattern: `${indexerTestPath}*_indexer.js`, limitToIndexedTables: false }],
      errors: [{ messageId: 'missingOnTable', data: { table: 'skipThisTableSinceNotIndexed' } }]
    }
  ]
});
