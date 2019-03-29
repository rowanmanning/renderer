/**
 * @rowanmanning/renderer module
 * @module @rowanmanning/renderer
 */
'use strict';

const htm = require('htm');
const Hyperons = require('hyperons');
const Partial = require('./partial');
const path = require('path');
const requireFirst = require('@rowanmanning/require-first');

/**
 * The default renderer namespace name. Used when a namespace is not specified.
 *
 * @access private
 * @type {String}
 */
const DEFAULT_NAMESPACE = '__default';

/**
 * The default renderer template name. Used when a template name is not specified.
 *
 * @access private
 * @type {String}
 */
const DEFAULT_TEMPLATE = 'index';

/**
 * Represents a template renderer.
 */
class Renderer {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {Object} [options={}]
	 *     An options object used to configure the renderer.
	 * @param {String} [options.env='development']
	 *     The environment that the renderer is running in. One of "production" or "development".
	 *     Defaults to the `NODE_ENV` environment variable.
	 * @param {String} [options.path='<CWD>/view']
	 *     The path to look for template files in.
	 * @param {Object<String>} [options.namespacePaths={}]
	 *     Key/value pairs of namespaces, and the path to look for namespaced template files in.
	 */
	constructor(options) {
		options = this.constructor.applyDefaultOptions(options);
		this.env = options.env;
		this.namespaces = new Map(Object.entries(options.namespacePaths));
		this.renderContext = {
			doctype: '<!DOCTYPE html>'
		};
	}

	/**
	 * Render a template.
	 *
	 * @access public
	 * @param {(String|Array<String>)} templateNames
	 *     The name of a template, or an array of names. If multiple names are provided, then they
	 *     will be loaded in order; the first to resolve will be rendered. Template names are loaded
	 *     relative to the configured paths. Template names can be namespaced to indicate that they
	 *     should be loaded from the specified namespace path. See examples for more information.
	 * @param {Object} [renderContext={}]
	 *     Data to pass into the template.
	 * @returns {Promise<String>}
	 *     Returns a promise that resolves to the rendered template.
	 * @throws {Error}
	 *     Throws if any of the template names include a namespace that is not configured.
	 * @throws {Error}
	 *     Throws if none of the given template names can be loaded.
	 * @throws {TypeError}
	 *     Throws if the loaded template does not export a function.
	 * @throws {TypeError}
	 *     Throws if the loaded template function does not return an HTML element.
	 */
	async render(templateNames, renderContext) {
		renderContext = this.applyDefaultRenderContext(renderContext);
		const htmlElement = await this.loadTemplate(templateNames)(renderContext);
		this.constructor.assertIsHtmlElement(htmlElement, `Templates must return an HTML element`);
		return this.applyStringTransforms(Hyperons.renderToString(htmlElement), renderContext);
	}

	/**
	 * Create a Koa middleware function which augments the Koa context with a `render` method.
	 * See the {@link Renderer#render} method for more information.
	 *
	 * @access public
	 * @returns {Function}
	 *     Returns a Koa middleware function.
	 */
	koa() {
		return (context, next) => {
			context.render = async (templateNames, renderContext) => {
				renderContext = Object.assign({}, context.state, renderContext);
				context.body = await this.render(templateNames, renderContext);
			};
			return next();
		};
	}

	/**
	 * Apply string transformations to a rendered template.
	 * Used internally by {@link Renderer#render}.
	 *
	 * @access private
	 * @param {String} renderedTemplate
	 *     The rendered template string.
	 * @param {Object} [renderContext={}]
	 *     Data that was passed into the template before it was rendered.
	 * @returns {String}
	 *     Returns the rendered template with string transformations applied.
	 */
	applyStringTransforms(renderedTemplate, renderContext = {}) {
		if (renderContext.doctype) {
			renderedTemplate = `${renderContext.doctype}${renderedTemplate}`;
		}
		return renderedTemplate;
	}

	/**
	 * Apply default values to a render context.
	 * Used internally by {@link Renderer#render}.
	 *
	 * @access private
	 * @param {Object} [renderContext={}]
	 *     Data to add on top of the defaults.
	 * @returns {Object}
	 *     Returns the defaulted render context.
	 */
	applyDefaultRenderContext(renderContext) {
		return Object.assign({}, this.renderContext, renderContext);
	}

	/**
	 * Load and return a template without rendering it.
	 * Used internally by {@link Renderer#render}.
	 *
	 * @access private
	 * @param {(String|Array<String>)} templateNames
	 *     See {@link Renderer#render}.
	 * @returns {Function}
	 *     Returns the template function.
	 * @throws {Error}
	 *     Throws if none of the given template names can be loaded.
	 * @throws {TypeError}
	 *     Throws if the loaded template does not export a function.
	 */
	loadTemplate(templateNames) {
		const template = requireFirst(this.resolveTemplatePaths(templateNames));
		this.constructor.assertIsFunction(template, `Templates must export a function`);
		return template;
	}

	/**
	 * Resolve template names against the configured paths.
	 * Used internally by {@link Renderer#loadTemplate}.
	 *
	 * @access private
	 * @param {(String|Array<String>)} templateNames
	 *     See {@link Renderer#render}.
	 * @returns {Array}
	 *     Returns the full resolved paths for each of the template names.
	 * @throws {Error}
	 *     Throws if any of the template names include a namespace that is not configured.
	 */
	resolveTemplatePaths(templateNames) {
		templateNames = (Array.isArray(templateNames) ? templateNames : [templateNames]);
		return templateNames.map(this.resolveTemplatePath.bind(this));
	}

	/**
	 * Resolve a template name against the configured paths.
	 * Used internally by {@link Renderer#resolveTemplatePaths}.
	 *
	 * @access private
	 * @param {String} templateName
	 *     See {@link Renderer#render}.
	 * @returns {String}
	 *     Returns the full resolved path for the template name.
	 * @throws {Error}
	 *     Throws if the template name includes a namespace that is not configured.
	 */
	resolveTemplatePath(templateName) {
		const {namespace, template} = this.constructor.parseTemplateName(templateName);
		if (!this.namespaces.has(namespace)) {
			throw new Error(`Renderer namespace "${namespace}" is not configured`);
		}
		return path.join(this.namespaces.get(namespace), template);
	}

	/**
	 * Apply default values to a set of user-provided options.
	 * Used internally by {@link Renderer#constructor}.
	 *
	 * @access private
	 * @param {Object} [userOptions={}]
	 *     Options to add on top of the defaults. See {@link Renderer#constructor}.
	 * @returns {Object}
	 *     Returns the defaulted options.
	 */
	static applyDefaultOptions(userOptions) {
		const options = Object.assign({}, this.defaultOptions, userOptions);
		options.namespacePaths[DEFAULT_NAMESPACE] = options.path;
		delete options.path;
		return options;
	}

	/**
	 * @typedef {Object} TemplateDescriptor
	 * @property {String} namespace
	 *     The namespace that a template belongs to.
	 * @property {String} template
	 *     The actual template name, without the namespace.
	 */

	/**
	 * Parse a template name into a namspace and template.
	 * Used internally by {@link Renderer#resolveTemplatePath}.
	 *
	 * @access private
	 * @param {String} templateName
	 *     See {@link Renderer#render}.
	 * @returns {TemplateDescriptor}
	 *     Returns an object which describes the template.
	 */
	static parseTemplateName(templateName) {
		const {groups} = this.templateNameRegexp.exec(templateName);
		return {
			namespace: groups.namespace || DEFAULT_NAMESPACE,
			template: groups.template || DEFAULT_TEMPLATE
		};
	}

	/**
	 * Check whether a value is an HTML element, as returned by
	 * {@link https://github.com/i-like-robots/hyperons|Hyperons}.
	 *
	 * @access private
	 * @param {*} value
	 *     The value to test.
	 * @returns {Boolean}
	 *     Returns whether the value is an HTML element.
	 */
	static isHtmlElement(value) {
		if (Array.isArray(value)) {
			return value.every(item => this.isHtmlElement(item));
		}
		return (
			value &&
			typeof value === 'object' &&
			value.type !== undefined &&
			value.props !== undefined
		);
	}

	/**
	 * Assert that a value is an HTML element, as returned by
	 * {@link https://github.com/i-like-robots/hyperons|Hyperons}.
	 *
	 * @access private
	 * @param {*} value
	 *     The value to test.
	 * @param {String} errorMessage
	 *     The error message to use if the value is not an HTML element.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {TypeError}
	 *     Throws if the value is not an HTML element.
	 */
	static assertIsHtmlElement(value, errorMessage) {
		if (!this.isHtmlElement(value)) {
			throw new TypeError(errorMessage);
		}
	}

	/**
	 * Assert that a value is a function.
	 *
	 * @access private
	 * @param {*} value
	 *     The value to test.
	 * @param {String} errorMessage
	 *     The error message to use if the value is not a function.
	 * @returns {undefined}
	 *     Returns nothing.
	 * @throws {TypeError}
	 *     Throws if the value is not a function.
	 */
	static assertIsFunction(value, errorMessage) {
		if (typeof value !== 'function') {
			throw new TypeError(errorMessage);
		}
	}

}

/**
 * Default options to be used in construction of a renderer.
 *
 * @access private
 * @type {Object}
 */
Renderer.defaultOptions = {
	env: (process.env.NODE_ENV || 'development'),
	path: path.resolve(process.cwd(), 'view'),
	namespacePaths: {}
};

/**
 * Regular expression used to parse template names.
 *
 * @access private
 * @type {RegExp}
 */
Renderer.templateNameRegexp = /^((?<namespace>[^:]*):)?(?<template>.*)$/;

/**
 * The htm template tag, for use in rendering templates.
 * TODO add examples.
 *
 * @access public
 * @type {Function}
 */
Renderer.html = htm.bind(Hyperons.createElement);

/**
 * A reference to the Partial class.
 *
 * @access public
 * @type {Partial}
 */
Renderer.Partial = Partial;

module.exports = Renderer;
