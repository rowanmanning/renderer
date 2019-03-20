'use strict';

const Hyperons = {};

// eslint-disable-next-line id-length
Hyperons.h = jest.fn().mockReturnValue('mock element');
Hyperons.render = jest.fn().mockReturnValue('mock rendered template');

module.exports = Hyperons;
