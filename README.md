
# @rowanmanning/renderer

Render [htm](https://github.com/developit/htm) views with [Hyperons](https://github.com/i-like-robots/hyperons).

**:warning: This is pre-release software, use in production at your own risk**


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
    * [Creating a renderer](#creating-a-renderer)
    * [Rendering a view](#rendering-a-view)
    * [Creating a view](#creating-a-view)
    * [Namespaces](#namespaces)
    * [Cascade](#cascade)
    * [Layouts](#layouts)
    * [Partials](#partials)
    * [Using with Koa](#doctypes)
    * [Doctypes](#doctypes)
    * [Examples](#examples)
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
const Renderer = require('@rowanmanning/renderer');
```

### Creating a renderer

```js
const renderer = new Renderer(options);
```

The available options are:

  - `env`: The environment that node is running in. Defaults to the `NODE_ENV` environment variable
  - `path`: Where the JavaScript views live. Defaults to `<CWD>/view`
  - `namespacePaths`: Where the JavaScript views live for different namespaces. [See namespaces for more information](#namespaces)

### Rendering a view

To render the view in `<CWD>/view/example`, use:

```js
const output = await renderer.render('example', context);
```

`context` is an object which contains properties that are made available to the view. `output` will be the rendered HTML as a string.

### Creating a view

View files are JavaScript, and they export functions that do the rendering. This exported function receives one argument which is the render context that was passed into `render`.

The function must return a template literal tagged with the `html` function provided by this module. This is an [htm](https://github.com/developit/htm) template tag bound to [Hyperons](https://github.com/i-like-robots/hyperons).

```js
const {html} = require('@rowanmanning/renderer');

module.exports = context => {
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

The function _may_ be an `async` function, if you need to do anything in your view that is asynchronous:

```js
const {html} = require('@rowanmanning/renderer');

module.exports = async context => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<h1>${context.title}</h1>
				<p>${await doSomethingAsync()}</p>
			</body>
		</html>
	`;
};
```

See the [Hyperons documentation](https://github.com/i-like-robots/hyperons) for more information about what's possible.

### Namespaces

Namespaces allow you to store view files in multiple places. For example, if you were building a blogging application, you might store views for the administration of blog posts separately from the front-end views. This might also allow for themeable sites which [fall back](#cascade) to default views if the chosen theme does not implement them.

You define namespaces when you create a renderer:

```js
const renderer = new Renderer({
	// A path is still required for the default view location
	path: `${__dirname}/view`,

	// The key for each of these is the namespace name, and the
	// value is the path where views in this namespace can be found
	namespacePaths: {
		admin: `${__dirname}/app/admin/view`
	}
});
```

When rendering views, you can use namespaces by prefixing the viewname with them with a colon (`:`) as a separator. Based on the config above:

```js
// Render ./view/example.js
const output = await renderer.render('example', context);
```

```js
// Render ./app/admin/view/example.js
const output = await renderer.render('admin:example', context);
```

See the [namespaces example](example/namespaces) for a working demo.

### Cascade

When rendering, you can specify multiple views in a cascade. When you specify multiple views, the renderer will step through them and return the rendered content for the first view that is found.

In the following example, assume that `front-page.js` is the only file that actually exists. It will be rendered as expected:

```js
// Render `./view/front-page.js`
const output = await renderer.render(['home', 'front-page', 'index'], context);
```

This is particularly useful when combined with [namespaces](#namespaces) as it allows you to fall back to a default theme, for example:

```js
const renderer = new Renderer({
	path: `${__dirname}/my-cool-theme/view`,
	namespacePaths: {
		default: `${__dirname}/default-theme/view`
	}
});

// Render the first view that's found
const output = await renderer.render(['home', 'default:home']);
```

See the [namespaces example](example/namespaces) for a working demo.


### Layouts

Reusing layouts is achievable using standard Node.js `require` and composing functions together. It's useful to do this to reduce repetition across your views, keeping boilerplate HTML in one place. There are many ways you could do this, here's an example:

```js
// FILE: view/layout/default.js

const {html} = require('@rowanmanning/renderer');

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
```

```js
// FILE: view/example.js

const {html} = require('@rowanmanning/renderer');
const layout = require('./layout/default');

module.exports = context => {
	return layout(context, html`
		<h1>${context.title}</h1>
		<p>This is an example page.</p>
	`);
};
```

See the [layouts example](example/layouts) for a working demo.

### Partials

Partials are snippets of HTML that can be reused by multiple different views. This is achievable using standard Node.js `require` and referencing the shared functions in your views. It's useful to do this to reduce repetition. There are several ways to do this.

See the [partials example](example/partials) for working demos of all of these methods.

#### Using the built-in `Partial` class

Extending the built-in `Partial` class allows you to keep logic for complex views neatly contained within a single class. You must implement a `render` method on any extending class, and the partial is used in the view as a custom element.

```js
// FILE: view/partial/copyright.js

const {html, Partial} = require('@rowanmanning/renderer');

module.exports = class Copyright extends Partial {

	render() {
		return html`
			<small>
				Copyright © ${this.currentYear()}, ${this.context.holder}
			</small>
		`;
	}

	currentYear() {
		return new Date().getFullYear();
	}

};
```

```js
// FILE: view/example.js

const {html} = require('@rowanmanning/renderer');
const Copyright = require('./partial/copyright');

module.exports = context => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<h1>${context.title}</h1>
				<p>This is an example page.</p>
				<p><${Copyright} holder="Rowan Manning"/></p>
			</body>
		</html>
	`;
};
```

See the [htm documentation](https://github.com/developit/htm) for more information on using classes as elements.

#### Using synchronous functions

Synchronous functions can be used as partials for simpler cases, where a full class might be overkill.

```js
// FILE: view/partial/navigation.js

const {html} = require('@rowanmanning/renderer');

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
```

```js
// FILE: view/example.js

const {html} = require('@rowanmanning/renderer');
const navigation = require('./partial/navigation');

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
```

See the [htm documentation](https://github.com/developit/htm) for more information on using functions as elements.

#### Using asynchronous functions

Asynchronous functions can be used as partials, but they cannot be used as elements in the same way as a `Partial` class or a synchronous function.

```js
// FILE: view/partial/paragraph-from-file.js

const {html} = require('@rowanmanning/renderer');

const {promisify} = require('util');
const readFile = promisify(require('fs').readFile);

module.exports = async filePath => {
	const content = await readFile(filePath, 'utf-8');
	return html`
		<p>${content}</p>
	`;
};
```

```js
// FILE: view/example.js

const {html} = require('@rowanmanning/renderer');
const paragraphFromFile = require('./partial/paragraph-from-file');

module.exports = context => {
	return html`
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<title>${context.title}</title>
			</head>
			<body>
				<h1>${context.title}</h1>
				${await paragraphFromFile('./content.txt')}
			</body>
		</html>
	`;
};
```

### Use with Koa

The `renderer.koa` method returns Koa middleware which can be used to render views:

```js
const Koa = require('koa');
const Renderer = require('@rowanmanning/renderer');

const app = new Koa();
const renderer = new Renderer();

app.use(renderer.koa());
app.use(async context => {
	await context.render('example', {
		title: 'Example Page'
	});
});
```

The Koa middleware also merges the given render context with `context.state`:

```js
app.use(async context => {
	context.state.title = 'Example Page';
	await context.render('example');
});
```

See the [Koa example](example/koa) for a working demo.

### Doctypes

By default an HTML5 doctype is added to the rendered output. You can change the doctype by adding a `docytpe` property to the render `context`:

```js
const output = await renderer.render('example', {
	doctype: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD … ">'
});
```

To remove the doctype entirely, set to a falsy value:

```js
const output = await renderer.render('example', {
	doctype: null
});
```

### Examples

We provide a few example implementations which demonstrate different features:

  - **[Basic](example/basic)**: the simplest use of the library to render a view. Run `node example/basic` to ouput rendered views to the command line.

  - **[Koa](example/koa)**: render views for a Koa application using middleware. Run `node example/koa` to start the application and visit [localhost:8080](http://localhost:8080/).

  - **[Layouts](example/layouts)**: render views with reusable layout code to reduce repetition. Run `node example/layouts` to ouput rendered views to the command line.

  - **[Namespaces](example/namespaces)**: using namespaces and cascades to organise views into different folders. Run `node example/namespaces` to ouput rendered views to the command line.

  - **[Partials](example/partials)**: render views using partials to reduce repetition. Run `node example/partials` to ouput rendered views to the command line.


## Contributing

To contribute to this library, clone this repo locally and commit your code on a separate branch. Please write unit tests for your code, and run the linter before opening a pull-request:

```sh
make test    # run all tests
make verify  # run all linters
```


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
