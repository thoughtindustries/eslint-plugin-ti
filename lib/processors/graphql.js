const { flatten } = require('../utils');

module.exports = {
  '.graphql': {
    // converts from a .graphql file to a tagged template literal which is then parsed by the rules
    // https://github.com/apollographql/eslint-plugin-graphql/blob/c465fedc8fea239ee1731ad4ec3ee1183a3cdddf/src/index.js#L404-L424
    preprocess: function (text) {
      // Wrap the text in backticks and prepend the internal tag. First the text
      // must be escaped, because of the three sequences that have special
      // meaning in JavaScript template literals, and could change the meaning of
      // the text or cause syntax errors.
      // https://tc39.github.io/ecma262/#prod-TemplateCharacter
      //
      // - "`" would end the template literal.
      // - "\" would start an escape sequence.
      // - "${" would start an interpolation.
      const escaped = text.replace(/[`\\]|\$\{/g, '\\$&');
      return [`gql\`${escaped}\``];
    },
    postprocess: function (messages) {
      // only report on our own messages
      return flatten(messages).filter(message => message.ruleId.includes('ti/'));
    },

    supportsAutofix: false
  }
};
