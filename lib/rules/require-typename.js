// https://astexplorer.net/ is your friend

const { parse, visit } = require('graphql');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require __typename in graphql selection sets',
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    ],
    messages: {
      missingTypename: 'Missing __typename for {{selection}}'
    }
  },

  create: function (context) {
    return {
      'TaggedTemplateExpression[tag.name="gql"]'(node) {
        const query = node.quasi.quasis.map(element => element.value.cooked).join('');
        let document;
        try {
          document = parse(query);
        } catch (e) {
          console.warn(`[graphql-eslint/processor]: Unable to process query "${query}": `, e);
        }

        if (document) {
          try {
            checkForTypenames(document);
          } catch (e) {
            context.report({
              node,
              ruleId: 'ti/require-typename',
              messageId: 'missingTypename',
              data: { selection: e.selection }
            });
          }
        }
      }
    };
  }
};

// https://github.com/apollographql/apollo-client/blob/f09b83134d4552ad331c688d7d4cd6f45960d70a/src/utilities/graphql/transform.ts#L212-L262
function checkForTypenames(doc) {
  return visit(doc, {
    SelectionSet: {
      enter(node, _key, parent) {
        // Don't add __typename to OperationDefinitions.
        if (parent && parent.kind === 'OperationDefinition') {
          return;
        }

        // No changes if no selections.
        const { selections } = node;
        if (!selections) {
          return;
        }

        // If selections already have a __typename, or are part of an
        // introspection query, do nothing.
        const skip = selections.some(selection => {
          return (
            isField(selection) &&
            (selection.name.value === '__typename' || selection.name.value.lastIndexOf('__', 0) === 0)
          );
        });
        if (skip) {
          return;
        }

        // If this SelectionSet is @export-ed as an input variable, it should
        // not have a __typename field (see issue #4691).
        const field = parent;
        if (isField(field) && field.directives && field.directives.some(d => d.name.value === 'export')) {
          return;
        }

        // If this is a __type/enumValues query, execlude as those do not need typename's.
        if (isField(field) && (field.name.value === '__type' || field.name.value === 'enumValues')) {
          return;
        }

        const err = new Error('Missing __typename');
        err.selection = parent.name.value;

        throw err;
      }
    }
  });
}

function isField(selection) {
  return selection.kind === 'Field';
}
