'use strict';

const path = require('path');
const renderer = require('../../../lib/renderer');

const htm = require('htm'); // Mocked
const Hyperons = require('hyperons'); // Mocked

jest.mock('/mock-views/mock-view', () => {
	return jest.fn().mockReturnValue('mock rendered template');
}, {virtual: true});

describe('lib/renderer', () => {

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('renderer(options)', () => {
		let objectAssign;
		let options;
		let render;

		beforeEach(() => {
			options = {
				viewPath: '/mock-views'
			};
			objectAssign = jest.spyOn(Object, 'assign').mockImplementation((...args) => {
				return args.pop();
			});
			render = renderer(options);
		});

		it('defaults the options', () => {
			expect(objectAssign).toHaveBeenCalledTimes(1);
			expect(objectAssign).toHaveBeenCalledWith({}, renderer.defaultOptions, options);
		});

		it('creates an `htm` template tag using Hyperons', () => {
			expect(htm.bind).toHaveBeenCalledTimes(1);
			expect(htm.bind).toHaveBeenCalledWith(Hyperons.h);
		});

		it('returns a function (render)', () => {
			expect(typeof render).toStrictEqual('function');
		});

		describe('render(templatePath, renderContext)', () => {
			let renderContext;
			let returnValue;

			beforeEach(() => {
				objectAssign.mockClear();
				renderContext = {
					doctype: '<!MOCKTYPE html>'
				};
				returnValue = render('mock-view', renderContext);
			});

			it('defaults the render context', () => {
				expect(objectAssign).toHaveBeenCalledTimes(1);
				expect(objectAssign).toHaveBeenCalledWith(
					{},
					renderer.defaultRenderContext,
					renderContext
				);
			});

			it('renders the given template with the render context', () => {
				const view = require('/mock-views/mock-view');
				expect(view).toHaveBeenCalledTimes(1);
				expect(view).toHaveBeenCalledWith(
					htm.bind.mock.results[0].value,
					objectAssign.mock.results[0].value
				);
				expect(Hyperons.render).toHaveBeenCalledTimes(1);
				expect(Hyperons.render).toHaveBeenCalledWith(view.mock.results[0].value);
			});

			it('returns the rendered template as a string', () => {
				const renderedTemplate = Hyperons.render.mock.results[0].value;
				const expectedValue = `${renderContext.doctype}${renderedTemplate}`;
				expect(returnValue).toStrictEqual(expectedValue);
			});

			describe('when `renderContext.doctype` is falsy', () => {

				beforeEach(() => {
					Hyperons.render.mockClear();
					renderContext = {
						doctype: null
					};
					returnValue = render('mock-view', renderContext);
				});

				it('returns the rendered template without a doctype', () => {
					expect(returnValue).toStrictEqual(Hyperons.render.mock.results[0].value);
				});

			});

		});

		describe('.koa()', () => {
			let koaRenderMiddleware;

			beforeEach(() => {
				koaRenderMiddleware = render.koa();
			});

			it('returns a function (koaRenderMiddleware)', () => {
				expect(typeof koaRenderMiddleware).toStrictEqual('function');
			});

			describe('.koaRenderMiddleware(context, next)', () => {
				let context;
				let next;
				let returnValue;

				beforeEach(() => {
					context = {
						state: 'mock state'
					};
					next = jest.fn().mockReturnValue('mock next');
					returnValue = koaRenderMiddleware(context, next);
				});

				it('adds a `render` method to the context', () => {
					expect(typeof context.render).toStrictEqual('function');
				});

				it('returns the result of calling `next`', () => {
					expect(returnValue).toStrictEqual(next.mock.results[0].value);
				});

				describe('context.render(templatePath, renderContext)', () => {
					let renderContext;

					beforeEach(() => {
						objectAssign.mockClear();
						delete context.body;
						renderContext = {
							doctype: '<!MOCKTYPE html>'
						};
						context.render('mock-view', renderContext);
					});

					it('merges the render context with the `context.state`', () => {
						expect(objectAssign).toHaveBeenCalledWith(
							{},
							context.state,
							renderContext
						);
					});

					it('sets `context.body` to the rendered template as a string', () => {
						const renderedTemplate = Hyperons.render.mock.results[0].value;
						const expectedValue = `${renderContext.doctype}${renderedTemplate}`;
						expect(context.body).toStrictEqual(expectedValue);
					});

				});

			});

		});

	});

	describe('.defaultOptions', () => {

		it('is an object', () => {
			expect(renderer.defaultOptions).not.toBeNull();
			expect(typeof renderer.defaultOptions).toStrictEqual('object');
		});

		describe('.viewPath', () => {

			it('is set to the expected file path', () => {
				const expectedPath = path.resolve(process.cwd(), 'view');
				expect(renderer.defaultOptions.viewPath).toStrictEqual(expectedPath);
			});

		});

	});

	describe('.defaultRenderContext', () => {

		it('is an object', () => {
			expect(renderer.defaultRenderContext).not.toBeNull();
			expect(typeof renderer.defaultRenderContext).toStrictEqual('object');
		});

		describe('.doctype', () => {

			it('is set to the HTML5 doctype', () => {
				expect(renderer.defaultRenderContext.doctype).toStrictEqual('<!DOCTYPE html>');
			});

		});

	});

});
