// https://astexplorer.net/ is your friend

const utils = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Force use of database layer if it is available' ,
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          tables: {
            type: 'array',
            items: {
              type: 'string'
            },
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      useDbLayer: 'Use the {{table}} database layer.'
    }
  },

  create: function (context) {
    if (!(context.options || []).length || !context.options[0].tables) {
      throw new Error('`tables` must be set');
    }

    const { tables } = context.options[0];

    return {
      'CallExpression[callee.property][callee.property.name="table"]'(
        node
      ) {
        const { table } = utils.getTableOrMessageId(node.arguments[0], node);

        if (tables.includes(table)) {
          context.report({
            node,
            messageId: 'useDbLayer',
            data: { table }
          });
        }
      }
    };
  }
};
