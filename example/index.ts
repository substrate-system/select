import '../src/index.css'
import {
    SubstrateSelect,
    type SubstrateSelectChangeDetail
} from '../src/index.js'

if (import.meta.env.DEV || import.meta.env.MODE !== 'production') {
    localStorage.setItem('DEBUG', 'substrate-select')
} else {
    localStorage.removeItem('DEBUG')
}

const form = document.getElementById('order') as HTMLFormElement
const output = document.getElementById('form-output')!
const log = document.getElementById('change-log')!
const addButton = document.getElementById('add-option')!

// Print the form's fields on submit. The inner select is a light-DOM
// descendant of the form, so FormData sees it with no extra work.
form.addEventListener('submit', ev => {
    ev.preventDefault()
    const lines = Array.from(new FormData(form).entries())
        .map(([key, value]) => `${key}=${String(value)}`)
    output.textContent = lines.join('\n')
})

// Append options to the host; the component moves them into its
// select.
let added = 0
addButton.addEventListener('click', () => {
    const host = form.querySelector('substrate-select')
    if (!host) return
    added++
    const option = document.createElement('option')
    option.value = `pickup-${added}`
    option.textContent = `Pickup point ${added}`
    host.appendChild(option)
})

// Log every substrate-select:change on the page
document.addEventListener(SubstrateSelect.event('change'), ev => {
    const { detail, target } = ev as CustomEvent<SubstrateSelectChangeDetail>
    const item = document.createElement('li')
    const name = (target as SubstrateSelect).name ?? '(no name)'
    item.textContent = `${name}: ${detail.value}`
    log.prepend(item)
})

/**
 * Page level FOUCE guard -- reveal the page once every component is
 * defined, so they appear together instead of one at a time.
 *
 * The timeout is not optional. Without it, a component that fails to
 * define leaves the page blank forever.
 *
 * @see docs/adr/ADR-006-fouce-mitigation.md
 */
await Promise.race([
    Promise.allSettled([
        customElements.whenDefined('substrate-select')
    ]),
    new Promise(resolve => {
        setTimeout(resolve, 2000)
    })
])

document.documentElement.classList.remove('reduce-fouce')
