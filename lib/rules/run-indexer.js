// https://astexplorer.net/ is your friend

const utils = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Force indexer run after db insert/update for indexed tables',
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          indexerPattern: {
            type: 'string'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingIndexer: 'Missing indexer following insert/update on {{table}}',
      functionAncestor: '({{table}}) Could not find function ancestor to check for indexing. {{node}}'
    }
  },

  create: function (context) {
    if (!(context.options || []).length) {
      throw new Error('`indexerPattern` must be set');
    }

    const { indexerPattern } = context.options[0];

    if (!indexerPattern) {
      throw new Error('`indexerPattern` must be set');
    }

    const INDEXED_TABLES = utils.getIndexedTables(indexerPattern);

    function findIndexer(table, indexerName, node, poolRunNode) {
      const functionAncestor = utils.getUpperFunction(node);
      let indexerNode = false;

      if (functionAncestor) {
        utils.findChild(functionAncestor, {
          Identifier(maybeNode) {
            if (maybeNode.name === indexerName && utils.isAfterNode(node, maybeNode)) {
              indexerNode = maybeNode;
              return true;
            }
          }
        });

        if (!indexerNode) {
          context.report({ node: poolRunNode || node, messageId: 'missingIndexer', data: { table } });
        }
      } else {
        context.report({
          node: poolRunNode || node,
          messageId: 'functionAncestor',
          data: { table, node: JSON.stringify(node) }
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
        const { table } = utils.getTableOrMessageId(tableArg, node);

        // due to sheer number of issues
        if (table && INDEXED_TABLES[table]) {
          findIndexer(table, INDEXED_TABLES[table], node, poolRunNode);
        }
      },

      'CallExpression[callee.property][callee.object.name="dbBatch"][callee.property.name=/(updateAll|update|insert)/]'(
        node
      ) {
        const tableArg = node.arguments[1];
        const { table } = utils.getTableOrMessageId(tableArg, node);

        // due to sheer number of issues
        if (table && INDEXED_TABLES[table]) {
          findIndexer(table, INDEXED_TABLES[table], node);
        }
      }
    };
  }
};
