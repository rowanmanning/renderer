'use strict';

// Load in the html template tag
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html} = require('../../..');

// Load in a layout to render common elements
const layout = require('./layout/default');

// Export a function which accepts a render context
// and returns the result of calling the layout function
module.exports = context => {
	return layout(context, html`
		<h1>${context.title}</h1>
		<p>This is the home page.</p>
	`);
};
