/**
 * @fileoverview Rules specific to Thought Industries
 * @author Thought Industries
 */
"use strict";

const jsonProcessor = require('./processors/json');

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


module.exports.processors = { ...jsonProcessor }

// import all rules in lib/rules
module.exports.rules = requireIndex(__dirname + "/rules");

