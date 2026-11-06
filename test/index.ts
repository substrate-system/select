import { test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'
import '../src/index.js'

test('example test', async t => {
    document.body.innerHTML += `
        <substrate-select class="test">
        </substrate-select>
    `

    const el = await waitFor('substrate-select')

    t.ok(el, 'should find an element')
})
