# substrate-select

Last verified: 2026-11-06

`<substrate-select>` (`SubstrateSelect`), a light-DOM web component that
wraps a native `<select>` and styles it with `appearance: base-select`
where supported. One element, one source file.

## Where things are documented

- `README.md` -- public API: attributes, properties, events, CSS tokens.
  It is the contract for consumers; update it with any API change.
- `docs/adr/` -- why the component is built this way. ADR-010 is the
  select-specific decision; ADR-001 to ADR-008 are inherited template
  conventions (base class, idempotent registration, light DOM,
  attributes as state, namespaced events, FOUCE, dual format, browser
  tests).
- `docs/GLOSSARY.md` -- project vocabulary.
- `docs/implementation-plans/` and `docs/design-plans/` are gitignored
  working notes, not part of the repo history.

## Commands

- `npm test` -- `esbuild ./test/index.ts --bundle | tapout`. Runs in a
  real browser (ADR-008) and imports from `src`, so no build is needed.
- `npm run lint` -- ESLint. CSS lint is `npx stylelint src/*.css`.
- `npm run build` -- ESM, CJS, minified, declarations, and CSS into
  `dist/`.
- `npm start` -- Vite dev server for `example/`.

## Project structure

- `src/index.ts` -- the component; calls `SubstrateSelect.define()` on
  import.
- `src/index.css` -- baseline styles plus the
  `@supports (appearance: base-select)` picker styles.
- `test/index.ts` -- the whole test suite (tapzero).
- `example/` -- demo page.

## Contracts (summary; README is authoritative)

- On first connect, authored `<option>`/`<optgroup>` children move into
  an inner `<select>`; `id` and every `aria-*` move from the host to the
  select. `name`, `disabled`, `required`, `autocomplete`, `form` are
  copied and stay on the host too.
- Options appended to the host later are moved in by a
  `MutationObserver`; setting `value` moves pending ones first.
- `value` set before first render is held until a matching option
  exists, added to the host or through `el.select` (the observer
  watches both). `el.select` is the inner select, or `null` before
  render.
- Emits `substrate-select:change` with `detail.value`; native `change`
  and `input` bubble from the inner select unchanged.
- `render` is idempotent. A reconnect or attribute change never rebuilds
  the select, so the user's selection survives.
- No custom listbox, no `ElementInternals`, no `multiple`/`size`
  (ADR-010). The select is a real form descendant.

## Gotchas

- **Tests can be silently dropped.** tapout ends the run after about 1s
  without console output (0.2 x its default 5000ms `--timeout`) and
  exits 0, discarding every test that has not run. `waitFor` from
  `@substrate-system/dom` defaults to a 5s timeout, so a lookup that
  never resolves truncates the run instead of failing. Pass
  `WAIT` (`{ timeout: 500 }`, defined in `test/index.ts`) to every
  `waitFor`, and after a run check the `# tests N` count in the output,
  not just the exit code.
- `tsconfig.json` sets `listFiles: true`, so `tsc` and `npm run build`
  print every lib file. Redirect output to a file and grep for errors.
- Define the class with `WebComponent.create('substrate-select')`, not
  `static TAG`. The base class reads the instance `TAG` for `emit` and
  the static one for `event()`, so only `create` makes them agree.
- Internal code strips host attributes with `super.removeAttribute`.
  The `removeAttribute` override is the consumer path: it also removes
  `id`/`aria-*` from the inner select (falling back to a generated id).
- `connectedCallback` deliberately does not call
  `super.connectedCallback()`, which would render on every connect.
