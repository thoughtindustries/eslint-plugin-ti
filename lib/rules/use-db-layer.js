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

      'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(update|insert|insertAndReturnFirstRow)/]'(
        node
      ) {
        if (node.arguments?.[1]) {
          checkForRethinkFunction(node.arguments[1], node, tables, context);
        }
      },

      'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(updateAndReturnFirstRow)/]'(
        node
      ) {
        if (node.arguments?.[2]) {
          checkForRethinkFunction(node.arguments[2], node, tables, context);
        }
      }
    };
  }
};

function checkForRethinkFunction(arg, node, tables, context) {
  const table = utils.getProp(node, 'callee.object.property.name');
  if (!table || !tables.includes(table)) {
    return;
  }

  if (arg?.type === 'ArrayExpression') {
    arg.elements.forEach(arg => {
      if (arg.type === 'Identifier') {
        findVariableAndReport(arg, node, context);
      } else {
        findRInProperties(arg, node, context);
      }
    });
  } else if (arg?.type === 'ObjectExpression') {
    findRInProperties(arg, node, context);
  } else if (arg?.type === 'Identifier') {
    findVariableAndReport(arg, node, context);
  }
}

function findRInProperties(arg, node, context) {
  if (arg.properties) {
    arg.properties.forEach(prop => {
      if (utils.getProp(prop, 'value.callee.object.name') === 'r') {
        context.report({
          node,
          messageId: 'convertRethinkdbFunctions'
        });
      }
    });
  }
}

function findVariableAndReport(arg, node, context) {
  const variableName = arg.name;
  const functionAncestor = utils.getUpperFunction(node);
  if (functionAncestor) {
    let variableNodeFound = utils.findVariableNodeInAncestor(
      functionAncestor,
      variableName
    );

    if (variableNodeFound?.init?.properties) {
      variableNodeFound.init.properties.forEach(prop => {
        if (utils.getProp(prop, 'value.callee.object.name') === 'r') {
          context.report({ node, messageId: 'convertRethinkdbFunctions' });
        }
      });
    }
  }
}
