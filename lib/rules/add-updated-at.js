// https://astexplorer.net/ is your friend

const utils = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Force `updatedAt` on RethinkDB updates',
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          indexerPattern: {
            type: 'string'
          },
          limitToIndexedTables: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingUpdate:
        'Possibly missing updatedAt in variable {{variableName}} on table {{table}}, if not missing add `eslint-disable-next-line ti/add-updated-at`',
      noTable: 'Could not find table, maybe not actually a rethinkdb update/insert call?',
      markedMissing:
        'Dynamic table name in r.{{type}} needs to be explicitly marked `eslint-disable-next-line ti/add-updated-at`',
      batchMarkedMissing:
        'Dynamic table name in dbBatch.{{type}} needs to be explicitly marked `eslint-disable-next-line ti/add-updated-at`',
      missingFunctionAncestor: 'Thought this was an insert/update, but could not find function ancestor {{node}}',
      missingUpdatedTable: 'Possibly missing updatedAt in insert/update on table {{table}}',
      missingUpdatedDbBatch: "dbBatch.{{type}}(r, '{{table}}', ...) missing updatedAt",
      markedMissingDbBatch:
        "dbBatch.{{type}}(r, '{{table}}', ...) needs to be explicitly marked `eslint-disable-next-line ti/add-updated-at`",
      missingOnTable: 'Missing updatedAt on {{table}}'
    }
  },

  create: function (context) {
    if (!(context.options || []).length) {
      throw new Error('`indexerPattern` must be set');
    }

    const { indexerPattern, limitToIndexedTables } = context.options[0];

    if (!indexerPattern) {
      throw new Error('`indexerPattern` must be set');
    }

    const INDEXED_TABLES = utils.getIndexedTables(indexerPattern);

    function findUpdatedAt(table, node, poolRunNode) {
      const updateObjectExpression = node.arguments.find(arg => {
        return (
          arg.type === 'ObjectExpression' &&
          !arg.properties.find(prop => prop.key && prop.key.name === 'returnChanges') &&
          !arg.properties.find(prop => prop.key && prop.key.name === 'conflict')
        );
      });

      if (updateObjectExpression) {
        // r.db('foo').update({object: 'goes here'})
        // straight forward check for properties including `updatedAt`
        const updatedAtProp = updateObjectExpression.properties.find(
          prop => utils.getProp(prop, 'key.name') === 'updatedAt'
        );

        if (!updatedAtProp) {
          context.report({
            node: poolRunNode || node,
            messageId: 'missingOnTable',
            data: { table }
          });
        }
      } else {
        // r.db('foo').update(variableHere)
        // this is trickier as we have to try to find the variable declaration to see if it has `updatedAt` in it
        const updateIdentifierExpression = node.arguments.find(arg => arg.type === 'Identifier');

        if (updateIdentifierExpression) {
          const variableName = updateIdentifierExpression.name;
          const functionAncestor = utils.getUpperFunction(node);

          if (functionAncestor) {
            let variableNodeFound = utils.findVariableNodeInAncestor(functionAncestor, variableName);

            let code = '';
            if (variableNodeFound) {
              code = context.getSourceCode().getText(variableNodeFound.parent);
            }

            if (!code.match(/updatedAt/gi)) {
              context.report({
                node: poolRunNode || node,
                messageId: 'missingUpdate',
                data: { variableName, table }
              });
            }
          } else {
            context.report({
              node: poolRunNode || node,
              messageId: 'missingFunctionAncestor',
              data: { node: JSON.stringify(node) }
            });
          }
        } else {
          const code = context.getSourceCode().getText(node);
          if (!code.match(/updatedAt/gi)) {
            context.report({
              node: poolRunNode || node,
              messageId: 'missingUpdatedTable',
              data: { table }
            });
          }
        }
      }
    }

    function findDbBatchUpdatedAt(type, table, node) {
      // we can check updateAll's pretty reliably, and nothing else
      if (type === 'updateAll' && utils.getProp(node, 'arguments[3].type') === 'ObjectExpression') {
        const updatedAtProp = node.arguments[3].properties.find(prop => prop.key && prop.key.name === 'updatedAt');

        if (!updatedAtProp) {
          context.report({
            node: node,
            messageId: 'missingUpdatedDbBatch',
            data: { type, table }
          });
        }
      } else {
        context.report({
          node: node,
          messageId: 'markedMissingDbBatch',
          data: { type, table }
        });
      }
    }

    return {
      'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(updateAll|update|insert)/]'(
        node
      ) {
        const poolRunNode = utils.findPoolRunNode(node);
        const tableCall = utils.findCallee(node, callee => utils.getProp(callee, 'property.name') === 'table');

        if (!tableCall) {
          return;
        }

        const tableArg = tableCall.parent.arguments[0];
        const { table, messageId } = utils.getTableOrMessageId(tableArg, node, 'markedMissing');

        // due to sheer number of issues
        if (table) {
          if ((INDEXED_TABLES[table] && limitToIndexedTables) || !limitToIndexedTables) {
            findUpdatedAt(table, node, poolRunNode);
          }
        } else {
          context.report({
            node: poolRunNode || node,
            messageId: messageId || 'noTable',
            data: { type: node.callee.property.name }
          });
        }
      },

      'CallExpression[callee.property][callee.object.name="dbBatch"][callee.property.name=/(updateAll|update|insert)/]'(
        node
      ) {
        const type = node.callee.property.name;
        const tableArg = node.arguments[1];
        const { table, messageId } = utils.getTableOrMessageId(tableArg, node, 'batchMarkedMissing');

        // due to sheer number of issues
        if (table) {
          if ((INDEXED_TABLES[table] && limitToIndexedTables) || !limitToIndexedTables) {
            findDbBatchUpdatedAt(type, table, node);
          }
        } else {
          context.report({
            node: node,
            messageId: messageId || 'noTable',
            data: { type }
          });
        }
      }
    };
  }
};
