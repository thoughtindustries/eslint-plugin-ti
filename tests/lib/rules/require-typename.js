const rule = require('../../../lib/rules/require-typename');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });
const options = [{}];

ruleTester.run('require-typename', rule, {
  valid: [
    {
      code: 'const x = gql`query { greetings { __typename, hello } }`',
      filename: 'document.graphql',
      options
    },
    {
      code:
        'const x = gql`query greetings { greetingsTypes: __type(name: "Greetings") { name, enumValues { name } } }`',
      filename: 'document.graphql',
      options
    }
  ],
  invalid: [
    {
      code: 'const x = gql`query { greetings { hello } }`',
      options,
      filename: 'document.graphql',
      errors: [{ messageId: 'missingTypename' }]
    }
  ]
});
