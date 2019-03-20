'use strict';

const index = require('../../index');
const renderer = require('../../lib/renderer');

describe('index', () => {

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('aliases `lib/renderer`', () => {
		expect(index).toStrictEqual(renderer);
	});

});
