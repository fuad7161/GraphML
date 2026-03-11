// ─── editor.js ────────────────────────────────────────────────────────────────
// Node editing: double-click a graph node to open the edit modal.
// Allows changing: tag name, attributes (key/value pairs), inner text.
// Changes are written back to both nodeLabels (draw) and treeNodes (generate).

let editingNodeId = null

// ── Open modal ────────────────────────────────────────────────────────────────

function openEditModal(nodeId) {
    editingNodeId = nodeId
    const nl = nodeLabels[nodeId]
    if (!nl) return

    document.getElementById('modal-tag-badge').textContent = `<${nl.tag}>`
    document.getElementById('edit-tag').value = nl.tag
    document.getElementById('edit-info').value = nl.info || ''

    // Rebuild attribute rows from current map
    const list = document.getElementById('attrs-list')
    list.innerHTML = ''
    for (const [k, v] of Object.entries(nl.map || {})) {
        list.appendChild(_attrRow(k, v))
    }

    document.getElementById('edit-modal').classList.add('open')
    document.getElementById('edit-tag').focus()
}

// ── Close modal ───────────────────────────────────────────────────────────────

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('open')
    editingNodeId = null
}

// ── Build one key/value attribute row ─────────────────────────────────────────

function _attrRow(key = '', value = '') {
    const row = document.createElement('div')
    row.className = 'attr-row'

    const ki = document.createElement('input')
    ki.type = 'text'; ki.placeholder = 'attribute'; ki.value = key
    ki.dataset.role = 'key'

    const vi = document.createElement('input')
    vi.type = 'text'; vi.placeholder = 'value'; vi.value = value
    vi.dataset.role = 'val'

    const rm = document.createElement('button')
    rm.className = 'btn-remove'; rm.textContent = '✕'
    rm.onclick = () => row.remove()

    row.appendChild(ki)
    row.appendChild(vi)
    row.appendChild(rm)
    return row
}

// ── Public: add a blank attribute row (called from HTML) ─────────────────────

function addAttrRow() {
    document.getElementById('attrs-list').appendChild(_attrRow())
}

// ── Save edits ────────────────────────────────────────────────────────────────

function saveNodeEdit() {
    if (editingNodeId === null) return

    const newTag = document.getElementById('edit-tag').value.trim()
    if (!newTag) { alert('Tag name cannot be empty.'); return }

    const newInfo = document.getElementById('edit-info').value

    // Collect attributes
    const newMap = {}
    for (const row of document.querySelectorAll('#attrs-list .attr-row')) {
        const k = row.querySelector('[data-role="key"]').value.trim()
        const v = row.querySelector('[data-role="val"]').value
        if (k) newMap[k] = v
    }

    // Update nodeLabels (used by draw & hover)
    nodeLabels[editingNodeId].tag = newTag
    nodeLabels[editingNodeId].info = newInfo
    nodeLabels[editingNodeId].map = newMap

    // Update treeNodes (used by HTML generation)
    if (treeNodes[editingNodeId]) {
        treeNodes[editingNodeId].tag = newTag
        treeNodes[editingNodeId].info = newInfo
        treeNodes[editingNodeId].map = newMap
    }

    closeEditModal()
    draw()
}

// ── Close when clicking the dimmed backdrop ───────────────────────────────────

document.getElementById('edit-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEditModal()
})

// ── Close on Escape key ───────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeEditModal()
})
