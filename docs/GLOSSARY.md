# Glossary

The vocabulary specific to this template. Standard web-component terms
(`connectedCallback`, `observedAttributes`, Shadow DOM, ESM/CJS) are not
defined here -- see
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).

## Template

Words used while turning this repo into a new component repo.

**Scaffold** -- The one-shot `node ./bin/cli.js` run that prompts for the
four template variables, substitutes them across the tracked source, and
then deletes `bin/` along with its own dev dependencies from
`package.json`. It cannot be run twice.

**Template Variable** -- A Handlebars placeholder such as
`{{component-name}}` that Scaffold replaces. Substitution covers
`example/`, `src/`, `test/index.ts`, `package.json`, and
`README.example.md`.

**`package-name`** -- The npm package name, including any namespace.
Example: `@alice/cool-component`.

**`component-name`** -- The custom element name as written in HTML, and
the key registered in `HTMLElementTagNameMap`. Example: `cool-component`.

**`gh-namespace`** -- The GitHub user or org, the first path segment of
the repository URL. Example: `alice`.

**`repo-name`** -- The GitHub repository name, the last path segment of
the repository URL. Example: `cool-component`.

**Example README** -- `README.example.md`, the README for the *generated*
component. Scaffold renders it over `README.md` and removes the original,
so the template's own README does not survive scaffolding.

## Component

Words used while writing the component itself.

**`SubstrateSelect`** -- The class exported from `src/index.ts`, the
`<substrate-select>` element. It wraps a native `<select>`; see
[ADR-010](adr/ADR-010-native-select.md).

**Change Handler** -- A method named `handleChange_<attribute>`, called by
`attributeChangedCallback` with `(oldValue, newValue)` when that
attribute changes. The base class derives `observedAttributes` from
`reflectedStringAttributes` and `reflectedBooleanAttributes`; to observe
another attribute, extend it with `[...super.observedAttributes, ...]`.
The dispatch is by convention, not registration: a missing handler is
silently skipped, and nothing re-renders automatically.

**Authored Options** -- The `<option>` and `<optgroup>` children written
inside `<substrate-select>`, which the component moves into its inner
select.

**base-select** -- The CSS value `appearance: base-select`, which makes
a native select and its picker fully styleable. Used only inside
`@supports`.

**Picker** -- The dropdown list a select opens, styled with
`::picker(select)`. `::picker-icon` is its chevron and `::checkmark`
marks the chosen option.

**Token** -- A `--substrate-select-*` custom property consumers can
override. Most fall back to a shared `--substrate-*` variable, then to
a default; the rest have only a default.
