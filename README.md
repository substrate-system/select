# substrate-select
![tests](https://github.com/substrate-system/select/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@substrate-system/select?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/select?cache-control=no-cache)](https://packagephobia.com/result?p=@substrate-system/select)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/select)](https://bundlephobia.com/package/@substrate-system/select)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


A native `<select>` with better CSS. Write ordinary
`<option>` and `<optgroup>` children. The component builds a `<select>`
around them. Forms, keyboard use, and accessibility work via the browser.

[See a live demo](https://substrate-system.github.io/select/)

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Install](#install)
- [Example](#example)
  * [htm and Preact](#htm-and-preact)
- [API](#api)
  * [ESM](#esm)
  * [Common JS](#common-js)
  * [Attributes](#attributes)
  * [Options](#options)
  * [Properties](#properties)
  * [Events](#events)
  * [Forms](#forms)
- [CSS](#css)
  * [Import CSS](#import-css)
  * [CSS Variables](#css-variables)
  * [Browser support](#browser-support)
  * [Avoid a flash of undefined content](#avoid-a-flash-of-undefined-content)
- [Use](#use)
  * [JS](#js)
  * [HTML](#html)
  * [pre-built](#pre-built)

<!-- tocstop -->

</details>

## Install

```sh
npm i -S @substrate-system/select
```

## Example

```html
<form>
    <substrate-select label="Fruit" name="fruit" required>
        <option value="">Choose a fruit</option>
        <optgroup label="Citrus">
            <option value="lemon">Lemon</option>
            <option value="orange" selected>Orange</option>
        </optgroup>
        <option value="apple">Apple</option>
    </substrate-select>
</form>

<script type="module">
    import { SubstrateSelect } from '@substrate-system/select'

    const el = document.querySelector('substrate-select')
    // custom .on method
    el.on('change', ev => console.log(ev.detail.value))
</script>
```

### htm and Preact

Preact sets `value` as a property, because the element defines one.

```js
import { html } from 'htm/preact'
import { SubstrateSelect } from '@substrate-system/select'

function FruitPicker ({ fruit, onChange }) {
    return html`<${SubstrateSelect.TAG}
        label="Fruit"
        name="fruit"
        value=${fruit}
        onsubstrate-select:change=${ev => onChange(ev.detail.value)}
    >
        <option value="lemon">Lemon</option>
        <option value="apple">Apple</option>
    <//>`
}
```

## API

This exposes ESM and common JS via
[package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import { SubstrateSelect } from '@substrate-system/select'
```

Importing the module registers the `<substrate-select>` element.

### Common JS
```js
require('@substrate-system/select')
```

### Attributes

| Attribute | Behavior |
|-----------|----------|
| `label` | Renders a `<label>` for the select. Changing it updates the label in place; removing it removes the label. |
| `name`, `disabled`, `required`, `autocomplete`, `form` | Copied to the inner select and kept on the host. |
| `id` | Moved to the inner select and removed from the host. A generated id is used when absent. |
| `aria-*` | Moved to the inner select and removed from the host. |

`multiple` and `size` are not supported (listbox mode is only
styleable in Chromium). Setting or removing `id` or an `aria-*`
attribute on the host after upgrade updates the inner select, so a
framework can toggle `aria-invalid` or `aria-describedby` for error
messages. Removing `id` falls back to the generated id.

At first render every `aria-*` attribute moves. After that, a newly set
`aria-*` attribute moves only if it is listed in the exported
`ARIA_ATTRIBUTES` array. Removing any `aria-*` attribute from the host
removes it from the select.

### Options

Authored `<option>` and `<optgroup>` children are moved into the select
on first connect, and options appended to the host later are moved to
the end of the select. Other children present at first connect are
dropped; non-option children appended later are left in place.

A framework that later inserts a node relative to a moved option may
fail, because that option is no longer a child of the host. Manage
dynamic option lists through `el.select`.

### Properties

- `value` -- read or write the selected value. A value set before the
  element renders is held until an option with that value exists,
  whether it is appended to the host or added through `el.select`, then
  selected, unless a later `value` set or a user pick replaces it.
  Before render, `value` returns the waiting value. Once rendered, the
  select starts with no selection while the value waits (`value` is
  `""`), even if an option was authored `selected`; options added
  after that follow the browser's usual selection rules.
  Options appended to the host in the same tick are moved in before a
  new value is applied. After render, setting a value with no matching
  option leaves `""`.
- `select` -- the inner `HTMLSelectElement`, or `null` before the first
  render.
- `label`, `name`, `disabled`, `required` -- reflect the attributes of
  the same name.

### Events

Native `change` and `input` events bubble from the inner select
unchanged. On `change` the element also emits `substrate-select:change`
with `detail: { value:string }` (`SubstrateSelectChangeDetail`).

```js
el.addEventListener(SubstrateSelect.event('change'), ev => {
    console.log(ev.detail.value)
})
// or
el.on('change', ev => console.log(ev.detail.value))
```

Setting `el.value` from code fires neither event, like a native select.

### Forms

The select is a light-DOM descendant of the enclosing `<form>`, so
submission and `FormData` include it with no extra work.


## CSS

### Import CSS

```js
import '@substrate-system/select/css'
```

Or minified:
```js
import '@substrate-system/select/min/css'
```

### CSS Variables

The first eight tokens fall back to a shared `--substrate-*` variable,
then to a default. The last three have only a default.

| Token | Falls back to | Default |
|-------|---------------|---------|
| `--substrate-select-text` | `--substrate-text` | `black` |
| `--substrate-select-surface` | `--substrate-surface` | `white` |
| `--substrate-select-border` | `--substrate-border` | `#9b9b9b` |
| `--substrate-select-accent` | `--substrate-accent` | `#2563eb` |
| `--substrate-select-focus` | `--substrate-focus` | `#2563eb` |
| `--substrate-select-focus-width` | `--substrate-focus-width` | `2px` |
| `--substrate-select-focus-offset` | `--substrate-focus-offset` | `2px` |
| `--substrate-select-radius` | `--substrate-radius` | `0` |
| `--substrate-select-option-hover` | none | `#f3f4f6` |
| `--substrate-select-checked` | none | `#1d4ed8` |
| `--substrate-select-shadow` | none | `0 4px 12px #21212114` |

`--substrate-select-checked` colors the chosen option's text in the
picker. It does not follow the accent, so set it too when you change
the accent (`--substrate-select-accent` or `--substrate-accent`).

```css
substrate-select {
    --substrate-select-accent: rebeccapurple;
    --substrate-select-checked: rebeccapurple;
}
```

### Browser support

The baseline (outlined trigger, chevron, focus and hover states) works
in every browser. Where `appearance: base-select` is supported, the
picker is styled too: a rotating chevron, a checkmark on the chosen
option, and an open transition, which respects reduced motion. Today
that is Chromium (Chrome and Edge 135+). Safari 27 support is announced
but unconfirmed in stable, and Firefox has it only behind flags.
Elsewhere the browser's native picker opens.

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
<substrate-select label="Size" name="size">
    <option value="s">Small</option>
    <option value="l">Large</option>
</substrate-select>
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
