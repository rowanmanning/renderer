'use strict';

// Load in the html template tag and the Partial class for extending
// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const {html, Partial} = require('../../../..');

// Export a class which extends the built-in Partial class
module.exports = class Copyright extends Partial {

	// The render function uses `this.context` and returns
	// an HTML element
	render() {
		return html`
			<small>
				Copyright © ${this.currentYear()}, ${this.context.holder}
			</small>
		`;
	}

	// You can break any view logic into class methods
	currentYear() {
		return new Date().getFullYear();
	}

};
