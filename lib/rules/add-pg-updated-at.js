module.exports = {
  meta: {
    type: 'problem',
    fixable: false,
    docs: {
      description: 'Add `updatedAt` to custom update query',
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
      addPgUpdatedAt: 'Add `updatedAt` to custom update query'
    }
  },

  create: function (context) {
    return {
      'CallExpression[callee.property][callee.property.name="query"]'(
        node
      ) {
        const arg = node.arguments?.[0] || {};
        let isUpdate = false;
        let hasUpdatedAt = false;

        if (arg.type === 'TemplateLiteral') {
          if (arg.quasis[0].value.raw.trim().toLowerCase().startsWith('update')) {
            isUpdate = true;
            arg.quasis.forEach(q => {
              if (q.value.raw.includes('updated_at')) {
                hasUpdatedAt = true;
              }
            });
          }
        } else {
          if (arg?.value?.trim().toLowerCase().startsWith('update')) {
            isUpdate = true;
            if (arg.value.includes('updated_at')) {
              hasUpdatedAt = true;
            }
          }
        }

        if (isUpdate && !hasUpdatedAt) {
          context.report({
            node,
            ruleId: 'ti/add-pg-updated-at',
            messageId: 'addPgUpdatedAt'
          });
        }
      }
    };
  }
};
