const rule = require('../../../lib/rules/id-helper');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
const options = [{}];

ruleTester.run('id-helper', rule, {
  valid: [
    {
      code: `function upsertBackgroundJob(db, jobs) {
        const newData = idHelper(data);
        return wrapper({
          rethinkdb: async () => {
            const r = db.rethinkdb;
      
            return (
              await r.pool.run(
                r.table('backgroundJobs').insert(jobs, { returnChanges: 'always', conflict: 'replace' })
              )
            ).changes.map(change => change.new_val);
          },
      
          postgres: async () => {
            const result = await postgresBase.getModel(db.postgres, 'backgroundJobs').bulkCreate(jobs, {
              updateOnDuplicate: ['company']
            });
      
            return toPlainObject(result);
          }
        });
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `function upsertBackgroundJob(db, jobs) {
        return wrapper({
          rethinkdb: async () => {
            const r = db.rethinkdb;
      
            return (
              await r.pool.run(
                r.table('backgroundJobs').insert(jobs, { returnChanges: 'always', conflict: 'replace' })
              )
            ).changes.map(change => change.new_val);
          },
      
          postgres: async () => {
            const result = await postgresBase.getModel(db.postgres, 'backgroundJobs').bulkCreate(jobs, {
              updateOnDuplicate: ['company']
            });
      
            return toPlainObject(result);
          }
        });
      }`,
      options,
      errors: [{ messageId: 'useIdHelper' }]
    },
  ]
});
