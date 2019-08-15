'use strict';

const sinon = require('sinon');

const htm = {};

htm.bind = sinon.stub().returns('mock html function');

module.exports = htm;
