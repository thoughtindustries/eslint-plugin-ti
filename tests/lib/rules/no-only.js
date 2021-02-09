const rule = require('../../../lib/rules/no-only');
const RuleTester = require('eslint').RuleTester;
const path = require('path');
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const indexerTestPath = `${path.resolve('tests/lib/rules/mocks/indexers/')}/`;

ruleTester.run('no-only', rule, {
  valid: [
    {
      code: `describe('test', () => {
        it('should test', () => {
          const value = 'expectation';
          assert.strictEqual(value, 'expectation');
        });
      })`
    },

    // comment to disable next line
    {
      code: ` // eslint-disable-next-line no-only
      describe.only('test', () => {
        // eslint-disable-next-line no-only
        it.only('should test', () => {
          const value = 'expectation';
          assert.strictEqual(value, 'expectation');
        });
      })`
    }
  ],
  invalid: [
    {
      code: `describe.only('test', () => {
        it.only('should test', () => {
          const value = 'expectation';
          assert.strictEqual(value, 'expectation');
        });
      })`,
      errors: [
        { messageId: 'describeOnly', data: { description: 'test' } },
        { messageId: 'itOnly', data: { description: 'should test' } }
      ]
    },
    {
      code: `describe.only('test', () => {
        it('should test', () => {
          const value = 'expectation';
          assert.strictEqual(value, 'expectation');
        });
      })`,
      errors: [{ messageId: 'describeOnly', data: { description: 'test' } }]
    },
    {
      code: `describe('test', () => {
        it.only('should test', () => {
          const value = 'expectation';
          assert.strictEqual(value, 'expectation');
        });
      })`,
      errors: [{ messageId: 'itOnly', data: { description: 'should test' } }]
    },
    {
      code: `describe('test', () => {
        describe.only('test 2', () => {
          describe.only('test 3', () => {
            it.only('should test', () => {
              const value = 'expectation';
              assert.strictEqual(value, 'expectation');
            });
          });
        });
      })`,
      errors: [
        { messageId: 'describeOnly', data: { description: 'test 2' } },
        { messageId: 'describeOnly', data: { description: 'test 3' } },
        { messageId: 'itOnly', data: { description: 'should test' } }
      ]
    }
  ]
});
