'use strict';

const path = require('path');

describe('lib/renderer', () => {
	let htm;
	let Hyperons;
	let Partial;
	let Renderer;
	let requireFirst;

	beforeEach(() => {
		jest.resetModules();
		process.env.NODE_ENV = 'test';
		htm = require('htm');
		Hyperons = require('hyperons');
		Partial = require('../../../lib/partial');
		requireFirst = require('@rowanmanning/require-first');
		Renderer = require('../../../lib/renderer');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('creates an `htm` template tag using Hyperons', () => {
		expect(htm.bind).toHaveBeenCalledTimes(1);
		expect(htm.bind).toHaveBeenCalledWith(Hyperons.h);
	});

	describe('new Renderer(options)', () => {
		let defaultedOptions;
		let instance;
		let userOptions;

		beforeEach(() => {
			defaultedOptions = {
				env: 'mock-env',
				namespacePaths: {
					__default: 'mock-default-path',
					'mock-namespace': 'mock-namespace-path'
				}
			};
			jest.spyOn(Renderer, 'applyDefaultOptions').mockReturnValue(defaultedOptions);
			userOptions = {mockUserOptions: true};
			instance = new Renderer(userOptions);
		});

		it('calls `Renderer.applyDefaultOptions` with `options`', () => {
			expect(Renderer.applyDefaultOptions).toHaveBeenCalledTimes(1);
			expect(Renderer.applyDefaultOptions).toHaveBeenCalledWith(userOptions);
		});

		describe('.env', () => {

			it('is set to the defaulted `env` option', () => {
				expect(instance.env).toStrictEqual('mock-env');
			});

		});

		describe('.namespaces', () => {

			it('is set to a Map representation of the defaulted `path` and `namespacePaths` options', () => {
				expect(instance.namespaces).toBeInstanceOf(Map);
				expect(instance.namespaces.size).toStrictEqual(2);
				expect(instance.namespaces.has('__default')).toBeTruthy();
				expect(instance.namespaces.get('__default')).toStrictEqual('mock-default-path');
				expect(instance.namespaces.has('mock-namespace')).toBeTruthy();
				expect(instance.namespaces.get('mock-namespace')).toStrictEqual('mock-namespace-path');
			});

		});

		describe('.renderContext', () => {

			it('is an object', () => {
				expect(instance.renderContext).not.toBeNull();
				expect(typeof instance.renderContext).toStrictEqual('object');
			});

			describe('.doctype', () => {

				it('is set to the HTML5 doctype', () => {
					expect(instance.renderContext.doctype).toStrictEqual('<!DOCTYPE html>');
				});

			});

		});

		describe('.render(templateNames, renderContext)', () => {
			let returnValue;
			let template;

			beforeEach(async () => {
				template = jest.fn().mockResolvedValue('mock-template-html');
				jest.spyOn(instance, 'applyDefaultRenderContext').mockReturnValue('mock-defaulted-render-context');
				jest.spyOn(instance, 'applyStringTransforms').mockReturnValue('mock-applied-string-transforms');
				jest.spyOn(instance, 'loadTemplate').mockReturnValue(template);
				jest.spyOn(Renderer, 'assertIsHtmlElement').mockReturnValue(undefined);
				returnValue = await instance.render('mock-template-names', 'mock-render-context');
			});

			afterEach(() => {
				instance.applyDefaultRenderContext.mockRestore();
				instance.applyStringTransforms.mockRestore();
				instance.loadTemplate.mockRestore();
				Renderer.assertIsHtmlElement.mockRestore();
			});

			it('applies the default render context', () => {
				expect(instance.applyDefaultRenderContext).toHaveBeenCalledTimes(1);
				expect(instance.applyDefaultRenderContext).toHaveBeenCalledWith('mock-render-context');
			});

			it('loads the requested template', () => {
				expect(instance.loadTemplate).toHaveBeenCalledTimes(1);
				expect(instance.loadTemplate).toHaveBeenCalledWith('mock-template-names');
			});

			it('calls the loaded template with the defaulted render context', () => {
				expect(template).toHaveBeenCalledTimes(1);
				expect(template).toHaveBeenCalledWith('mock-defaulted-render-context');
			});

			it('asserts that the resolved template value is an HTML element', () => {
				expect(Renderer.assertIsHtmlElement).toHaveBeenCalledTimes(1);
				expect(Renderer.assertIsHtmlElement).toHaveBeenCalledWith('mock-template-html', 'Templates must return an HTML element');
			});

			it('renders the HTML element with Hyperons', () => {
				expect(Hyperons.render).toHaveBeenCalledTimes(1);
				expect(Hyperons.render).toHaveBeenCalledWith('mock-template-html');
			});

			it('applies string transforms to the rendered template', () => {
				expect(instance.applyStringTransforms).toHaveBeenCalledTimes(1);
				expect(instance.applyStringTransforms).toHaveBeenCalledWith(
					Hyperons.render.mock.results[0].value,
					'mock-defaulted-render-context'
				);
			});

			it('returns the transformed string', () => {
				expect(returnValue).toStrictEqual('mock-applied-string-transforms');
			});

		});

		describe('.koa()', () => {
			let middleware;

			beforeEach(() => {
				middleware = instance.koa();
			});

			it('returns a Koa middleware function', () => {
				expect(middleware).toBeInstanceOf(Function);
			});

			describe('middleware(context, next)', () => {
				let context;
				let next;
				let returnValue;

				beforeEach(() => {
					context = {
						body: null,
						state: {
							mockState: true
						}
					};
					next = jest.fn().mockReturnValue('mock-next-return');
					returnValue = middleware(context, next);
				});

				it('adds a render method to `context`', () => {
					expect(context.render).toBeInstanceOf(Function);
				});

				it('calls and returns `next`', () => {
					expect(next).toHaveBeenCalledTimes(1);
					expect(next).toHaveBeenCalledWith();
					expect(returnValue).toStrictEqual('mock-next-return');
				});

				describe('context.render(templateNames, renderContext', () => {
					let defaultedRenderContext;
					let renderContext;

					beforeEach(async () => {
						renderContext = {
							mockRenderContext: true
						};
						defaultedRenderContext = {
							mockDefaultedRenderContext: true
						};
						jest.spyOn(Object, 'assign').mockReturnValue(defaultedRenderContext);
						jest.spyOn(instance, 'render').mockResolvedValue('mock-rendered-template');
						await context.render('mock-template-names', renderContext);
					});

					afterEach(() => {
						Object.assign.mockRestore();
						instance.render.mockRestore();
					});

					it('merges the `renderContext` with `context.state`', () => {
						expect(Object.assign).toHaveBeenCalledTimes(1);
						expect(Object.assign).toHaveBeenCalledWith({}, context.state, renderContext);
					});

					it('renders the `templateNames` with the defaulted render context', () => {
						expect(instance.render).toHaveBeenCalledTimes(1);
						expect(instance.render).toHaveBeenCalledWith('mock-template-names', defaultedRenderContext);
					});

					it('sets `context.body` to the rendered template', () => {
						expect(context.body).toStrictEqual('mock-rendered-template');
					});

				});

			});

		});

		describe('.applyStringTransforms(renderedTemplate, renderContext)', () => {
			let renderContext;
			let returnValue;

			beforeEach(() => {
				renderContext = {};
				returnValue = instance.applyStringTransforms('mock-rendered-template', renderContext);
			});

			it('returns the rendered template', () => {
				expect(returnValue).toStrictEqual('mock-rendered-template');
			});

			describe('when `renderContext.doctype` is set', () => {

				beforeEach(() => {
					renderContext.doctype = '<!MOCKTYPE html>';
					returnValue = instance.applyStringTransforms('mock-rendered-template', renderContext);
				});

				it('returns the rendered template with the doctype prepended', () => {
					expect(returnValue).toStrictEqual('<!MOCKTYPE html>mock-rendered-template');
				});

			});

			describe('when `renderContext` is not set', () => {

				beforeEach(() => {
					returnValue = instance.applyStringTransforms('mock-rendered-template');
				});

				it('returns the rendered template', () => {
					expect(returnValue).toStrictEqual('mock-rendered-template');
				});

			});

		});

		describe('.applyDefaultRenderContext(renderContext)', () => {
			let defaultedRenderContext;
			let renderContext;
			let returnValue;

			beforeEach(() => {
				renderContext = {mockRenderContext: true};
				defaultedRenderContext = {mockDefaultedRenderContext: true};
				instance.renderContext = {mockInstanceRenderContext: true};
				jest.spyOn(Object, 'assign').mockReturnValue(defaultedRenderContext);
				returnValue = instance.applyDefaultRenderContext(renderContext);
			});

			afterEach(() => {
				Object.assign.mockRestore();
			});

			it('defaults the `renderContext`', () => {
				expect(Object.assign).toHaveBeenCalledTimes(1);
				expect(Object.assign).toHaveBeenCalledWith({}, instance.renderContext, renderContext);
			});

			it('returns the defaulted render context', () => {
				expect(returnValue).toEqual(defaultedRenderContext);
			});

		});

		describe('.loadTemplate(templateNames)', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, 'resolveTemplatePaths').mockReturnValue('mock-resolved-template-paths');
				jest.spyOn(Renderer, 'assertIsFunction').mockReturnValue(undefined);
				requireFirst.mockReturnValue('mock-template-module');
				returnValue = instance.loadTemplate('mock-template-names');
			});

			afterEach(() => {
				instance.resolveTemplatePaths.mockRestore();
				Renderer.assertIsFunction.mockRestore();
			});

			it('resolves the template names', () => {
				expect(instance.resolveTemplatePaths).toHaveBeenCalledTimes(1);
				expect(instance.resolveTemplatePaths).toHaveBeenCalledWith('mock-template-names');
			});

			it('requires the resolved template paths using `requireFirst`', () => {
				expect(requireFirst).toHaveBeenCalledTimes(1);
				expect(requireFirst).toHaveBeenCalledWith('mock-resolved-template-paths');
			});

			it('asserts that the loaded template is a function', () => {
				expect(Renderer.assertIsFunction).toHaveBeenCalledTimes(1);
				expect(Renderer.assertIsFunction).toHaveBeenCalledWith('mock-template-module', 'Templates must export a function');
			});

			it('returns the template', () => {
				expect(returnValue).toEqual('mock-template-module');
			});

		});

		describe('.resolveTemplatePaths(templateNames)', () => {
			let returnValue;

			beforeEach(() => {
				jest.spyOn(instance, 'resolveTemplatePath')
					.mockReturnValueOnce('mock-resolved-path-1')
					.mockReturnValueOnce('mock-resolved-path-2')
					.mockReturnValueOnce('mock-resolved-path-3');
				returnValue = instance.resolveTemplatePaths([
					'mock-template-name-1',
					'mock-template-name-2',
					'mock-template-name-3'
				]);
			});

			afterEach(() => {
				instance.resolveTemplatePath.mockRestore();
			});

			it('resolves each template path', () => {
				expect(instance.resolveTemplatePath).toHaveBeenCalledTimes(3);
				expect(instance.resolveTemplatePath.mock.calls[0][0]).toStrictEqual('mock-template-name-1');
				expect(instance.resolveTemplatePath.mock.calls[1][0]).toStrictEqual('mock-template-name-2');
				expect(instance.resolveTemplatePath.mock.calls[2][0]).toStrictEqual('mock-template-name-3');
			});

			it('returns the resolved template paths', () => {
				expect(returnValue).toEqual([
					'mock-resolved-path-1',
					'mock-resolved-path-2',
					'mock-resolved-path-3'
				]);
			});

			describe('when `templateNames` is a string', () => {

				beforeEach(() => {
					instance.resolveTemplatePath.mockReset();
					instance.resolveTemplatePath.mockReturnValue('mock-resolved-path-1');
					returnValue = instance.resolveTemplatePaths('mock-template-name-1');
				});

				it('resolves the template path', () => {
					expect(instance.resolveTemplatePath).toHaveBeenCalledTimes(1);
					expect(instance.resolveTemplatePath.mock.calls[0][0]).toStrictEqual('mock-template-name-1');
				});

				it('returns the resolved template path as an array', () => {
					expect(returnValue).toEqual([
						'mock-resolved-path-1'
					]);
				});

			});

		});

		describe('.resolveTemplatePath(templateName)', () => {
			let parsedTemplate;
			let returnValue;

			beforeEach(() => {
				parsedTemplate = {
					namespace: 'mock-namespace',
					template: 'mock-template'
				};
				jest.spyOn(Renderer, 'parseTemplateName').mockReturnValue(parsedTemplate);
				instance.namespaces = new Map([
					['mock-namespace', 'mock-namespace-path']
				]);
				returnValue = instance.resolveTemplatePath('mock-template-name');
			});

			afterEach(() => {
				Renderer.parseTemplateName.mockRestore();
			});

			it('parses the template name', () => {
				expect(Renderer.parseTemplateName).toHaveBeenCalledTimes(1);
				expect(Renderer.parseTemplateName).toHaveBeenCalledWith('mock-template-name');
			});

			it('returns the resolved template path', () => {
				expect(returnValue).toStrictEqual('mock-namespace-path/mock-template');
			});

			describe('when the parsed namespace is not valid', () => {

				beforeEach(() => {
					parsedTemplate.namespace = 'mock-invalid-namespace';
				});

				it('throws an error', () => {
					expect(() => {
						instance.resolveTemplatePath('mock-template-name');
					}).toThrow(new Error('Renderer namespace "mock-invalid-namespace" is not configured'));
				});

			});

		});

	});

	describe('.defaultOptions', () => {

		it('is an object', () => {
			expect(Renderer.defaultOptions).not.toBeNull();
			expect(typeof Renderer.defaultOptions).toStrictEqual('object');
		});

		describe('.env', () => {

			it('is set to the `NODE_ENV` environment variable', () => {
				expect(Renderer.defaultOptions.env).toStrictEqual(process.env.NODE_ENV);
			});

			describe('when `NODE_ENV` is not set', () => {

				beforeEach(() => {
					jest.resetModules();
					delete process.env.NODE_ENV;
					Renderer = require('../../../lib/renderer');
				});

				it('is set to "development"', () => {
					expect(Renderer.defaultOptions.env).toStrictEqual('development');
				});

			});

		});

		describe('.path', () => {

			it('is set to the expected file path', () => {
				const expectedPath = path.resolve(process.cwd(), 'view');
				expect(Renderer.defaultOptions.path).toStrictEqual(expectedPath);
			});

		});

		describe('.namespacePaths', () => {

			it('is set to an empty object', () => {
				expect(Renderer.defaultOptions.namespacePaths).toEqual({});
			});

		});

	});

	describe('.html', () => {

		it('is an htm template tag bound to Hyperons', () => {
			expect(Renderer.html).toStrictEqual(htm.bind.mock.results[0].value);
		});

	});

	describe('.Partial', () => {

		it('aliases `lib/partial`', () => {
			expect(Renderer.Partial).toStrictEqual(Partial);
		});

	});

	describe('.applyDefaultOptions(options)', () => {
		let defaultedOptions;
		let expectedOptions;
		let returnValue;
		let userOptions;

		beforeEach(() => {
			userOptions = {mockUserOptions: true};
			defaultedOptions = {
				env: 'mock-env',
				path: 'mock-path',
				namespacePaths: {
					'mock-namespace': 'mock-namespace-path'
				}
			};
			expectedOptions = {
				env: 'mock-env',
				namespacePaths: {
					__default: 'mock-path',
					'mock-namespace': 'mock-namespace-path'
				}
			};
			jest.spyOn(Object, 'assign').mockReturnValue(defaultedOptions);
			returnValue = Renderer.applyDefaultOptions(userOptions);
		});

		afterEach(() => {
			Object.assign.mockRestore();
		});

		it('defaults the `options`', () => {
			expect(Object.assign).toHaveBeenCalledTimes(1);
			expect(Object.assign).toHaveBeenCalledWith({}, Renderer.defaultOptions, userOptions);
		});

		it('returns the defaulted options with some transformations', () => {
			expect(returnValue).toEqual(expectedOptions);
		});

	});

	describe('.parseTemplateName(templateName)', () => {
		let returnValue;

		describe('when `templateName` includes a namespace and template', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('mock-namespace:mock-template');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: 'mock-namespace',
					template: 'mock-template'
				});
			});

		});

		describe('when `templateName` includes only a template', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('mock-template');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: '__default',
					template: 'mock-template'
				});
			});

		});

		describe('when `templateName` includes a template and an empty namespace', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName(':mock-template');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: '__default',
					template: 'mock-template'
				});
			});

		});

		describe('when `templateName` includes only a namespace', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('mock-namespace:');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: 'mock-namespace',
					template: 'index'
				});
			});

		});

		describe('when `templateName` includes additional namespace separators', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('mock-namespace:mock:template');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: 'mock-namespace',
					template: 'mock:template'
				});
			});

		});

		describe('when `templateName` is empty', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('');
			});

			it('returns the expected parsed template name as an object', () => {
				expect(returnValue).toEqual({
					namespace: '__default',
					template: 'index'
				});
			});

		});

	});

	describe('.isHtmlElement(value)', () => {

		describe('when `value` looks like an HTML element', () => {

			it('returns `true`', () => {
				expect(Renderer.isHtmlElement({
					type: 'mock-tag-name',
					props: {}
				})).toStrictEqual(true);
			});

		});

		describe('when `value` is an array of things that look like HTML elements', () => {

			it('returns `true`', () => {
				expect(Renderer.isHtmlElement([
					{
						type: 'mock-tag-name',
						props: {}
					},
					{
						type: 'mock-tag-name',
						props: {}
					}
				])).toStrictEqual(true);
			});

		});

		describe('when `value` does not look like an HTML element', () => {

			it('returns `false`', () => {
				expect(Renderer.isHtmlElement('mock')).toStrictEqual(false);
				expect(Renderer.isHtmlElement({})).toStrictEqual(false);
				expect(Renderer.isHtmlElement({
					type: undefined,
					props: undefined
				})).toStrictEqual(false);
				expect(Renderer.isHtmlElement([
					{
						type: 'mock-tag-name',
						props: {}
					},
					'mock'
				])).toStrictEqual(false);
			});

		});

	});

	describe('.assertIsHtmlElement(value, errorMessage)', () => {

		beforeEach(() => {
			jest.spyOn(Renderer, 'isHtmlElement');
		});

		afterEach(() => {
			Renderer.isHtmlElement.mockRestore();
		});

		describe('when `.isHtmlElement(value)` returns `true`', () => {

			beforeEach(() => {
				Renderer.isHtmlElement.mockReturnValue(true);
			});

			it('does not throw', () => {
				expect(() => {
					Renderer.assertIsHtmlElement('mock-value', 'mock-message');
				}).not.toThrow();
			});

		});

		describe('when `.isHtmlElement(value)` returns `false`', () => {

			beforeEach(() => {
				Renderer.isHtmlElement.mockReturnValue(false);
			});

			it('throws an error with `errorMessage` as the message', () => {
				expect(() => {
					Renderer.assertIsHtmlElement('mock-value', 'mock-message');
				}).toThrow(new TypeError('mock-message'));
			});

		});

	});

	describe('.assertIsFunction(value, errorMessage)', () => {

		describe('when `value` is a function', () => {

			it('does not throw', () => {
				expect(() => {
					Renderer.assertIsFunction(() => 'mock-return', 'mock-message');
				}).not.toThrow();
			});

		});

		describe('when `.isHtmlElement(value)` returns `false`', () => {

			it('throws an error with `errorMessage` as the message', () => {
				expect(() => {
					Renderer.assertIsFunction('mock-value', 'mock-message');
				}).toThrow(new TypeError('mock-message'));
			});

		});

	});

});
