'use strict';

// Load in the html template tag
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html} = require('../../..');

// Load in a partial to display a navigation structure
const navigation = require('./partial/navigation');

// Export a function which accepts a render context
// and returns an HTML element
module.exports = context => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<${navigation}>
					<a href="#example1">Example 1</a>
					<a href="#example2">Example 2</a>
				<//>
				<h1>${context.title}</h1>
				<p>This is an example page.</p>
			</body>
		</html>
	`;
};
