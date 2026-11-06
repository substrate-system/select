# package name here
![tests](https://github.com/substrate-system/select/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@substrate-system/select?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/select?cache-control=no-cache)](https://packagephobia.com/result?p=@substrate-system/select)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/select)](https://bundlephobia.com/package/@substrate-system/select)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


`<package description goes here>`

[See a live demo](https://substrate-system.github.io/select/)

<details><summary><h2>Contents</h2></summary>
<!-- toc -->
</details>

## Install

Installation instructions

```sh
npm i -S @substrate-system/select
```

## Example

```ts
```

## API

This exposes ESM and common JS via
[package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import '@substrate-system/select'
```

### Common JS
```js
require('@substrate-system/select')
```

### Attributes

`<all attributes here>`

### Events

`<all events here>`


## CSS

### Import CSS

```js
import '@substrate-system/select/css'
```

Or minified:
```js
import '@substrate-system/select/min/css'
```

### Customize CSS via some variables

```css
substrate-select {
    --example: pink;
}
```

### Avoid a flash of undefined content

The stylesheet hides `substrate-select` until the browser has defined
it, so you do not see unstyled markup while the JS loads.

That only covers this one element. If your page uses several custom
elements, hide the whole page until they are all ready, and reveal it
once:

```html
<html class="reduce-fouce">
```

```css
html.reduce-fouce { opacity: 0; }
```

```js
await Promise.race([
    Promise.allSettled([
        customElements.whenDefined('substrate-select')
    ]),
    // reveal anyway after two seconds
    new Promise(resolve => { setTimeout(resolve, 2000) })
])

document.documentElement.classList.remove('reduce-fouce')
```

Keep the timeout, and add a `<noscript>` override. Without both, a
component that fails to define leaves the page blank:

```html
<noscript>
    <style>html.reduce-fouce { opacity: 1 !important; }</style>
</noscript>
```

## Use
This calls the global function `customElements.define`. Just import, then use
the tag in your HTML.

### JS
```js
import '@substrate-system/select'
```

### HTML
```html
<div>
    <substrate-select></substrate-select>
</div>
```

### pre-built

This package exposes minified JS and CSS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/select/dist/index.min.js ./public/substrate-select.min.js
cp ./node_modules/@substrate-system/select/dist/index.min.css ./public/substrate-select.css
```

#### HTML
```html
<head>
    <link rel="stylesheet" href="./substrate-select.css">
</head>
<body>
    <!-- ... -->
    <script type="module" src="./substrate-select.min.js"></script>
</body>
```
