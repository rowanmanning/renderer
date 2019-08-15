'use strict';

const sinon = require('sinon');

const requireFirst = sinon.stub().returns('mock module');

module.exports = requireFirst;
