/**
 * @fileoverview Rules specific to Thought Industries
 * @author Thought Industries
 */
'use strict';

const graphqlProcessor = require('./processors/graphql');

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require('requireindex');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports.processors = { ...graphqlProcessor };

// import all rules in lib/rules
module.exports.rules = requireIndex(__dirname + '/rules');
