'use strict';

const path = require('path');

// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const Renderer = require('../..');

// Create a renderer with a path of `./view`
const renderer = new Renderer({
	path: path.join(__dirname, 'view')
});

// Rendering happens asynchronously, so for this example we
// wrap render calls in an immediately exectured function
(async () => {

	// Should resolve to ./view/home
	console.log(await renderer.render('home', {
		title: 'Home'
	}));

})();
