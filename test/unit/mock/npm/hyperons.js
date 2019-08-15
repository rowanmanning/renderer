'use strict';

const sinon = require('sinon');

const Hyperons = {};

Hyperons.createElement = sinon.stub().returns('mock element');
Hyperons.renderToString = sinon.stub().returns('mock rendered template');

module.exports = Hyperons;
