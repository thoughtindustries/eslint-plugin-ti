const utils = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Do not allow `describe.only` or `it.only`',
      category: 'Error',
      recommended: true
    },
    messages: {
      describeOnly: '`describe.only` not allowed for \'{{description}}\'',
      itOnly: '`it.only` not allowed for \'{{description}}\''
    }
  },

  create: function (context) {
    return {
      'CallExpression[callee.property.name="only"][callee.object.name=/(describe|it)/]'(node) {
        console.log(utils.getProp(node, 'arguments[0]'));
        context.report({
          node,
          messageId: node.callee.object.name === 'describe' ? 'describeOnly' : 'itOnly',
          data: { description: utils.getProp(node, 'arguments[0].value') }
        })
      }
    };
  }
};
