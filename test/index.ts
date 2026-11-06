import { test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'
import { SubstrateSelect } from '../src/index.js'
import type { SubstrateSelectChangeDetail } from '../src/index.js'

/**
 * Far shorter than `waitFor`'s 5s default. With its default timeout,
 * tapout ends the run after 1s with no output and exits 0, dropping the
 * remaining tests. A lookup that never resolves must throw before that
 * to show up as a failure.
 */
const WAIT = { timeout: 500 }

/**
 * Insert markup in its own container and wait for the component to
 * render its select. Call `cleanup` at the end of the test.
 */
async function mount (html:string):Promise<{
    el:SubstrateSelect;
    select:HTMLSelectElement;
    cleanup:() => void;
}> {
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const select = await waitFor(null, WAIT, () => {
        return container.querySelector('substrate-select > select')
    }) as HTMLSelectElement
    const el = container.querySelector('substrate-select')!
    return { el, select, cleanup: () => container.remove() }
}

/**
 * Connect an element built in code and wait for its select.
 */
async function attach (el:HTMLElement):Promise<{
    select:HTMLSelectElement;
    cleanup:() => void;
}> {
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.appendChild(el)
    const select = await waitFor(null, WAIT, () => {
        return container.querySelector('substrate-select > select')
    }) as HTMLSelectElement
    return { select, cleanup: () => container.remove() }
}

/**
 * Create options with the given values in the given document.
 */
function options (
    values:string[],
    doc:Document = document
):HTMLOptionElement[] {
    return values.map(value => {
        const option = doc.createElement('option')
        option.value = value
        return option
    })
}

test('AC1.1: authored options are rendered into one select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
        </substrate-select>
    `)

    t.equal(el.querySelectorAll('select').length, 1,
        'host contains one select')
    t.deepEqual(Array.from(select.options).map(o => o.value),
        ['a', 'b', 'c'], 'option values are in authored order')

    cleanup()
})

test('AC1.2: the selected option is reflected in the select', async t => {
    const { select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b" selected>B</option>
            <option value="c">C</option>
        </substrate-select>
    `)

    t.equal(select.value, 'b', 'select value is the selected option')

    cleanup()
})

test('AC1.3: optgroups stay inside the select', async t => {
    const { select, cleanup } = await mount(`
        <substrate-select>
            <optgroup label="g">
                <option value="a">A</option>
                <option value="b">B</option>
            </optgroup>
            <option value="c">C</option>
        </substrate-select>
    `)

    const optgroup = select.querySelector('optgroup')!
    t.equal(optgroup.parentElement, select,
        'optgroup is a child of the select')
    t.equal(optgroup.children.length, 2,
        'both grouped options are still children of the optgroup')

    cleanup()
})

test('AC1.4: non-option content is not rendered into the host', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <p>stray paragraph</p>
            some loose text
            <option value="a">A</option>
        </substrate-select>
    `)

    t.equal(el.querySelector('p'), null, 'authored p is removed')
    t.ok(Array.from(el.children).every(child => {
        return child.tagName === 'LABEL' || child.tagName === 'SELECT'
    }), 'every host child element is a LABEL or SELECT')
    t.ok(Array.from(el.childNodes).every(node => {
        return node.nodeType !== Node.TEXT_NODE
    }), 'no host child node is a text node')
    t.equal(select.options.length, 1, 'the option is in the select')

    cleanup()
})

test('AC1.5: an empty host renders an empty select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select></substrate-select>
    `)

    t.equal(select.options.length, 0, 'select has no options')
    t.equal(select.value, '', 'select value is empty')
    t.equal(el.value, '', 'element value is empty')

    cleanup()
})

test('AC2.1: label renders and points at a generated select id', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select label="Color">
            <option value="a">A</option>
        </substrate-select>
    `)

    const labels = el.querySelectorAll('label')
    t.equal(labels.length, 1, 'there is one label')
    t.ok(select.id, 'select has a non-empty id')
    t.equal(labels[0].htmlFor, select.id, 'label for matches select id')
    t.equal(el.hasAttribute('id'), false, 'host has no id')

    cleanup()
})

test('AC2.2: host id moves to the select and follows changes', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select id="pick" label="Color">
            <option value="a">A</option>
        </substrate-select>
    `)

    const label = el.querySelector('label')!
    t.equal(select.id, 'pick', 'select has the host id')
    t.equal(el.hasAttribute('id'), false, 'host id was removed')
    t.equal(label.htmlFor, 'pick', 'label for matches the id')

    el.setAttribute('id', 'pick2')
    t.equal(select.id, 'pick2', 'select follows an id change')
    t.equal(label.htmlFor, 'pick2', 'label follows an id change')
    t.equal(el.hasAttribute('id'), false, 'host again has no id')

    el.removeAttribute('id')
    t.ok(select.id, 'select keeps a non-empty id after removal')
    t.equal(label.htmlFor, select.id, 'label still matches the select')

    cleanup()
})

test('AC2.3: aria attributes move to the select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select aria-describedby="hint" aria-invalid="true">
            <option value="a">A</option>
        </substrate-select>
    `)

    t.equal(select.getAttribute('aria-describedby'), 'hint',
        'aria-describedby is on the select')
    t.equal(select.getAttribute('aria-invalid'), 'true',
        'aria-invalid is on the select')
    t.equal(el.hasAttribute('aria-describedby'), false,
        'host has no aria-describedby')
    t.equal(el.hasAttribute('aria-invalid'), false,
        'host has no aria-invalid')

    el.setAttribute('aria-invalid', 'false')
    t.equal(select.getAttribute('aria-invalid'), 'false',
        'a later aria change reaches the select')
    t.equal(el.hasAttribute('aria-invalid'), false,
        'host again has no aria-invalid')

    el.removeAttribute('aria-describedby')
    t.equal(select.hasAttribute('aria-describedby'), false,
        'removing from the host removes from the select')

    cleanup()
})

test('AC2.4: form attributes are forwarded to the select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select name="color" required autocomplete="off"
            form="f1"
        >
            <option value="a">A</option>
        </substrate-select>
    `)

    for (const name of ['name', 'required', 'autocomplete', 'form']) {
        t.ok(select.hasAttribute(name), `select has ${name}`)
        t.equal(select.getAttribute(name), el.getAttribute(name),
            `select ${name} matches the host`)
        t.ok(el.hasAttribute(name), `host keeps ${name}`)
    }

    // changes after upgrade are forwarded too
    el.setAttribute('name', 'size')
    el.setAttribute('autocomplete', 'on')
    el.setAttribute('form', 'f2')
    el.required = false
    for (const name of ['name', 'autocomplete', 'form']) {
        t.equal(select.getAttribute(name), el.getAttribute(name),
            `select ${name} follows a later change`)
    }
    t.equal(select.required, false, 'select required follows the host')

    el.required = true
    t.equal(select.required, true, 'select required is set again')

    for (const name of ['name', 'autocomplete', 'form', 'required']) {
        el.removeAttribute(name)
        t.equal(select.hasAttribute(name), false,
            `removing ${name} from the host removes it from the select`)
    }

    cleanup()
})

test('AC2.5: toggling disabled on the host toggles the select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
        </substrate-select>
    `)

    el.disabled = true
    t.equal(select.disabled, true, 'select is disabled')
    el.disabled = false
    t.equal(select.disabled, false, 'select is enabled again')

    cleanup()
})

test('AC2.6: changing label updates in place', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select label="One">
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    const label = el.querySelector('label')
    select.value = 'b'
    el.label = 'Two'

    t.equal(el.querySelector('select'), select, 'same select node')
    t.equal(select.value, 'b', 'selection is unchanged')
    t.equal(el.querySelectorAll('label').length, 1, 'one label')
    t.equal(el.querySelector('label'), label, 'same label node')
    t.equal(label?.htmlFor, select.id, 'label for matches select id')

    el.label = null
    t.equal(el.querySelector('label'), null, 'label is removed')
    t.equal(el.querySelector('select'), select, 'select is kept')

    el.label = 'Three'
    const added = select.previousElementSibling
    t.ok(added instanceof HTMLLabelElement,
        'a label is inserted before the select')

    cleanup()
})

test('AC3.1: el.value returns the selected option value', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b" selected>B</option>
            <option value="c">C</option>
        </substrate-select>
    `)

    t.equal(el.value, 'b', 'value is the authored selected option')
    select.value = 'c'
    t.equal(el.value, 'c', 'value follows the inner select')

    cleanup()
})

test('AC3.2: setting el.value selects the matching option', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
        </substrate-select>
    `)

    el.value = 'c'
    t.equal(select.value, 'c', 'select value is set')
    const option = Array.from(select.options).find(o => o.value === 'c')
    t.equal(option?.selected, true, 'the matching option is selected')

    cleanup()
})

test('AC3.3: a value set before connect is applied', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'b'
    el.append(...options(['a', 'b']))
    const { select, cleanup } = await attach(el)

    t.equal(select.value, 'b', 'select has the value set while disconnected')
    t.equal(el.value, 'b', 'value set while disconnected is applied')

    cleanup()
})

test('AC3.3: a value set before upgrade is applied', async t => {
    const doc = document.implementation.createHTMLDocument('')
    const el = doc.createElement('substrate-select')
    el.append(...options(['a', 'b'], doc))
    // not upgraded yet, so this is an own data property
    el.value = 'b'
    const { select, cleanup } = await attach(el)

    t.equal(select.value, 'b', 'select has the value set before upgrade')
    t.equal(el.value, 'b', 'value set before upgrade is applied')
    t.equal(Object.prototype.hasOwnProperty.call(el, 'value'), false,
        'the own property no longer hides the accessor')

    cleanup()
})

test('AC3.4: FormData includes name=value', async t => {
    const container = document.createElement('div')
    container.innerHTML = `
        <form>
            <substrate-select name="color">
                <option value="a">A</option>
                <option value="b">B</option>
            </substrate-select>
        </form>
    `
    document.body.appendChild(container)
    await waitFor(null, WAIT, () => {
        return container.querySelector('substrate-select > select')
    })
    const form = container.querySelector('form')!
    const el = container.querySelector('substrate-select')!

    el.value = 'b'
    t.equal(new FormData(form).get('color'), 'b',
        'form data has the selected value under the name')

    container.remove()
})

test('AC3.5: a value with no matching option leaves ""', async t => {
    const { el, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    let threw:unknown = null
    try {
        el.value = 'nomatch'
    } catch (err) {
        threw = err
    }
    t.equal(threw, null, 'setting a non-matching value does not throw')
    t.equal(el.value, '', 'value is empty')

    cleanup()
})

/**
 * Do what the browser does when a user picks an option.
 */
function pick (select:HTMLSelectElement, value:string) {
    select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
}

test('AC4.1: a native change reaches a listener on the host', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    let calls = 0
    el.addEventListener('change', () => { calls++ })
    pick(select, 'b')
    t.equal(calls, 1, 'the host change listener ran once')

    cleanup()
})

test('AC4.2: a change emits substrate-select:change', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    const values:string[] = []
    el.addEventListener(SubstrateSelect.event('change'), ev => {
        const { detail } = ev as CustomEvent<SubstrateSelectChangeDetail>
        values.push(detail.value)
    })
    let shorthandCalls = 0
    el.on('change', () => { shorthandCalls++ })

    pick(select, 'b')
    t.deepEqual(values, ['b'], 'the event ran once with the new value')
    t.equal(shorthandCalls, 1, 'el.on receives the same event')

    cleanup()
})

test('AC4.3: setting el.value from code emits no events', async t => {
    const { el, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    const counts = { change: 0, input: 0, namespaced: 0 }
    el.addEventListener('change', () => { counts.change++ })
    el.addEventListener('input', () => { counts.input++ })
    el.addEventListener(SubstrateSelect.event('change'), () => {
        counts.namespaced++
    })

    el.value = 'b'
    // a zero-delay wait for "nothing happened", which waitFor cannot
    // express
    await new Promise(resolve => setTimeout(resolve, 0))
    t.deepEqual(counts, { change: 0, input: 0, namespaced: 0 },
        'no change, input, or namespaced event')

    cleanup()
})

/**
 * Wait until the option has been moved into the select.
 */
async function inSelect (option:HTMLOptionElement, select:HTMLSelectElement) {
    await waitFor(null, WAIT, () => {
        return option.parentElement === select ? option : null
    })
}

test('AC5.1: an option appended after upgrade moves to the end', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
            <option value="b">B</option>
        </substrate-select>
    `)

    const [option] = options(['z'])
    el.appendChild(option)
    await inSelect(option, select)

    t.equal(select.lastElementChild, option, 'option is last in the select')
    t.ok(Array.from(el.children).every(child => {
        return child === select || child.tagName === 'LABEL'
    }), 'host children are still only the label and the select')

    cleanup()
})

test('AC5.2: reconnecting keeps one label and one select', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select label="Color">
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
        </substrate-select>
    `)

    const container = el.parentElement!
    el.remove()
    container.appendChild(el)

    t.equal(el.querySelectorAll('select').length, 1, 'one select')
    t.equal(el.querySelectorAll('label').length, 1, 'one label')
    t.equal(el.querySelector('select'), select, 'same select node')
    t.equal(select.options.length, 3, 'option count is unchanged')

    cleanup()
})

test('AC5.3: options appended after a reconnect still move', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
        </substrate-select>
    `)

    const container = el.parentElement!
    el.remove()
    container.appendChild(el)

    const [option] = options(['z'])
    el.appendChild(option)
    await inSelect(option, select)
    t.equal(select.lastElementChild, option, 'option is last in the select')

    cleanup()
})

test('AC3.3: a value set before the options arrive is applied', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'b'
    const { select, cleanup } = await attach(el)

    const [a, b] = options(['a', 'b'])
    el.append(a, b)
    await inSelect(b, select)

    t.equal(select.value, 'b', 'select has the waiting value')
    t.equal(el.value, 'b', 'element value is the waiting value')

    cleanup()
})

test('a user change clears a waiting value', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'z'
    el.append(...options(['a', 'b']))
    const { select, cleanup } = await attach(el)

    pick(select, 'b')
    const [z] = options(['z'])
    el.appendChild(z)
    await inSelect(z, select)

    t.equal(el.value, 'b', 'the user pick is not overridden')

    cleanup()
})

test('a later value set clears a waiting value', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'z'
    el.append(...options(['a', 'b']))
    const { select, cleanup } = await attach(el)

    el.value = 'a'
    const [z] = options(['z'])
    el.appendChild(z)
    await inSelect(z, select)

    t.equal(el.value, 'a', 'the later set is not overridden')

    cleanup()
})

test('a value set in the same tick as its option is applied', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
        </substrate-select>
    `)

    const [option] = options(['c'])
    el.appendChild(option)
    el.value = 'c'

    t.equal(option.parentElement, select, 'the option is in the select')
    t.equal(el.value, 'c', 'the value is applied')

    cleanup()
})

test('options appended while disconnected move on reconnect', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
        </substrate-select>
    `)

    const container = el.parentElement!
    el.remove()
    const [option] = options(['z'])
    el.appendChild(option)
    container.appendChild(el)

    t.equal(option.parentElement, select,
        'the option is moved during connect')

    cleanup()
})

test('an option appended just before disconnect is moved', async t => {
    const { el, select, cleanup } = await mount(`
        <substrate-select>
            <option value="a">A</option>
        </substrate-select>
    `)

    const [option] = options(['z'])
    el.appendChild(option)
    el.remove()

    t.equal(option.parentElement, select,
        'the queued option is moved during disconnect')

    cleanup()
})

test('el.select is null before render, then the inner select', async t => {
    const el = document.createElement('substrate-select')
    t.equal(el.select, null, 'no select before the first render')

    const { select, cleanup } = await attach(el)
    t.equal(el.select, select, 'el.select is the rendered select')

    cleanup()
})

test('a waiting value applies to options added through el.select', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'b'
    const { select, cleanup } = await attach(el)

    select.append(...options(['a', 'b']))
    await waitFor(null, WAIT, () => {
        return select.value === 'b' ? select : null
    })
    t.equal(el.value, 'b', 'the waiting value is applied')

    // a later option added to the host does not change the selection
    const [c] = options(['c'])
    el.appendChild(c)
    await inSelect(c, select)
    t.equal(el.value, 'b', 'the selection is unchanged')

    cleanup()
})

test('a waiting value applies inside an optgroup added later', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'b'
    const { select, cleanup } = await attach(el)

    const group = document.createElement('optgroup')
    select.appendChild(group)
    group.append(...options(['a', 'b']))
    await waitFor(null, WAIT, () => {
        return select.value === 'b' ? select : null
    })
    t.equal(el.value, 'b', 'the waiting value is applied')

    cleanup()
})

test('a waiting value with no match leaves no selection at render', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'zzz'
    const [a, b] = options(['a', 'b'])
    b.selected = true
    el.append(a, b)
    const { select, cleanup } = await attach(el)

    t.equal(select.selectedIndex, -1, 'nothing is selected')
    t.equal(el.value, '', 'value is empty while the value waits')

    cleanup()
})

test('a retry with no match keeps a direct el.select pick', async t => {
    const el = document.createElement('substrate-select')
    el.value = 'zzz'
    const { select, cleanup } = await attach(el)

    select.append(...options(['a', 'b']))
    select.value = 'a'

    // one option through el.select, one through the host; the observer
    // reports both in the same batch, so waiting for the host one to
    // move means the select addition has been handled too
    const [c, d] = options(['c', 'd'])
    select.appendChild(c)
    el.appendChild(d)
    await inSelect(d, select)

    t.equal(el.value, 'a', 'the direct pick is kept')

    cleanup()
})
