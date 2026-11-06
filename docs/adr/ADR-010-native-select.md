# ADR-010: Wrap a native select and enhance it with base-select

**Date:** 2026-11-06

## Context

A select needs a consistent, themeable look. A native select's picker
was historically unstyleable, so many components build a custom listbox
instead. That means an ARIA combobox implementation, keyboard handling,
typeahead, and form participation through `ElementInternals`, all
re-creating what the browser already does, and each a place to get
accessibility wrong.

CSS `appearance: base-select` now makes the native select and its
picker styleable in Chromium (Chrome and Edge 135+). Safari 27 support
is announced but unconfirmed in stable, and Firefox has it only behind
flags.

## Decision

Wrap a real `<select>` in light DOM
([ADR-003](ADR-003-light-dom.md)). On first connect the component
builds the select, moves the authored `<option>` and `<optgroup>`
children into it, moves `id` and `aria-*` from the host to the select,
and forwards `name`, `disabled`, `required`, `autocomplete`, and
`form`. Options appended to the host later are moved in by a
`MutationObserver`, and setting `value` moves any still waiting first.
The observer also watches the inner select, so a value set before
render applies to options added through `el.select` too.

Style a baseline every browser gets (an outlined trigger and a chevron
drawn with gradients), and put picker styling behind
`@supports (appearance: base-select)`.

Not built:

- No custom listbox, no ARIA combobox, and no `ElementInternals`. The
  select is a light-DOM descendant of the form, so it participates in
  submission and `FormData` directly.
- No `<button><selectedcontent>` markup. The default base-select button
  shows the chosen option, and `selectedcontent` refresh after dynamic
  option changes is a known weak point.
- No `multiple` or `size`. Listbox mode is only styleable in Chromium.

## Consequences

Accessibility, keyboard, and form behavior come from the browser, so
the component has little of its own to get wrong.

The styled picker is Chromium-only for now. Other browsers get the
baseline trigger with the native picker.

Options authored inside the host are moved, so a framework that
inserts a node relative to a moved option can fail. Dynamic option
lists go through `el.select`.

Attribute changes update the existing label and select in place
instead of re-rendering, unlike substrate-input, so the user's
selection survives them.
