'use strict';

const requireFirst = jest.fn().mockReturnValue('mock module');

module.exports = requireFirst;
