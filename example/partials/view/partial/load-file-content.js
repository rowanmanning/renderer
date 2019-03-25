'use strict';

// Load in the html template tag
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html} = require('../../../..');

const {promisify} = require('util');
const readFile = promisify(require('fs').readFile);

// Export a function which accepts a context and
// returns an HTML element
module.exports = async filePath => {
	const content = await readFile(filePath, 'utf-8');
	return html`
		<p>${content}</p>
	`;
};
