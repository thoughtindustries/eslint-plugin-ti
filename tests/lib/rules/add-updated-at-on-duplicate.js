const rule = require('../../../lib/rules/add-updated-at-on-duplicate');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
const options = [{}];

ruleTester.run('add-updated-at-on-duplicate', rule, {
  valid: [
    {
      code: `function update(db, data) {
        return wrapper({
          postgres: async () => {
            const model = postgresBase.getModel(db.postgres, 'table');
            const results = await model.bulkCreate(data, {
              updateOnDuplicate: [
                'something',
                'somethingElse',
                'updatedAt'
              ]
            });
      
            return toPlainObject(results);
          }
        });
      }`,
      options
    },
    {
      code: `function update(db, data) {
        return wrapper({
          postgres: async () => {
            const model = postgresBase.getModel(db.postgres, 'table');
            const results = await model.bulkCreate(data);
      
            return toPlainObject(results);
          }
        });
      }`,
      options
    },
    {
      code: `function update(db, data) {
        return wrapper({
          postgres: async () => {
            const result = await postgresBase
            .getModel(db.postgres, tableName)
            .bulkCreate(newData, ops);
            
            return result;
          }
        });
      }`,
      options
    },
    {
      code: `function update(db, data) {
        return wrapper({
          postgres: async () => {
            const model = postgresBase.getModel(db.postgres, 'table');
            const results = await model.bulkCreate(data, { some: 'prop' });
      
            return toPlainObject(results);
          }
        });
      }`,
      options
    },
    {
      code: `function insertOrUpdate(db, expirations) {
        return wrapper({
          postgres: async () => {
            const model = postgresBase.getModel(db.postgres, 'someTable');
            await model.bulkCreate(expirations, {
              updateOnDuplicate: Object.keys(expirations[0])
            });
          }
        });
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `function update(db, data) {
        return wrapper({
          postgres: async () => {
            const model = postgresBase.getModel(db.postgres, 'table');
            const results = await model.bulkCreate(data, {
              updateOnDuplicate: [
                'something',
                'somethingElse'
              ]
            });
      
            return toPlainObject(results);
          }
        });
      }`,
      options,
      errors: [{ messageId: 'addUpdatedAtOnDuplicate' }]
    }
  ]
});
