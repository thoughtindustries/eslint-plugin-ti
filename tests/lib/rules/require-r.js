const rule = require('../../../lib/rules/require-r');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2021 } });
const options = [{}];

ruleTester.run('require-r', rule, {
  valid: [
    {
      code: `async function getUsers(ids) {
        const users = await r.users.findById(r, ids);
      }`,
      options
    },
    {
      code: `async function getUsers(slug) {
        const users = await this.r.users.findBySlug(r, slug);
      }`,
      options
    }
  ],
  invalid: [
    {
      code: `async function getUsers(ids) {
        const users = await r.users.findById(ids);
      }`,
      options,
      errors: [{ messageId: 'requireR' }]
    },
    {
      code: `async function getUsers(slug) {
        const users = await this.r.users.findBySlug(slug);
      }`,
      options,
      errors: [{ messageId: 'requireR' }]
    }
  ]
});
