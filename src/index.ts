import { WebComponent } from '@substrate-system/web-component'
import Debug from '@substrate-system/debug'
const debug = Debug('substrate-select')

// for document.querySelector
declare global {
    interface HTMLElementTagNameMap {
        'substrate-select':SubstrateSelect
    }
}

/**
 * ARIA attributes the component observes, so a change after upgrade is
 * moved to the inner select too. `attributeChangedCallback` only sees
 * attributes named in `observedAttributes`. Copied from
 * `@substrate-system/input` (`src/util.ts`). At first render every
 * `aria-*` attribute moves, listed here or not.
 */
export const ARIA_ATTRIBUTES = [
    'aria-activedescendant',
    'aria-atomic',
    'aria-autocomplete',
    'aria-braillelabel',
    'aria-brailleroledescription',
    'aria-busy',
    'aria-checked',
    'aria-colcount',
    'aria-colindex',
    'aria-colindextext',
    'aria-colspan',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-expanded',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-level',
    'aria-live',
    'aria-modal',
    'aria-multiline',
    'aria-multiselectable',
    'aria-orientation',
    'aria-owns',
    'aria-placeholder',
    'aria-posinset',
    'aria-pressed',
    'aria-readonly',
    'aria-relevant',
    'aria-required',
    'aria-roledescription',
    'aria-rowcount',
    'aria-rowindex',
    'aria-rowindextext',
    'aria-rowspan',
    'aria-selected',
    'aria-setsize',
    'aria-sort',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext'
]

/**
 * Attributes copied to the inner select and also left on the host.
 */
const FORWARDED_ATTRIBUTES = [
    'name',
    'disabled',
    'required',
    'autocomplete',
    'form'
]

/**
 * Properties a framework may set before this module defines the
 * element. See `#upgradeProperty`.
 */
const UPGRADED_PROPERTIES = [
    'value',
    'label',
    'name',
    'disabled',
    'required'
]

export interface ChangeDetail {
    value:string;
}

/**
 * Use the `create` factory rather than `class X extends WebComponent`
 * with `static TAG`. The base class declares `TAG` as an *instance*
 * field defaulting to `''`, and `emit`/`on` namespace from that instance
 * field while `static event()` reads the static one. Setting only
 * `static TAG` therefore emits `':change'` while listeners built from
 * `SubstrateSelect.event('change')` expect `'substrate-select:change'`,
 * and nothing fires. `create` sets both.
 */
export class SubstrateSelect extends WebComponent.create('substrate-select') {
    /**
     * The base class generates the accessors for these and derives
     * `observedAttributes` from them.
     *
     * @see docs/adr/ADR-004-attributes-as-state.md
     */
    static reflectedStringAttributes = ['label', 'name']
    static reflectedBooleanAttributes = ['disabled', 'required']

    static get observedAttributes ():string[] {
        return [
            ...super.observedAttributes,
            'id',
            'autocomplete',
            'form',
            ...ARIA_ATTRIBUTES
        ]
    }

    /**
     * Installed at runtime by `define()`. `declare` types them without
     * emitting a field that would shadow the generated accessor.
     */
    declare label:string|null
    declare name:string|null
    declare disabled:boolean
    declare required:boolean

    /**
     * The inner select's value. Before the first render this holds the
     * value and `render` applies it once the options are in.
     */
    get value ():string {
        if (this.#select) return this.#select.value
        return this.#pendingValue ?? ''
    }

    set value (value:string) {
        const normalized = String(value ?? '')
        if (this.#select) {
            // Options appended this tick are still in the host, waiting
            // for the observer. Move them now so the value can match.
            this.#adopt(Array.from(this.childNodes))
            // A later set replaces any value still waiting for its option
            this.#pendingValue = null
            this.#select.value = normalized
            return
        }
        this.#pendingValue = normalized
    }

    /**
     * The inner select, or `null` before the first render. An escape
     * hatch, for example to remove options.
     */
    get select ():HTMLSelectElement|null {
        return this.#select
    }

    #select:HTMLSelectElement|null = null
    #label:HTMLLabelElement|null = null
    #pendingValue:string|null = null
    #observer:MutationObserver|null = null
    #generatedId = 'substrate-select-' +
        Math.random().toString(36).slice(2, 10)

    connectedCallback () {
        debug('connected')
        for (const prop of UPGRADED_PROPERTIES) {
            this.#upgradeProperty(prop)
        }

        // Not `super.connectedCallback()`: that renders on every
        // connect. `render` is idempotent, so a reconnect keeps the
        // existing select, its options, and the user's selection.
        this.render()

        // Options appended while disconnected
        this.#adopt(Array.from(this.childNodes))

        this.#observer ??= new MutationObserver(records => {
            this.#handleRecords(records)
        })
        this.#observer.observe(this, { childList: true })
        // Options added through `el.select` may be what a waiting value
        // is waiting for. `subtree` covers options inside an optgroup.
        if (this.#select) {
            this.#observer.observe(this.#select, {
                childList: true,
                subtree: true
            })
        }
    }

    disconnectedCallback () {
        debug('disconnected')
        if (!this.#observer) return
        // Deliver additions the observer has queued but not reported
        this.#handleRecords(this.#observer.takeRecords())
        this.#observer.disconnect()
    }

    attributeChangedCallback (
        name:string,
        oldValue:string|null,
        newValue:string|null
    ) {
        if (name === 'id' || name.startsWith('aria-')) {
            this.#moveToSelect(name, newValue)
            return
        }

        // The base class types these as `string`; the DOM passes `null`
        // for an absent attribute, and the handlers here accept it.
        super.attributeChangedCallback(
            name,
            oldValue as string,
            newValue as string
        )
    }

    handleChange_label (_oldValue:string|null, newValue:string|null) {
        const select = this.#select
        if (!select) return  // render reads the attribute

        if (!newValue) {
            this.#label?.remove()
            this.#label = null
            return
        }

        if (!this.#label) {
            this.#label = this.#createLabel(select.id)
            this.insertBefore(this.#label, select)
        }

        this.#label.textContent = newValue
    }

    handleChange_name (_oldValue:string|null, newValue:string|null) {
        this.#forward('name', newValue)
    }

    handleChange_disabled (_oldValue:string|null, newValue:string|null) {
        this.#forward('disabled', newValue)
    }

    handleChange_required (_oldValue:string|null, newValue:string|null) {
        this.#forward('required', newValue)
    }

    handleChange_autocomplete (
        _oldValue:string|null,
        newValue:string|null
    ) {
        this.#forward('autocomplete', newValue)
    }

    handleChange_form (_oldValue:string|null, newValue:string|null) {
        this.#forward('form', newValue)
    }

    /**
     * Copy a forwarded attribute to the select. Before the first render
     * there is no select, and `render` copies the host's attributes.
     */
    #forward (name:string, value:string|null) {
        const select = this.#select
        if (!select) return

        if (value === null) {
            select.removeAttribute(name)
        } else {
            select.setAttribute(name, value)
        }
    }

    /**
     * Move `id` or an `aria-*` attribute from the host to the select.
     *
     * A `null` value is ignored. The host never keeps these attributes
     * after the first render, so a removal callback is always the one
     * this method or `render` just caused. A consumer's removal goes
     * through the `removeAttribute` override instead, because the host
     * no longer has the attribute and no callback would fire.
     *
     * Before the first render there is no select; `render` reads the
     * host attributes itself.
     */
    #moveToSelect (name:string, value:string|null) {
        const select = this.#select
        if (value === null || !select) return

        if (name === 'id') {
            this.#setSelectId(value || this.#generatedId)
        } else {
            select.setAttribute(name, value)
        }
        super.removeAttribute(name)
    }

    #setSelectId (id:string) {
        if (!this.#select) return
        this.#select.id = id
        if (this.#label) this.#label.htmlFor = id
    }

    /**
     * After the first render, `id` and `aria-*` live on the inner select,
     * so removing one from the host removes it from the select. This is
     * how frameworks clear an attribute (Preact calls `removeAttribute`
     * for `undefined`). A removed `id` falls back to the generated one,
     * so the label stays connected.
     *
     * Internal code calls `super.removeAttribute` to strip the host
     * without touching the select. `toggleAttribute(name, false)` and
     * `removeAttributeNode` on the host are not covered.
     */
    removeAttribute (qualifiedName:string) {
        const name = qualifiedName.toLowerCase()
        const select = this.#select
        if (select && name === 'id') {
            this.#setSelectId(this.#generatedId)
        } else if (select && name.startsWith('aria-')) {
            select.removeAttribute(name)
        }
        super.removeAttribute(qualifiedName)
    }

    /**
     * Apply a value that was set before the first render. It stays
     * pending until an option with that value exists, so a value set
     * before the options arrive (an empty first render, then appended
     * options) still lands. A later `value` set or a user change clears
     * it.
     */
    #applyPendingValue () {
        const select = this.#select
        const pending = this.#pendingValue
        if (!select || pending === null) return
        // Write only on a match. A write with no match would clear
        // whatever is selected now, including a pick made through
        // `el.select`, with no event.
        const options = Array.from(select.options)
        if (!options.some(option => option.value === pending)) return
        select.value = pending
        this.#pendingValue = null
    }

    /**
     * A property set before the element was defined is an own data
     * property that hides the class accessor. Remove it and set it
     * again so the accessor sees it.
     */
    #upgradeProperty (prop:string) {
        if (!Object.prototype.hasOwnProperty.call(this, prop)) return
        const value = Reflect.get(this, prop)
        Reflect.deleteProperty(this, prop)
        Reflect.set(this, prop, value)
    }

    /**
     * Move options added to the host into the select, and retry a
     * waiting value when nodes were added inside the select.
     */
    #handleRecords (records:MutationRecord[]) {
        const fromHost = records.filter(record => record.target === this)
        this.#adopt(
            fromHost.flatMap(record => Array.from(record.addedNodes))
        )
        const intoSelect = records.some(record => {
            return record.target !== this && record.addedNodes.length > 0
        })
        if (intoSelect) this.#applyPendingValue()
    }

    /**
     * Move `<option>` and `<optgroup>` children of the host to the end of
     * the select. The component's own label and select, and anything
     * that is not an option, stay where they are.
     */
    #adopt (nodes:Node[]) {
        const select = this.#select
        if (!select) return
        let moved = false
        for (const node of nodes) {
            // already moved, or removed again before delivery
            if (node.parentNode !== this) continue
            if (!isOptionNode(node)) continue
            select.append(node)
            moved = true
        }
        // a value set before connect may be waiting for these options
        if (moved) this.#applyPendingValue()
    }

    #createLabel (selectId:string):HTMLLabelElement {
        const label = document.createElement('label')
        label.htmlFor = selectId
        return label
    }

    render () {
        if (this.#select) return

        const authored:(HTMLOptionElement|HTMLOptGroupElement)[] = []
        const stray:Node[] = []
        for (const node of Array.from(this.childNodes)) {
            if (isOptionNode(node)) {
                authored.push(node)
            } else if (
                node.nodeType !== Node.TEXT_NODE ||
                node.textContent?.trim()
            ) {
                stray.push(node)
            }
        }
        if (stray.length) debug('dropping non-option children', stray)

        // The option the parser marked selected. Reapplied after the
        // move instead of relying on insertion to keep it.
        const chosen = authored
            .flatMap(node => {
                return node instanceof HTMLOptionElement ?
                    [node] :
                    Array.from(node.querySelectorAll('option'))
            })
            .filter(option => option.selected)
            .pop()

        // DOM APIs only, so attribute values are never parsed as HTML
        const select = document.createElement('select')
        select.id = this.getAttribute('id') ?? this.#generatedId
        for (const attr of Array.from(this.attributes)) {
            if (attr.name.startsWith('aria-')) {
                select.setAttribute(attr.name, attr.value)
            }
        }
        for (const name of FORWARDED_ATTRIBUTES) {
            const value = this.getAttribute(name)
            if (value !== null) select.setAttribute(name, value)
        }

        // Native `change` and `input` bubble out of the host as they
        // are. Also emit the namespaced event (ADR-005).
        select.addEventListener('change', () => {
            // the user's pick replaces a value still waiting for its
            // option
            this.#pendingValue = null
            this.emit<ChangeDetail>('change', {
                detail: { value: select.value }
            })
        })

        select.append(...authored)
        if (chosen) chosen.selected = true
        this.#select = select
        this.#applyPendingValue()
        // A value set from code wins over an authored `selected`, as on
        // a native select, so while it waits nothing is selected
        if (this.#pendingValue !== null) select.selectedIndex = -1

        const labelText = this.getAttribute('label')
        if (labelText) {
            this.#label = this.#createLabel(select.id)
            this.#label.textContent = labelText
            this.replaceChildren(this.#label, select)
        } else {
            this.replaceChildren(select)
        }

        // `super`, not `this`: strip the host only; the select keeps
        // the values. The removal callbacks this causes carry `null`,
        // which `#moveToSelect` ignores.
        super.removeAttribute('id')
        for (const attr of Array.from(this.attributes)) {
            if (attr.name.startsWith('aria-')) {
                super.removeAttribute(attr.name)
            }
        }
    }
}

SubstrateSelect.define()

function isOptionNode (node:Node):node is HTMLOptionElement|HTMLOptGroupElement {
    return (
        node instanceof HTMLOptionElement ||
        node instanceof HTMLOptGroupElement
    )
}
