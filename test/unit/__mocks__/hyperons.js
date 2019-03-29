'use strict';

const Hyperons = {};

// eslint-disable-next-line id-length
Hyperons.createElement = jest.fn().mockReturnValue('mock element');
Hyperons.renderToString = jest.fn().mockReturnValue('mock rendered template');

module.exports = Hyperons;
