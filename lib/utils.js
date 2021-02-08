const path = require('path');
const glob = require('glob');
const inflect = require('i')();

const anyFunctionPattern = /^(?:Function(?:Declaration|Expression)|ArrowFunctionExpression)$/u;

/**
 * Searches child nodes and checks for condition
 * @param {ASTNode} parentNode An item to check.
 * @param {Object} callbackMap Object of functions to handle node types
 * @returns {Node|undefined} A found function node.
 */
function findChild(parentNode, callbackMap) {
  function check(node) {
    const nodeType = node.type;
    if (nodeType in callbackMap) {
      if (callbackMap[nodeType](node)) {
        return;
      }
    }

    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key === 'parent') {
        continue;
      }

      const child = node[key];

      if (Array.isArray(child)) {
        for (let j = 0; j < child.length; j++) {
          if (isNode(child[j])) {
            check(child[j]);
          }
        }
      } else if (isNode(child)) {
        check(child);
      }
    }
  }
  check(parentNode);
}

function findPoolRunNode(node) {
  if (!isNode(node)) {
    return null;
  }

  while (node != null) {
    if (
      getProp(node, 'callee.object.property.name') === 'pool' &&
      getProp(node, 'callee.property.name') === 'run'
    ) {
      return node;
    }
    node = node.parent;
  }

  return null;
}

function getProp(obj, dottedProps) {
  const props = dottedProps.split('.');
  let index = null;
  let arrayParts = null;

  for (const prop of props) {
    index = null;
    arrayParts = null;

    if (!obj.hasOwnProperty(prop)) {
      // check if we're looking for an index of an array
      arrayParts = prop.match(/(?<prop>[\w]+)\[(?<index>\d+)]/i);
      if (arrayParts && arrayParts.groups) {
        index = arrayParts.groups.index;

        if (!Array.isArray(obj[arrayParts.groups.prop]) || obj[arrayParts.groups.prop].length <= index) {
          return null;
        }
      }
    }

    if (index === null && !obj.hasOwnProperty(prop)) {
      return null;
    }

    obj = index !== null && arrayParts ? obj[arrayParts.groups.prop][index] : obj[prop];
  }

  return obj;
}

/**
 * Checks if variable is a node.
 * @param {any} possibleNode An item to check.
 * @returns {boolearn} A found function node.
 */
function isNode(possibleNode) {
  return possibleNode && possibleNode.constructor.name === 'Node';
}

/**
 * Finds a function node from ancestors of a node.
 * @param {ASTNode} node A start node to find.
 * @returns {Node|null} A found function node.
 */
function getUpperFunction(node) {
  for (let currentNode = node; currentNode; currentNode = currentNode.parent) {
    if (anyFunctionPattern.test(currentNode.type)) {
      return currentNode;
    }
  }
  return null;
}

/**
 * Checks if node is after another node
 * @param {ASTNode} node The node that should be before the second node
 * @param {ASTNode} afterNode The node that should be after the first node
 * @returns {boolean}
 */
function isAfterNode(node, afterNode) {
  return afterNode.range[0] > node.range[1];
}

/**
 * Turns the first letter of a string into a lowercase
 * @param {string} string The string to change the first letter to lowercase
 */
function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

/**
 * Find a callee based on a set of conditions
 * @param {ASTNode} node The node to find the callee on
 * @param {Function} calleeCheck The function that checks to see if the callee is the correct one
 */
function findCallee(node, calleeCheck) {
  let callee = node.callee;
  let found;

  while (callee !== null && callee !== undefined && !found) {
    if (calleeCheck(callee)) {
      found = callee;
    } else {
      callee = callee.object ? callee.object.callee : null;
    }
  }

  return found;
}

/**
 * Get a list of indexers with table names as keys
 *
 * TODO: this could use some work, e.g. `competencyAssessmentAttempts` is not correct, `competencyAssessmentResponses` is the correct indexer
 * maybe use `_mapping` instead of `_indexer` ?
 *
 * @param {string} indexerPattern The glob pattern to the indexer files
 */
function getIndexedTables(indexerPattern) {
  return glob.sync(indexerPattern).reduce((list, file) => {
    const basename = path.basename(file, '.js');
    const indexerName = lowercaseFirstLetter(inflect.camelize(basename));
    const tableName = inflect.pluralize(indexerName.replace('Indexer', ''));
    list[tableName] = indexerName;
    return list;
  }, {});
}

function getTableNameFromVariable(node, variableName) {
  const functionAncestor = getUpperFunction(node);

  let table = null;

  findChild(functionAncestor, {
    VariableDeclarator(maybeNode) {
      if (maybeNode.id.name === variableName && maybeNode.init) {
        table = maybeNode.init.value;
        return true;
      }
    },
    AssignmentExpression(maybeNode) {
      if (maybeNode.left.name === variableName) {
        table = maybeNode.right.value;
        return true;
      }
    }
  });

  return table;
}

function findVariableNodeInAncestor(functionAncestor, variableName) {
  let variableNodeFound = null;

  findChild(functionAncestor, {
    VariableDeclarator(maybeNode) {
      if (maybeNode.id.name === variableName && maybeNode.init) {
        variableNodeFound = maybeNode;
        return true;
      }
    },
    AssignmentExpression(maybeNode) {
      if (maybeNode.left.name === variableName) {
        variableNodeFound = maybeNode;
        return true;
      }
    }
  });

  return variableNodeFound;
}

function getTableOrMessageId(tableArg, node, message) {
  let table;
  let messageId = false;

  if (tableArg.type === 'Literal') {
    table = tableArg.value;
  } else if (tableArg.type === 'Identifier') {
    const variableName = tableArg.name;
    table = getTableNameFromVariable(node, variableName);

    if (!table) {
      messageId = message;
    }
  } else {
    messageId = message;
  }

  return { table, messageId };
}

module.exports = {
  getUpperFunction,
  isNode,
  findChild,
  isAfterNode,
  lowercaseFirstLetter,
  findCallee,
  getIndexedTables,
  findPoolRunNode,
  getProp,
  getTableNameFromVariable,
  findVariableNodeInAncestor,
  getTableOrMessageId
};
