module.exports = {
  meta: {
    type: 'problem',
    fixable: false,
    docs: {
      description: 'Use `idHelper` for inserts in repositories',
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
      useIdHelper: 'Use idHelper for `insert`, `insertAndReturnFirstRow` and `bulkCreate`'
    }
  },

  create: function (context) {
    return {
      'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(insert)/]'(
        node
      ) {
        if (!alreadyWrapped(node)) {
          context.report({
            node,
            ruleId: 'ti/id-helper',
            messageId: 'useIdHelper'
          });
        }
      }
    };
  }
};

function getParentFunctionPath(path) {
  let parentPath = path.parent;
  while (path.parent && parentPath.type !== 'FunctionDeclaration') {
    parentPath = parentPath.parent;
  }

  return parentPath;
}

function alreadyWrapped(path) {
  const parentFunction = getParentFunctionPath(path);

  if (!parentFunction) {
    return false;
  }

  return parentFunction.body?.body?.[0]?.declarations?.[0]?.init?.callee?.name === 'idHelper';
}
