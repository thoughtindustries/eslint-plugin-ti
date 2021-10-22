const rule = require('../../../lib/rules/no-only');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const options = [{}];

ruleTester.run('no-only', rule, {
  valid: [
    {
      code: 'describe("fake test", () => {})',
      filename: 'describe-test.spec.js',
      options
    },
    {
      code: 'it("should be a fake test", () => {})',
      filename: 'it-test.spec.js',
      options
    }
  ],
  invalid: [
    {
      code: 'describe.only("fake test", () => {})',
      options,
      filename: 'describe-test.spec.js',
      errors: [{ message: 'describe.only not permitted' }]
    },
    {
      code: 'it.only("should be a fake test", () => {})',
      options,
      filename: 'it-test.spec.js',
      errors: [{ messageId: 'noOnly' }]
    },
    {
      code: 'describe("fake nested", () => {it.only("should be a fake test", () => {})})',
      options: [{ fix: true }],
      output: 'describe("fake nested", () => {it("should be a fake test", () => {})})',
      filename: 'describe-it-test.spec.js',
      errors: [{ messageId: 'noOnly' }]
    },
    {
      code: 'describe.only("fake nested", () => {it.only("should be a fake test", () => {})})',
      options: [{ fix: true }],
      output: 'describe("fake nested", () => {it("should be a fake test", () => {})})',
      filename: 'describe-it-test.spec.js',
      errors: [{ message: 'describe.only not permitted' }, { message: 'it.only not permitted' }]
    },
    {
      code: 'it.only("should be a fake test", () => {})',
      output: 'it("should be a fake test", () => {})',
      filename: 'fix-it-test.spec.js',
      options: [{ fix: true }],
      errors: [{ message: 'it.only not permitted' }]
    }
  ]
});
