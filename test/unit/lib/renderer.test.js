'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/renderer', () => {
	let htm;
	let Hyperons;
	let Partial;
	let Renderer;
	let requireFirst;

	beforeEach(() => {
		process.env.NODE_ENV = 'test';
		htm = require('../mock/npm/htm');
		mockery.registerMock('htm', htm);
		Hyperons = require('../mock/npm/hyperons');
		mockery.registerMock('hyperons', Hyperons);
		Partial = require('../../../lib/partial');
		requireFirst = require('../mock/npm/@rowanmanning/require-first');
		mockery.registerMock('@rowanmanning/require-first', requireFirst);
		Renderer = require('../../../lib/renderer');
	});

	it('creates an `htm` template tag using Hyperons', () => {
		assert.calledOnce(htm.bind);
		assert.calledWith(htm.bind, Hyperons.createElement);
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
			sinon.stub(Renderer, 'applyDefaultOptions').returns(defaultedOptions);
			userOptions = {mockUserOptions: true};
			instance = new Renderer(userOptions);
		});

		it('calls `Renderer.applyDefaultOptions` with `options`', () => {
			assert.calledOnce(Renderer.applyDefaultOptions);
			assert.calledWith(Renderer.applyDefaultOptions, userOptions);
		});

		describe('.env', () => {

			it('is set to the defaulted `env` option', () => {
				assert.strictEqual(instance.env, 'mock-env');
			});

		});

		describe('.namespaces', () => {

			it('is set to a Map representation of the defaulted `path` and `namespacePaths` options', () => {
				assert.isInstanceOf(instance.namespaces, Map);
				assert.strictEqual(instance.namespaces.size, 2);
				assert.isTrue(instance.namespaces.has('__default'));
				assert.strictEqual(instance.namespaces.get('__default'), 'mock-default-path');
				assert.isTrue(instance.namespaces.has('mock-namespace'));
				assert.strictEqual(instance.namespaces.get('mock-namespace'), 'mock-namespace-path');
			});

		});

		describe('.renderContext', () => {

			it('is an object', () => {
				assert.isNotNull(instance.renderContext);
				assert.strictEqual(typeof instance.renderContext, 'object');
			});

			describe('.doctype', () => {

				it('is set to the HTML5 doctype', () => {
					assert.strictEqual(instance.renderContext.doctype, '<!DOCTYPE html>');
				});

			});

		});

		describe('.render(templateNames, renderContext)', () => {
			let returnValue;
			let template;

			beforeEach(async () => {
				template = sinon.stub().resolves('mock-template-html');
				sinon.stub(instance, 'applyDefaultRenderContext').returns('mock-defaulted-render-context');
				sinon.stub(instance, 'applyStringTransforms').returns('mock-applied-string-transforms');
				sinon.stub(instance, 'loadTemplate').returns(template);
				sinon.stub(Renderer, 'assertIsHtmlElement').returns(undefined);
				returnValue = await instance.render('mock-template-names', 'mock-render-context');
			});

			it('applies the default render context', () => {
				assert.calledOnce(instance.applyDefaultRenderContext);
				assert.calledWith(instance.applyDefaultRenderContext, 'mock-render-context');
			});

			it('loads the requested template', () => {
				assert.calledOnce(instance.loadTemplate);
				assert.calledWith(instance.loadTemplate, 'mock-template-names');
			});

			it('calls the loaded template with the defaulted render context', () => {
				assert.calledOnce(template);
				assert.calledWith(template, 'mock-defaulted-render-context');
			});

			it('asserts that the resolved template value is an HTML element', () => {
				assert.calledOnce(Renderer.assertIsHtmlElement);
				assert.calledWith(Renderer.assertIsHtmlElement, 'mock-template-html', 'Templates must return an HTML element');
			});

			it('renders the HTML element with Hyperons', () => {
				assert.calledOnce(Hyperons.renderToString);
				assert.calledWith(Hyperons.renderToString, 'mock-template-html');
			});

			it('applies string transforms to the rendered template', () => {
				assert.calledOnce(instance.applyStringTransforms);
				assert.calledWith(
					instance.applyStringTransforms,
					Hyperons.renderToString.firstCall.returnValue,
					'mock-defaulted-render-context'
				);
			});

			it('returns the transformed string', () => {
				assert.strictEqual(returnValue, 'mock-applied-string-transforms');
			});

		});

		describe('.express()', () => {
			let viewEngine;

			beforeEach(() => {
				viewEngine = instance.express();
			});

			it('returns an Express view engine function', () => {
				assert.isFunction(viewEngine);
			});

			describe('viewEngine(filePath, renderContext, done)', () => {
				let filePath;
				let renderContext;
				let done;
				let returnValue;

				beforeEach(async () => {
					sinon.stub(instance, 'render').returns('mock-template');
					filePath = '/mock/file/path';
					renderContext = {
						mockContext: true
					};
					done = sinon.stub().returns('mock-done-return');
					returnValue = await viewEngine(filePath, renderContext, done);
				});

				it('renders the view', () => {
					assert.calledOnce(instance.render);
					assert.calledWith(instance.render, filePath, renderContext);
				});

				it('calls and returns `done`, with the rendered template', () => {
					assert.calledOnce(done);
					assert.calledWith(done, null, 'mock-template');
					assert.strictEqual(returnValue, 'mock-done-return');
				});

				describe('when `instance.render` errors', () => {
					let renderError;

					beforeEach(async () => {
						renderError = new Error('mock render error');
						instance.render.reset();
						instance.render.rejects(renderError);
						done = sinon.stub().returns('mock-done-return');
						returnValue = await viewEngine(filePath, renderContext, done);
					});

					it('attempts to render the view', () => {
						assert.calledOnce(instance.render);
						assert.calledWith(instance.render, filePath, renderContext);
					});

					it('calls and returns `done`, with the render error', () => {
						assert.calledOnce(done);
						assert.calledWith(done, renderError);
						assert.strictEqual(returnValue, 'mock-done-return');
					});

				});

			});

		});

		describe('.koa()', () => {
			let middleware;

			beforeEach(() => {
				middleware = instance.koa();
			});

			it('returns a Koa middleware function', () => {
				assert.isFunction(middleware);
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
					next = sinon.stub().returns('mock-next-return');
					returnValue = middleware(context, next);
				});

				it('adds a render method to `context`', () => {
					assert.isFunction(context.render);
				});

				it('calls and returns `next`', () => {
					assert.calledOnce(next);
					assert.calledWith(next);
					assert.strictEqual(returnValue, 'mock-next-return');
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
						sinon.stub(Object, 'assign').returns(defaultedRenderContext);
						sinon.stub(instance, 'render').resolves('mock-rendered-template');
						await context.render('mock-template-names', renderContext);
					});

					it('merges the `renderContext` with `context.state`', () => {
						assert.calledOnce(Object.assign);
						assert.calledWith(Object.assign, {}, context.state, renderContext);
					});

					it('renders the `templateNames` with the defaulted render context', () => {
						assert.calledOnce(instance.render);
						assert.calledWith(instance.render, 'mock-template-names', defaultedRenderContext);
					});

					it('sets `context.body` to the rendered template', () => {
						assert.strictEqual(context.body, 'mock-rendered-template');
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
				assert.strictEqual(returnValue, 'mock-rendered-template');
			});

			describe('when `renderContext.doctype` is set', () => {

				beforeEach(() => {
					renderContext.doctype = '<!MOCKTYPE html>';
					returnValue = instance.applyStringTransforms('mock-rendered-template', renderContext);
				});

				it('returns the rendered template with the doctype prepended', () => {
					assert.strictEqual(returnValue, '<!MOCKTYPE html>mock-rendered-template');
				});

			});

			describe('when `renderContext` is not set', () => {

				beforeEach(() => {
					returnValue = instance.applyStringTransforms('mock-rendered-template');
				});

				it('returns the rendered template', () => {
					assert.strictEqual(returnValue, 'mock-rendered-template');
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
				sinon.stub(Object, 'assign').returns(defaultedRenderContext);
				returnValue = instance.applyDefaultRenderContext(renderContext);
			});

			it('defaults the `renderContext`', () => {
				assert.calledOnce(Object.assign);
				assert.calledWith(Object.assign, {}, instance.renderContext, renderContext);
			});

			it('returns the defaulted render context', () => {
				assert.deepEqual(returnValue, defaultedRenderContext);
			});

		});

		describe('.loadTemplate(templateNames)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'resolveTemplatePaths').returns('mock-resolved-template-paths');
				sinon.stub(Renderer, 'assertIsFunction').returns(undefined);
				requireFirst.returns('mock-template-module');
				returnValue = instance.loadTemplate('mock-template-names');
			});

			it('resolves the template names', () => {
				assert.calledOnce(instance.resolveTemplatePaths);
				assert.calledWith(instance.resolveTemplatePaths, 'mock-template-names');
			});

			it('requires the resolved template paths using `requireFirst`', () => {
				assert.calledOnce(requireFirst);
				assert.calledWith(requireFirst, 'mock-resolved-template-paths');
			});

			it('asserts that the loaded template is a function', () => {
				assert.calledOnce(Renderer.assertIsFunction);
				assert.calledWith(Renderer.assertIsFunction, 'mock-template-module', 'Templates must export a function');
			});

			it('returns the template', () => {
				assert.deepEqual(returnValue, 'mock-template-module');
			});

		});

		describe('.resolveTemplatePaths(templateNames)', () => {
			let returnValue;

			beforeEach(() => {
				sinon.stub(instance, 'resolveTemplatePath');
				instance.resolveTemplatePath.onCall(0).returns('mock-resolved-path-1');
				instance.resolveTemplatePath.onCall(1).returns('mock-resolved-path-2');
				instance.resolveTemplatePath.onCall(2).returns('mock-resolved-path-3');
				returnValue = instance.resolveTemplatePaths([
					'mock-template-name-1',
					'mock-template-name-2',
					'mock-template-name-3'
				]);
			});

			it('resolves each template path', () => {
				assert.calledThrice(instance.resolveTemplatePath);
				assert.strictEqual(instance.resolveTemplatePath.firstCall.args[0], 'mock-template-name-1');
				assert.strictEqual(instance.resolveTemplatePath.secondCall.args[0], 'mock-template-name-2');
				assert.strictEqual(instance.resolveTemplatePath.thirdCall.args[0], 'mock-template-name-3');
			});

			it('returns the resolved template paths', () => {
				assert.deepEqual(returnValue, [
					'mock-resolved-path-1',
					'mock-resolved-path-2',
					'mock-resolved-path-3'
				]);
			});

			describe('when `templateNames` is a string', () => {

				beforeEach(() => {
					instance.resolveTemplatePath.reset();
					instance.resolveTemplatePath.returns('mock-resolved-path-1');
					returnValue = instance.resolveTemplatePaths('mock-template-name-1');
				});

				it('resolves the template path', () => {
					assert.calledOnce(instance.resolveTemplatePath);
					assert.strictEqual(instance.resolveTemplatePath.firstCall.args[0], 'mock-template-name-1');
				});

				it('returns the resolved template path as an array', () => {
					assert.deepEqual(returnValue, [
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
				sinon.stub(Renderer, 'parseTemplateName').returns(parsedTemplate);
				instance.namespaces = new Map([
					['mock-namespace', 'mock-namespace-path']
				]);
				returnValue = instance.resolveTemplatePath('mock-template-name');
			});

			it('parses the template name', () => {
				assert.calledOnce(Renderer.parseTemplateName);
				assert.calledWith(Renderer.parseTemplateName, 'mock-template-name');
			});

			it('returns the resolved template path', () => {
				assert.strictEqual(returnValue, 'mock-namespace-path/mock-template');
			});

			describe('when the template name begins with a slash character', () => {

				beforeEach(() => {
					Renderer.parseTemplateName.reset();
					returnValue = instance.resolveTemplatePath('/mock-template');
				});

				it('does not attempt to parse the template name', () => {
					assert.notCalled(Renderer.parseTemplateName);
				});

				it('returns the template name as-is', () => {
					assert.strictEqual(returnValue, '/mock-template');
				});

			});

			describe('when the parsed namespace is not valid', () => {

				beforeEach(() => {
					parsedTemplate.namespace = 'mock-invalid-namespace';
				});

				it('throws an error', () => {
					assert.throws(() => {
						instance.resolveTemplatePath('mock-template-name');
					}, 'Renderer namespace "mock-invalid-namespace" is not configured');
				});

			});

		});

	});

	describe('.defaultOptions', () => {

		it('is an object', () => {
			assert.isNotNull(Renderer.defaultOptions);
			assert.strictEqual(typeof Renderer.defaultOptions, 'object');
		});

		describe('.env', () => {

			it('is set to the `NODE_ENV` environment variable', () => {
				assert.strictEqual(Renderer.defaultOptions.env, process.env.NODE_ENV);
			});

			describe('when `NODE_ENV` is not set', () => {

				beforeEach(() => {
					mockery.deregisterAll();
					mockery.disable();
					sinon.restore();
					delete process.env.NODE_ENV;
					Renderer = require('../../../lib/renderer');
				});

				it('is set to "development"', () => {
					assert.strictEqual(Renderer.defaultOptions.env, 'development');
				});

			});

		});

		describe('.path', () => {

			it('is set to the expected file path', () => {
				const expectedPath = path.resolve(process.cwd(), 'view');
				assert.strictEqual(Renderer.defaultOptions.path, expectedPath);
			});

		});

		describe('.namespacePaths', () => {

			it('is set to an empty object', () => {
				assert.deepEqual(Renderer.defaultOptions.namespacePaths, {});
			});

		});

	});

	describe('.html', () => {

		it('is an htm template tag bound to Hyperons', () => {
			assert.strictEqual(Renderer.html, htm.bind.firstCall.returnValue);
		});

	});

	describe('.Partial', () => {

		it('aliases `lib/partial`', () => {
			assert.strictEqual(Renderer.Partial, Partial);
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
			sinon.stub(Object, 'assign').returns(defaultedOptions);
			returnValue = Renderer.applyDefaultOptions(userOptions);
		});

		it('defaults the `options`', () => {
			assert.calledOnce(Object.assign);
			assert.calledWith(Object.assign, {}, Renderer.defaultOptions, userOptions);
		});

		it('returns the defaulted options with some transformations', () => {
			assert.deepEqual(returnValue, expectedOptions);
		});

	});

	describe('.parseTemplateName(templateName)', () => {
		let returnValue;

		describe('when `templateName` includes a namespace and template', () => {

			beforeEach(() => {
				returnValue = Renderer.parseTemplateName('mock-namespace:mock-template');
			});

			it('returns the expected parsed template name as an object', () => {
				assert.deepEqual(returnValue, {
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
				assert.deepEqual(returnValue, {
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
				assert.deepEqual(returnValue, {
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
				assert.deepEqual(returnValue, {
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
				assert.deepEqual(returnValue, {
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
				assert.deepEqual(returnValue, {
					namespace: '__default',
					template: 'index'
				});
			});

		});

	});

	describe('.isHtmlElement(value)', () => {

		describe('when `value` looks like an HTML element', () => {

			it('returns `true`', () => {
				assert.isTrue(Renderer.isHtmlElement({
					type: 'mock-tag-name',
					props: {}
				}));
			});

		});

		describe('when `value` is an array of things that look like HTML elements', () => {

			it('returns `true`', () => {
				assert.isTrue(Renderer.isHtmlElement([
					{
						type: 'mock-tag-name',
						props: {}
					},
					{
						type: 'mock-tag-name',
						props: {}
					}
				]));
			});

		});

		describe('when `value` does not look like an HTML element', () => {

			it('returns `false`', () => {
				assert.isFalse(Renderer.isHtmlElement('mock'));
				assert.isFalse(Renderer.isHtmlElement({}));
				assert.isFalse(Renderer.isHtmlElement({
					type: undefined,
					props: undefined
				}));
				assert.isFalse(Renderer.isHtmlElement([
					{
						type: 'mock-tag-name',
						props: {}
					},
					'mock'
				]));
			});

		});

	});

	describe('.assertIsHtmlElement(value, errorMessage)', () => {

		beforeEach(() => {
			sinon.stub(Renderer, 'isHtmlElement');
		});

		describe('when `.isHtmlElement(value)` returns `true`', () => {

			beforeEach(() => {
				Renderer.isHtmlElement.returns(true);
			});

			it('does not throw', () => {
				assert.doesNotThrow(() => {
					Renderer.assertIsHtmlElement('mock-value', 'mock-message');
				});
			});

		});

		describe('when `.isHtmlElement(value)` returns `false`', () => {

			beforeEach(() => {
				Renderer.isHtmlElement.returns(false);
			});

			it('throws an error with `errorMessage` as the message', () => {
				assert.throws(() => {
					Renderer.assertIsHtmlElement('mock-value', 'mock-message');
				}, 'mock-message');
			});

		});

	});

	describe('.assertIsFunction(value, errorMessage)', () => {

		describe('when `value` is a function', () => {

			it('does not throw', () => {
				assert.doesNotThrow(() => {
					Renderer.assertIsFunction(() => 'mock-return', 'mock-message');
				});
			});

		});

		describe('when `.isHtmlElement(value)` returns `false`', () => {

			it('throws an error with `errorMessage` as the message', () => {
				assert.throws(() => {
					Renderer.assertIsFunction('mock-value', 'mock-message');
				}, 'mock-message');
			});

		});

	});

});
