'use strict';

const express = require('express');
const path = require('path');

// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const Renderer = require('../..');

// Create an Express app
const app = express();

// Create a renderer. We don't bother setting a path as it's not used by Express
const renderer = new Renderer();

// Use the renderer to render views in the Express app
app.set('views', path.join(__dirname, 'view'));
app.engine('js', renderer.express());
app.set('view engine', 'js');

// Render the view
app.get('/', (request, response) => {
	response.render('home', {
		title: 'Home'
	});
});

// Start the app
app.listen(process.env.PORT || 8080, error => {
	if (error) {
		process.exitCode = 1;
		return console.error(error.stack);
	}
	console.info('Express application started');
});
