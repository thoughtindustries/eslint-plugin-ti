const rule = require('../../../lib/rules/use-db-layer');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
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
        await r.translations.insert(r, { updatedAt: r.literal() })
      }`,
      options,
      errors: [{ messageId: 'convertRethinkdbFunctions' }]
    },
    {
      code: `async function dbFunc() {
        await r.pool.run(
          r.table('translations').insert({ id: 'sso-block', bundle: uuidv5('oid', 'global-bundle') })
        );
      }`,
      options,
      output: `async function dbFunc() {
        await r['translations'].insert(r, { id: 'sso-block', bundle: uuidv5('oid', 'global-bundle') });
      }`,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `async function dbFunc() {
        const tableName = 'translations';
        await r.pool.run(r.table(tableName).update({ updatedAt: r.now(), foo: 'bar' }));
      }`,
      output: `async function dbFunc() {
        const tableName = 'translations';
        await r[tableName].update(r, {
          foo: 'bar'
        });
      }`,
      options,
      errors: [{ messageId: 'useDbLayer' }, { messageId: 'removeTimestamps' }]
    },
    {
      code: `r.pool.run(
          r
            .table('assets')
            .insert(
              {
                certificateTemplateSupplementalAssets
              },
              { returnChanges: 'always' }
            )('changes')
            .nth(0)('new_val')
        )`,
      output: `r['assets'].insertAndReturnFirstRow(r, {
  certificateTemplateSupplementalAssets
});`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `async function dbFunc() {
        (await r.pool.run(r.table('assets').insert(
          {
            certificateTemplateSupplementalAssets
          },
          { returnChanges: 'always' }
        ))).changes[0].new_val;
      }`,
      output: `async function dbFunc() {
        await r['assets'].insertAndReturnFirstRow(r, {
          certificateTemplateSupplementalAssets
        });
      }`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `async function dbFunc() {
        const changes = (await r.pool.run(r.table('assets').insert(
          {
            certificateTemplateSupplementalAssets
          },
          { returnChanges: true }
        ))).changes.map(change => change.new_val)
      }`,
      output: `async function dbFunc() {
        const changes = await r['assets'].insert(r, {
          certificateTemplateSupplementalAssets
        });
      }`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `async function dbFunc() {
        await r.pool.run(r.table('assets').get('47e1a4e2-701a-4f1d-aa6b-55fed4343459'))
      }`,
      output: `async function dbFunc() {
        await r['assets'].findById(r, '47e1a4e2-701a-4f1d-aa6b-55fed4343459');
      }`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `r.pool.run(r.table('assets').get('47e1a4e2-701a-4f1d-aa6b-55fed4343459').update({
        certificateTemplateSupplementalAssets
      }))`,
      output: `r['assets'].update(r, '47e1a4e2-701a-4f1d-aa6b-55fed4343459', {
        certificateTemplateSupplementalAssets
      });`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `r.pool.run(r.table('assets')
        .get('47e1a4e2-701a-4f1d-aa6b-55fed4343459')
        .update(
          {
            certificateTemplateSupplementalAssets
          },
          { returnChanges: 'always' }
        )('changes').nth(0)('new_val')
      );`,
      output: `r['assets'].updateAndReturnFirstRow(r, '47e1a4e2-701a-4f1d-aa6b-55fed4343459', {
  certificateTemplateSupplementalAssets
});`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `async function dbFunc() {
        (await r.pool.run(r.table('assets').get('47e1a4e2-701a-4f1d-aa6b-55fed4343459').update(
          {
            certificateTemplateSupplementalAssets
          },
          { returnChanges: 'always' }))
        ).changes[0].new_val;
      }`,
      output: `async function dbFunc() {
        r['assets'].updateAndReturnFirstRow(r, '47e1a4e2-701a-4f1d-aa6b-55fed4343459', {
          certificateTemplateSupplementalAssets
        });
      }`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    },
    {
      code: `r.pool.run(
        r.table('courseGroups').get('47e1a4e2-701a-4f1d-aa6b-55fed4343459')('asset').default(null)
      );`,
      output: `r['courseGroups'].getAttributesById(r, ['47e1a4e2-701a-4f1d-aa6b-55fed4343459'], ['asset'])?.[0]?.['asset'];`,
      options,
      errors: [{ messageId: 'useDbLayer' }]
    }
  ]
});
