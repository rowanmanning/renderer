'use strict';

const Koa = require('koa');
const path = require('path');

// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const Renderer = require('../..');

// Create a Koa app
const app = new Koa();

// Create a renderer with a path of `./view`
const renderer = new Renderer({
	path: path.join(__dirname, 'view')
});

// Use the renderer in the Koa app
app.use(renderer.koa());

// Render the view
app.use(async (context, next) => {
	if (context.path === '/') {
		await context.render('home', {
			title: 'Home'
		});
	}
	return next();
});

// Start the app
app.listen(process.env.PORT || 8080, error => {
	if (error) {
		process.exitCode = 1;
		return console.error(error.stack);
	}
	console.info('Koa application started');
});
