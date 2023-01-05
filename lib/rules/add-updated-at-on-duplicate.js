module.exports = {
  meta: {
    type: 'problem',
    fixable: false,
    docs: {
      description: 'Add `updatedAt` to `updateOnDuplicate`',
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
      addUpdatedAtOnDuplicate: 'Add `updatedAt` to `updateOnDuplicate`'
    }
  },

  create: function (context) {
    return {
      'CallExpression[callee.property][callee.property.name="bulkCreate"]'(
        node
      ) {
        const arg = node.arguments?.[1];

        if (arg) {
          const updateOnDuplicate = arg.properties.find(p => p.key.name === 'updateOnDuplicate');
          if (
            updateOnDuplicate &&
            updateOnDuplicate.value.elements &&
            !updateOnDuplicate.value.elements.find(e => e.value === 'updatedAt')
          ) {
            context.report({
              node,
              ruleId: 'ti/add-updated-at-on-duplicate',
              messageId: 'addUpdatedAtOnDuplicate'
            });
          }
        }
      }
    };
  }
};
