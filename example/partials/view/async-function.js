'use strict';

// Load in the html template tag
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html} = require('../../..');

// Load in a partial to get content from a file
const loadFileContent = require('./partial/load-file-content');

// Export a function which accepts a render context
// and returns an HTML element
module.exports = async context => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<h1>${context.title}</h1>
				${await loadFileContent(`${__dirname}/data/content.txt`)}
			</body>
		</html>
	`;
};
