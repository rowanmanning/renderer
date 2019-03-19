'use strict';

const htm = require('htm');
const Hyperons = require('hyperons');
const path = require('path');

function renderer(options) {
	options = Object.assign({}, renderer.defaultOptions, options);
	const html = htm.bind(Hyperons.h);

	function render(templatePath, renderContext) {
		renderContext = Object.assign(renderer.defaultRenderContext, renderContext);
		const template = require(resolveTemplatePath(templatePath));
		const output = Hyperons.render(template(html, renderContext));
		return `${renderContext.doctype || ''}${output}`;
	}

	function koaRender() {
		return (context, next) => {
			context.render = (templatePath, renderContext) => {
				renderContext = Object.assign({}, context.state, renderContext);
				context.body = render(templatePath, renderContext);
			};
			return next();
		};
	}

	function resolveTemplatePath(templatePath) {
		return path.join(options.viewPath, templatePath);
	}

	render.koa = koaRender;
	return render;
}

renderer.defaultOptions = {
	viewPath: path.resolve(process.cwd(), 'view')
};

renderer.defaultRenderContext = {
	doctype: '<!DOCTYPE html>'
};

module.exports = renderer;
