// https://astexplorer.net/ is your friend

const acorn = require("acorn");
const walk = require("acorn-walk");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const minimatch = require("minimatch");
const { generate } = require("astring");
const inflect = require("i")();
const assignParent = require("estree-assign-parent");

module.exports = {
  meta: {
    type: "error",
    docs: {
      description: "Force `updatedAt` on RethinkDB updates",
      category: "Error",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          filePath: {
            type: "string"
          },
          indexerPath: {
            type: "string"
          },
          indexerPathPrefix: {
            type: "string"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingUpdate: "Possibly missing updatedAt in variable {{variableName}} on table {{table}}, if not missing add walk:ignoreMissingUpdatedAt",
      noTable: "Could not find table, maybe not actually a rethinkdb update/insert call?",
      markedMissing: "Dynamic table name in r.{{type}} needs to be explicitly marked walk:ignoreMissingUpdatedAt",
      batchMarkedMissing: "Dynamic table name in dbBatch.{{type}} needs to be explicitly marked walk:ignoreMissingUpdatedAt",
      missingIndexer: "Missing indexer following insert/update on {{table}}",
      functionAncestor: "({{table}}) Could not find function ancestor to check for indexing. {{node}}",
      missingFunctionAncestor: "Thought this was an insert/update, but could not find function ancestor {{node}}",
      functionAncestorNotFound: "COULD NOT FIND FUNCTION ANCESTOR!!",
      missingUpdatedTable: "Possibly missing updatedAt in insert/update on table {{table}}",
      missingUpdatedDbBatch: "dbBatch.{{type}}(r, '{{table}}', ...) missing updatedAt",
      markedMissingDbBatch: "dbBatch.{{type}}(r, '{{table}}', ...) needs to be explicitly marked walk:ignoreMissingUpdatedAt",
      missingOnTable: "Missing updatedAt on {{table}}"
    }
  },
  create: function (context) {
    if (!context.options[0]) {
      throw new Error("`filePath` and `indexerPath` must be set");
    }

    const { filePath, indexerPath, indexerPathPrefix } = context.options[0];

    if (!filePath || !indexerPath) {
      throw new Error("`filePath` and `indexerPath` must be set");
    }

    const file = context.getFilename().replace(context.getCwd(), "").replace(/^\//, '');
    
    // Exiting early if we're not interested in the file to prevent unnecessary code execution.
    if (!minimatch(file, filePath)) {
      return {
        File() {
          return;
        }
      };
    }

    // TODO: this could use some work, e.g. `competencyAssessmentAttempts` is not correct, `competencyAssessmentResponses` is the correct indexer
    // maybe use `_mapping` instead of `_indexer` ?
    const INDEXED_TABLES = glob.sync(indexerPath).reduce((list, file) => {
      const basename = path.basename(file, '.js');
      const indexerName = lowercaseFirstLetter(inflect.camelize(basename));
      const tableName = inflect.pluralize(indexerName.replace('Indexer', ''));
      list[tableName] = indexerName;
      return list;
    }, {});

    const code = context.getSourceCode().getText();
    
    const ignoreComments = [];
    walk.full(
      assignParent(
        acorn.parse(code, {
          locations: true,
          onComment(isBlock, comment, start, end, startLoc) {
            if (comment.includes("walk:ignore")) {
              ignoreComments.push({ loc: startLoc, comment: comment.trim() });
            }
          }
        })
      ),
      (node) => {
        if (
          node.callee &&
          node.callee.property &&
          ["updateAll", "update", "insert"].includes(node.callee.property.name)
        ) {
          const tableCall = findCallee(
            node,
            (callee) => callee.property && callee.property.name === "table"
          );

          let table;
          const type = node.callee.property.name;
          let script = "r";
          let ignored = false;
          let messageId = null;

          if (tableCall) {
            const tableArg = tableCall.parent.arguments[0];
            // r.table('tableName') vs. r.table(tableNameVarHere)
            if (tableArg.type === "Literal") {
              table = tableArg.value;
            } else {
              // dynamic table name, ensure it's ignored
              ignored = lineIgnored(node, "walk:ignore", ignoreComments);
              if (!ignored) {
                messageId = 'markedMissing';
              }
            }
          } else if (node.callee.object.name === "dbBatch") {
            script = "dbBatch";
            const tableArg = node.arguments[1];
            // dbBatch.insert(r, 'tableName') vs. dbBatch.insert(r, tableNameVarHere)
            if (tableArg.type === "Literal") {
              table = tableArg.value;
            } else {
              // dynamic table name, ensure it's ignored
              ignored = lineIgnored(node, "walk:ignoreMissingUpdatedAt", ignoreComments);
              if (!ignored) {
                messageId = 'batchMarkedMissing';
              }
            }
          } else {
            // ignore things like `crypto.update()`
            ignored = true;
          }
          
          // due to sheer number of issues
          if (table) {
            // we can remove this `if` later, but for now i'm prioritizing indexed tables
            if (INDEXED_TABLES[table]) {
              if (script === "r") {
                findUpdatedAt(file, type, table, node, ignoreComments);
              } else if (script === "dbBatch") {
                findDbBatchUpdatedAt(file, type, table, node, ignoreComments);
              }
              if (INDEXED_TABLES[table]) {
                findIndexer(file, type, table, INDEXED_TABLES[table], node, ignoreComments);
              }
            }
          } else if (!ignored) {
            if (messageId) {
              context.report({ node, messageId, data: { type } });
            } else {
              context.report({ node, messageId: 'noTable', data: { file, line: node.loc.start.line } });
            }
          }
        }
      }
    );

    function findIndexer(file, type, table, indexerName, node, ignoreComments) {
      const functionAncestor = findDefiningFunction(node);

      if (functionAncestor) {
        const indexerNode = walk.findNodeAfter(
          functionAncestor,
          functionAncestor.start,
          (nodeType, maybeNode) => {
            return nodeType === "Identifier" && maybeNode.name === indexerName;
          }
        );

        if (!indexerNode && !lineIgnored(node, "walk:ignoreMissingIndexer", ignoreComments)) {
          context.report({ node, messageId: 'missingIndexer', data: { file, line: node.loc.start.line, table } });
        }
      } else {
        context.report({ node, messageId: 'functionAncestor', data: { file, line: node.loc.start.line, table, node: JSON.stringify(node) } });
      }
    }

    function findUpdatedAt(file, type, table, node, ignoreComments) {
      const updateObjectExpression = node.arguments.find(
        (arg) =>
          arg.type === "ObjectExpression" &&
          !arg.properties.find((prop) => prop.key && prop.key.name === "returnChanges") &&
          !arg.properties.find((prop) => prop.key && prop.key.name === "conflict")
      );

      const ignored = lineIgnored(node, "walk:ignoreMissingUpdatedAt", ignoreComments);

      if (ignored) {
        return;
      }

      if (updateObjectExpression) {
        // r.db('foo').update({object: 'goes here'})
        // straight forward check for properties including `updatedAt`

        const updatedAtProp = updateObjectExpression.properties.find(
          (prop) => prop.key && prop.key.name === "updatedAt"
        );

        if (!updatedAtProp) {
          context.report({ messageId: 'missingOnTable', data: { table } });
        }
      } else {
        // r.db('foo').update(variableHere)
        // this is trickier as we have to try to find the variable declaration to see if it has `updatedAt` in it
        const updateIdentifierExpression = node.arguments.find((arg) => arg.type === "Identifier");

        if (updateIdentifierExpression) {
          const variableName = updateIdentifierExpression.name;
          const functionAncestor = findDefiningFunction(node);
          if (functionAncestor) {
            const variableNodeFound = walk.findNodeAfter(
              functionAncestor,
              functionAncestor.start,
              (nodeType, maybeNode) => {
                // var x = {} or x = {}, but not var x;
                return (
                  (nodeType === "VariableDeclarator" &&
                    maybeNode.id.name === variableName &&
                    maybeNode.init) ||
                  (nodeType === "AssignmentExpression" && maybeNode.left.name === variableName)
                );
              }
            );

            let code = "";
            if (variableNodeFound) {
              code = generate(variableNodeFound.node);
            }

            if (
              !code.match(/updatedAt/gi) &&
              !lineIgnored(node, "walk:ignoreMissingUpdatedAt", ignoreComments)
            ) {
              context.report({ node, messageId: 'missingUpdate', data: { file, line: node.loc.start.line, variableName, table } });
            }
          } else {
            context.report({ node, messageId: 'missingFunctionAncestor', data: { file, line: node.loc.start.line, node: JSON.stringify(node) } });
          }
        } else {
          const code = generate(node);
          if (!code.match(/updatedAt/gi)) {
            context.report({ node, messageId: 'missingUpdatedTable', data: { file, line: node.loc.start.line, table } });
          }
        }
      }
    }

    function findDbBatchUpdatedAt(file, type, table, node, ignoreComments) {
      // we can check updateAll's pretty reliably, and nothing else
      if (
        type === "updateAll" &&
        node.arguments[3] &&
        node.arguments[3].type === "ObjectExpression"
      ) {
        const updatedAtProp = node.arguments[3].properties.find(
          (prop) => prop.key && prop.key.name === "updatedAt"
        );
        if (!updatedAtProp && !lineIgnored(node, "walk:ignoreMissingUpdatedAt", ignoreComments)) {
          context.report({ node, messageId: 'missingUpdatedDbBatch', data: { file, line: node.loc.start.line, type, table } });
        }
      } else if (!lineIgnored(node, "walk:ignoreMissingUpdatedAt", ignoreComments)) {
        context.report({ node, messageId: 'markedMissingDbBatch', data: { file, line: node.loc.start.line, type, table } });
      }
    }

    function lineIgnored(node, commentToCheck, ignoreComments) {
      return ignoreComments.find((comment) => {
        return (
          (comment.comment === commentToCheck || comment.comment === "walk:ignore") &&
          findAncestor(node, (ancestor) => comment.loc.line === ancestor.loc.start.line - 1)
        );
      });
    }

    function lowercaseFirstLetter(string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    }

    function findDefiningFunction(node) {
      const functionAncestor = findAncestor(
        node,
        (ancestor) =>
          ancestor.type === "FunctionDeclaration" ||
          ancestor.type === "FunctionExpression" ||
          ancestor.type === "ArrowFunctionExpression"
      );

      if (!functionAncestor) {
        context.report({ node, messageId: 'functionAncestorNotFound' });
        debugger;
      }

      return functionAncestor;
    }

    function findAncestor(node, ancestorCheck) {
      let parent = node.parent;
      let found;
      while (parent !== null && parent !== undefined && !found) {
        if (ancestorCheck(parent)) {
          found = parent;
        } else {
          parent = parent.parent;
        }
      }

      return found;
    }

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

    return {};
  }
};
