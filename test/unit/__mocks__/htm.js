'use strict';

const htm = {};

htm.bind = jest.fn().mockReturnValue('mock html function');

module.exports = htm;
