'use strict';

const tryCatch = require('try-catch');
const utils = require('../utils');
const { ignores, findPlaces, transform, print, parse } = require('putout');
const dbLayer = require('../db-layer');
const removeTimestamps = require('../remove-timestamps');
// const parseOptions = require('putout/parse-options');

const cwd = process.cwd();
const getContextOptions = ({ options }) => {
  const [allContextOptions = {}] = options;
  return allContextOptions;
};

const EMPTY_VISITORS = {};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Putout',
      category: 'putout',
      recommended: true
    },
    schema: {},
    fixable: 'code',
    messages: {
      useDbLayer: 'Use the repository.',
      removeTimestamps: 'Remove r.now().',
      convertRethinkdbFunctions: 'Convert RethinkDB functions'
    }
  },

  create(context) {
    const name = context.getFilename();
    const resultOptions = {
      parser: 'babel',
      formatter: ['progress-bar', { minCount: 10 }],
      processors: ['javascript'],
      ignore: [
        '**/node_modules',
        '**/fixture',
        '**/.nyc_output',
        '**/.yarn',
        '**/yarn.lock',
        '**/yarn-error.log',
        '**/*.gif',
        '**/*.png',
        '**/*.jpeg',
        '**/.pnp.*',
        '**/coverage',
        '**/dist',
        '**/dist-dev',
        '**/build',
        '**/package-lock.json',
        '**/.idea',
        '**/.git'
      ],
      rules: {},
      plugins: [
        ['removeTimestamps', removeTimestamps],
        ['useDbLayer', dbLayer]
      ],
      dir: ''
    };

    if (ignores(cwd, name, resultOptions)) return EMPTY_VISITORS;

    const source = context.getSourceCode();
    const { text } = source;
    const node = source.ast;

    const [errorParser, ast] = tryCatch(parse, text, {
      isTS: true
    });

    if (errorParser) {
      context.report({
        message: `${errorParser.message} (putout)`,
        node
      });

      return EMPTY_VISITORS;
    }

    const [error, places = []] = tryCatch(findPlaces, ast, text, resultOptions);

    if (error) {
      context.report({
        message: `${error.message} (putout)`,
        node
      });

      return EMPTY_VISITORS;
    }

    if (!places.length) {
      return {
        'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(insert|insertAndReturnFirstRow)/]'(
          node
        ) {
          if (node.arguments?.[1]) {
            checkForRethinkFunction(node.arguments[1], node, context);
          }
        },

        'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(update|updateAndReturnFirstRow)/]'(
          node
        ) {
          if (node.arguments?.[2]) {
            checkForRethinkFunction(node.arguments[2], node, context);
          }
        }
      }
    }

    for (const { rule, position } of places) {
      context.report({
        messageId: rule,
        fix: fix({
          ast,
          text,
          node,
          source,
          resultOptions
        }),
        loc: {
          start: position,
          end: position
        }
      });
    }

    return EMPTY_VISITORS;
  }
};

const fix =
  ({ ast, text, node, source, resultOptions }) =>
  fixer => {
    const includeComments = true;
    const lastToken = source.getLastToken(node, {
      includeComments
    });

    transform(ast, text, resultOptions);

    const [, last] = lastToken.range;

    const code = print(ast);

    return fixer.replaceTextRange([0, last], code);
  };

// module.exports = {
//   meta: {
//     type: 'problem',
//     docs: {
//       description: 'Force use of database layer if it is available',
//       category: 'Error',
//       recommended: true
//     },
//     schema: [],
//     fixable: 'code',
//     messages: {
//       useDbLayer: 'Use the {{table}} repository.',
//       convertRethinkdbFunctions: 'Convert RethinkDB functions'
//     }
//   },

//   create: function (context) {
//     return {
//       'CallExpression[callee.property][callee.property.name="table"]'(node) {
//         if (node.arguments && node.arguments.length) {
//           const { table } = utils.getTableOrMessageId(node.arguments[0], node);

//           context.report({
//             node,
//             messageId: 'useDbLayer',
//             data: { table },
//             fix(fixer) {
//               const n = node;
//               debugger;
//               // return fixer.replaceText(source, `${quote}${fixedFilePath}${quote}`)
//             }
//           });
//         }
//       },

//       'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(insert|insertAndReturnFirstRow)/]'(
//         node
//       ) {
//         if (node.arguments?.[1]) {
//           checkForRethinkFunction(node.arguments[1], node, context);
//         }
//       },

//       'CallExpression[callee.property][callee.object.name!="dbBatch"][callee.property.name=/(update|updateAndReturnFirstRow)/]'(
//         node
//       ) {
//         if (node.arguments?.[2]) {
//           checkForRethinkFunction(node.arguments[2], node, context);
//         }
//       }
//     };
//   }
// };

function checkForRethinkFunction(arg, node, context) {
  const table = utils.getProp(node, 'callee.object.property.name');
  if (!table) {
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
    let variableNodeFound = utils.findVariableNodeInAncestor(functionAncestor, variableName);

    if (variableNodeFound?.init?.properties) {
      variableNodeFound.init.properties.forEach(prop => {
        if (utils.getProp(prop, 'value.callee.object.name') === 'r') {
          context.report({ node, messageId: 'convertRethinkdbFunctions' });
        }
      });
    }
  }
}
