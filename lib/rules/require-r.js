module.exports = {
  meta: {
    type: 'problem',
    fixable: false,
    docs: {
      description: 'Must pass in `r` to the repository functions',
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
      requireR: 'Must pass in `r` to the repository functions'
    }
  },

  create: function (context) {
    return {
      'CallExpression[callee.object.object.name="r"][callee.property.name=/findById|insert|insertAndReturnFirstRow|update|updateAndReturnFirstRow|getAllByCompanyId|getAttributesByIds|batchUpdate|destroyById|updateByScopeAndReturnFirstRow|findBySlug|findByCompanyAndSlugs/]'(
        node
      ) {
        if (node.arguments?.[0]?.name !== 'r') {
          context.report({
            node,
            ruleId: 'ti/require-r',
            messageId: 'requireR'
          });
        }
      },
      'CallExpression[callee.object.object.property.name="r"][callee.property.name=/findById|insert|insertAndReturnFirstRow|update|updateAndReturnFirstRow|getAllByCompanyId|getAttributesByIds|batchUpdate|destroyById|updateByScopeAndReturnFirstRow|findBySlug|findByCompanyAndSlugs/]'(
        node
      ) {
        if (node.arguments?.[0]?.name !== 'r') {
          context.report({
            node,
            ruleId: 'ti/require-r',
            messageId: 'requireR'
          });
        }
      }
    };
  }
};
