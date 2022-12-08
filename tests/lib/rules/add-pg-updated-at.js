const rule = require('../../../lib/rules/add-pg-updated-at');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
const options = [{}];

ruleTester.run('add-pg-updated-at', rule, {
  valid: [
    {
      code: `function update(db, id, data) {
        return wrapper({
          rethinkdb: async () => {
              await db.rethinkdb.pool.run(
                db.rethinkdb
                  .table('someTable')
                  .get(id)
                  .update(
                    {
                      data,
                      updatedAt: db.rethinkdb.now()
                    }
                  )
              );
          },
          postgres: async () => {
            const escaped = db.postgres.escape(JSON.stringify(data));
            await db.postgres.query(
              \`
              UPDATE ti.someTable m
              SET data = data || \${escaped}::jsonb,
              updated_at = $updatedAt
              WHERE m.id = $id
              \`,
              {
                bind: { id, updatedAt: new Date() },
                type: db.postgres.QueryTypes.UPDATE,
                raw: true,
                plain: false
              }
            );
      
            return await postgresBase.findById(db.postgres, 'someTable', id);
          }
        });
      }`,
      options
    },
    {
      code: `function update(db, id, data) {
        return wrapper({
          rethinkdb: async () => {
              await db.rethinkdb.pool.run(
                db.rethinkdb
                  .table('someTable')
                  .get(id)
                  .update(
                    {
                      data,
                      updatedAt: db.rethinkdb.now()
                    }
                  )
              );
          },
          postgres: async () => {
            const escaped = db.postgres.escape(JSON.stringify(data));
            await db.postgres.query(
              'UPDATE ti.someTable m SET data = data || \${escaped}::jsonb, updated_at = $updatedAt WHERE m.id = $id',
              {
                bind: { id, updatedAt: new Date() },
                type: db.postgres.QueryTypes.UPDATE,
                raw: true,
                plain: false
              }
            );
      
            return await postgresBase.findById(db.postgres, 'someTable', id);
          }
        });
      }`,
      options
    },
    {
      code: `function update(db, id, data) {
        return wrapper({
          rethinkdb: async () => {
              await db.rethinkdb.pool.run(
                db.rethinkdb
                  .table('someTable')
                  .get(id)
                  .update(
                    {
                      data,
                      updatedAt: db.rethinkdb.now()
                    }
                  )
              );
          },
          postgres: async () => {
            const escaped = db.postgres.escape(JSON.stringify(data));
            await db.postgres.query(
              'SELECT FROM ti.someTable',
              {
                type: db.postgres.QueryTypes.SELECT,
                raw: true,
                plain: false
              }
            );
      
            return await postgresBase.findById(db.postgres, 'someTable', id);
          }
        });
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `function update(db, id, data) {
        return wrapper({
          rethinkdb: async () => {
              await db.rethinkdb.pool.run(
                db.rethinkdb
                  .table('someTable')
                  .get(id)
                  .update(
                    {
                      data,
                      updatedAt: db.rethinkdb.now()
                    }
                  )
              );
          },
          postgres: async () => {
            const escaped = db.postgres.escape(JSON.stringify(data));
            await db.postgres.query(
              \`
              UPDATE ti.someTable m
              SET data = data || \${escaped}::jsonb
              WHERE m.id = $id
              \`,
              {
                bind: { id },
                type: db.postgres.QueryTypes.UPDATE,
                raw: true,
                plain: false
              }
            );
      
            return await postgresBase.findById(db.postgres, 'someTable', id);
          }
        });
      }`,
      options,
      errors: [{ messageId: 'addPgUpdatedAt' }]
    }
  ]
});
