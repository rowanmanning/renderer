'use strict';

const path = require('path');

// Note: in your own code you can replace this require with `@rowanmanning/renderer`
const Renderer = require('../..');

// Create a renderer with a default path of `./view`
// and an admin path of `./admin-view`
const renderer = new Renderer({
	path: path.join(__dirname, 'view'),
	namespacePaths: {
		admin: path.join(__dirname, 'admin-view')
	}
});

// Rendering happens asynchronously, so for this example we
// wrap render calls in an immediately exectured function
(async () => {

	// Should resolve to ./view/home
	console.log(await renderer.render('home', {
		title: 'Home'
	}));

	// Should resolve to ./admin-view/users
	console.log(await renderer.render('admin:users', {
		title: 'User Admin'
	}));

	// Should resolve to ./admin-view/posts
	console.log(await renderer.render(['posts', 'admin:posts'], {
		title: 'Posts'
	}));

})();
