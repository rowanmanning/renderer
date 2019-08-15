'use strict';

const assert = require('proclaim');

describe('lib/Partial', () => {
	let Partial;

	beforeEach(() => {
		Partial = require('../../../lib/partial');
	});

	describe('new Partial(options)', () => {
		let renderContext;
		let instance;

		beforeEach(() => {
			renderContext = {
				mockRenderContext: true
			};
			instance = new Partial(renderContext);
		});

		describe('.context', () => {

			it('is set to `renderContext`', () => {
				assert.strictEqual(instance.context, renderContext);
			});

		});

		describe('.render()', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.render();
			});

			it('returns a string which contains default partial output', () => {
				assert.strictEqual(returnValue, 'Unextended Partial (Partial)');
			});

		});

		describe('when `renderContext` is not set', () => {

			beforeEach(() => {
				instance = new Partial();
			});

			describe('.context', () => {

				it('is set to an empty object', () => {
					assert.deepEqual(instance.context, {});
				});

			});

		});

	});

});
