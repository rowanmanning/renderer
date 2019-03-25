'use strict';

/**
 * Represents a template partial.
 */
class Partial {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {Object} [renderContext={}]
	 *     Data to pass into the partial.
	 */
	constructor(renderContext = {}) {
		this.context = renderContext;
	}

	/**
	 * Render the partial.
	 *
	 * @access public
	 * @returns {(String|Object)}
	 *     Returns a string or an HTML element.
	 */
	render() {
		return `Unextended Partial (${this.constructor.name})`;
	}

}

module.exports = Partial;
