'use strict';

describe('lib/Partial', () => {
	let Partial;

	beforeEach(() => {
		jest.resetModules();
		Partial = require('../../../lib/partial');
	});

	afterEach(() => {
		jest.clearAllMocks();
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
				expect(instance.context).toStrictEqual(renderContext);
			});

		});

		describe('.render()', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.render();
			});

			it('returns a string which contains default partial output', () => {
				expect(returnValue).toStrictEqual('Unextended Partial (Partial)');
			});

		});

		describe('when `renderContext` is not set', () => {

			beforeEach(() => {
				instance = new Partial();
			});

			describe('.context', () => {

				it('is set to an empty object', () => {
					expect(instance.context).toEqual({});
				});

			});

		});

	});

});
