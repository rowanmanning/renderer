
# @rowanmanning/renderer

Render [htm](https://github.com/developit/htm) views.

**:warning: This is pre-release software, use in production at your own risk**


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
    * [Creating a renderer](#creating-a-renderer)
    * [Rendering a view](#rendering-a-view)
    * [Creating a view](#creating-a-view)
	* [Using with Koa](#doctypes)
    * [Doctypes](#doctypes)
	* [Layouts](#layouts)
  * [Contributing](#contributing)
  * [License](#license)


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) 10+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/renderer
```

Load the library into your code with a `require` call:

```js
const renderer = require('@rowanmanning/renderer');
```

### Creating a renderer

```js
const render = renderer(options);
```

The available options are:

  - `viewPath`: Where the JavaScript views live. Defaults to `<CWD>/view`

### Rendering a view

To render the view in `<CWD>/view/example`, use:

```js
const output = render('example', context);
```

`context` is an object which contains properties that are made available to the view. `output` will be the rendered HTML as a string.

### Creating a view

View files are JavaScript, and they export functions that do the rendering. This exported function receives two arguments:

  1. `html`: an [htm](https://github.com/developit/htm) template tag bound to [Hyperons](https://github.com/i-like-robots/hyperons)
  2. The render context (what was passed into `render`)

The function must return a template literal tagged with the provided `html` function:

```js
module.exports = (html, context) => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<h1>${context.title}</h1>
				<p>Content goes here</p>
			</body>
		</html>
	`;
};
```

See the [Hyperons documentation](https://github.com/i-like-robots/hyperons) for more information about what's possible.

### Use with Koa

The `render.koa` method returns Koa middleware which can be used to render views:

```js
const Koa = require('koa');
const renderer = require('@rowanmanning/renderer');

const app = new Koa();
const render = renderer();

app.use(render.koa());
app.use(context => {
	context.render('example', {
		title: 'Example Page'
	});
});
```

The Koa middleware also merges the given render context with `context.state`:

```js
app.use(context => {
	context.state.title = 'Example Page';
	context.render('example');
});
```

### Doctypes

By default an HTML5 doctype is added to the rendered output. You can change the doctype by adding a `docytpe` property to the render `context`:

```js
const output = render('example', {
	doctype: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD … ">'
});
```

To remove the doctype entirely, set to a falsy value:

```js
const output = render('example', {
	doctype: null
});
```

### Layouts

Reusing layouts is achievable using standard Node.js `require` and composing functions together. There are many ways you could do this, here's an example:

```js
// FILE: view/layout.js
module.exports = (html, context, body) => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				${body}
			</body>
		</html>
	`;
};
```

```js
// FILE: view/example.js

const layout = require('./layout');

module.exports = (html, context) => {
	return layout(html, context, html`
		<h1>${context.title}</h1>
		<p>Content goes here</p>
	`);
};
```

```js
// FILE: app.js

const renderer = require('@rowanmanning/renderer');
const render = renderer();

const output = render('example', {
	title: 'Example Page'
});

console.log(output);
```


## Contributing

To contribute to this library, clone this repo locally and commit your code on a separate branch. Please write unit tests for your code, and run the linter before opening a pull-request:

```sh
make test    # run all tests
make verify  # run all linters
```


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
