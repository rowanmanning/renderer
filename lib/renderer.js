/**
 * @rowanmanning/renderer module
 * @module @rowanmanning/renderer
 */
'use strict';

const htm = require('htm');
const Hyperons = require('hyperons');
const path = require('path');

/**
 * Create a render function.
 *
 * @access public
 * @param {Object} [options] - Rendering options.
 * @param {String} [options.viewPath] - The absolute path to a folder full of view files.
 * @returns {Function} Returns a render function.
 */
function renderer(options) {
	options = Object.assign({}, renderer.defaultOptions, options);
	const html = htm.bind(Hyperons.h);

	/**
	 * Render a view.
	 *
	 * @access public
	 * @param {String} templatePath - The path to the template, relative to the view folder.
	 * @param {Object} [renderContext] - Data to pass into the views.
	 * @returns {String} Returns the rendered template.
	 */
	function render(templatePath, renderContext) {
		renderContext = Object.assign({}, renderer.defaultRenderContext, renderContext);
		const template = require(resolveTemplatePath(templatePath));
		const output = Hyperons.render(template(html, renderContext));
		return `${renderContext.doctype || ''}${output}`;
	}

	/**
	 * Create a Koa middleware for rendering views.
	 *
	 * @access public
	 * @returns {Function} Returns Koa middleware.
	 */
	render.koa = function koa() {
		return function koaRenderMiddleware(context, next) {
			context.render = (templatePath, renderContext) => {
				renderContext = Object.assign({}, context.state, renderContext);
				context.body = render(templatePath, renderContext);
			};
			return next();
		};
	};

	/**
	 * Resolve a template path, by joining it to the view path.
	 *
	 * @access private
	 * @param {String} templatePath - The path to resolve.
	 * @returns {String} Returns the full path.
	 */
	function resolveTemplatePath(templatePath) {
		return path.join(options.viewPath, templatePath);
	}

	return render;
}

/**
 * Default renderer options.
 *
 * @access public
 * @type {Object}
 */
renderer.defaultOptions = {
	viewPath: path.resolve(process.cwd(), 'view')
};

/**
 * Default render context data.
 *
 * @access public
 * @type {Object}
 */
renderer.defaultRenderContext = {
	doctype: '<!DOCTYPE html>'
};

module.exports = renderer;
