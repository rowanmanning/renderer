'use strict';

// Load in the html template tag
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html} = require('../../../..');

// Export a function which accepts a context and
// returns an HTML element
module.exports = context => {
	return html`
		<nav>
			<ul>
				${context.children.map(child => html`
					<li>${child}</li>
				`)}
			</ul>
		</nav>
	`;
};
