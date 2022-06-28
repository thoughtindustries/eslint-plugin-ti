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
      useDbLayer: 'Use the {{table}} database layer.',
      convertRethinkdbFunctions: 'Convert RethinkDB functions'
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
        if (node.arguments && node.arguments.length) {
          const { table } = utils.getTableOrMessageId(node.arguments[0], node);

          if (tables.includes(table)) {
            context.report({
              node,
              messageId: 'useDbLayer',
              data: { table }
            });
          }
        }
      },

      'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(update|insert)/]'(
        node
      ) {
        const table = utils.getProp(node, 'callee.object.property.name');
        if (!table || !tables.includes(table)) {
          return;
        }

        if (node.arguments?.[1]?.type === 'ArrayExpression') {
          node.arguments[1].elements.forEach(arg => {
            arg.properties.forEach(prop => {
              if (utils.getProp(prop, 'value.callee.object.name') === 'r') {
                context.report({
                  node,
                  messageId: 'convertRethinkdbFunctions'
                });
              }
            });
          });
        } else if (node.arguments?.[1]?.type === 'ObjectExpression') {
          node.arguments[1].properties.forEach(prop => {
            if (utils.getProp(prop, 'value.callee.object.name') === 'r') {
              context.report({
                node,
                messageId: 'convertRethinkdbFunctions'
              });
            }
          })
        }
      }
    };
  }
};
