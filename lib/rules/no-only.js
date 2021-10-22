// https://astexplorer.net/ is your friend

const BLOCKS = ['describe', 'it'];
const DISALLOWED = ['only'];

module.exports = {
  meta: {
    type: 'problem',
    fixable: true,
    docs: {
      description: 'Disallow `.only` blocks in tests',
      category: 'Error',
      recommended: true
    },
    schema: [
      {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            items: {
              type: 'string'
            },
            uniqueItems: true
          },
          disallowed: {
            type: 'array',
            items: {
              type: 'string'
            },
            uniqueItems: true
          },
          fix: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noOnly: '{{item}} not permitted'
    }
  },

  create: function (context) {
    const options = context.options[0] || {};
    const blocks = options.blocks || BLOCKS;
    const disallowed = options.disallowed || DISALLOWED;
    const fix = !!options.fix;

    return {
      Identifier(node) {
        const parent = node.parent && node.parent.object;
        if (!parent) {
          return;
        }

        if (!disallowed.includes(node.name)) {
          return;
        }

        const callPath = getCallPath(node.parent).join('.');

        if (!blocks.find(b => callPath.split(b)[0] === '')) {
          return;
        }

        console.log(callPath);

        const [start, end] = node.range;

        context.report({
          node,
          ruleId: 'ti/no-only',
          messageId: 'noOnly',
          data: { item: callPath },
          fix: fix ? f => f.removeRange([start - 1, end]) : undefined
        });
      }
    };
  }
};

function getCallPath(node, path = []) {
  if (node) {
    const nodeName = node.name || (node.property && node.property.name);
    if (node.object) return getCallPath(node.object, [nodeName, ...path]);
    if (node.callee) return getCallPath(node.callee, path);
    return [nodeName, ...path];
  }
  return path;
}
