'use strict';

const assert = require('proclaim');

describe('index', () => {
	let index;
	let Renderer;

	beforeEach(() => {
		index = require('../../index');
		Renderer = require('../../lib/renderer');
	});

	it('aliases `lib/renderer`', () => {
		assert.strictEqual(index, Renderer);
	});

});
