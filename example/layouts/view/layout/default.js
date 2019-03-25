'use strict';

// Load in the html template tag
const {html} = require('../../../..');

// Export a function which accepts a context and
// a rendered view, and returns an HTML element
module.exports = (context, content) => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				${content}
			</body>
		</html>
	`;
};
