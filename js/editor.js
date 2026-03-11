// ─── editor.js ────────────────────────────────────────────────────────────────
// Smart node editor with HTML-aware rules:
//   • Tag name dropdown (grouped by category)
//   • Text content field shown only for tags that accept text
//   • Attribute key dropdown (valid attributes per tag), value as text input
//   • Self-closing tags cannot have children (enforced on save)

let editingNodeId = null

// ─── HTML Tag Knowledge Base ──────────────────────────────────────────────────

// Tags that NEVER have text content (container-only or void/self-closing)
const NO_TEXT_TAGS = new Set([
    // Void / self-closing
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
    // Container-only (no direct text makes sense)
    'html', 'head', 'body', 'table', 'thead', 'tbody', 'tfoot', 'tr',
    'colgroup', 'dl', 'fieldset', 'form', 'map', 'noscript', 'object',
    'ol', 'optgroup', 'picture', 'select', 'ul', 'video', 'audio',
    'datalist', 'details', 'dialog', 'figure', 'frameset', 'menu',
    'nav', 'section', 'template'
])

// Tags that accept text content
const TEXT_TAGS = new Set([
    'a', 'abbr', 'address', 'article', 'aside', 'b', 'bdi', 'bdo', 'blockquote',
    'button', 'caption', 'cite', 'code', 'data', 'dd', 'del', 'dfn', 'div', 'dt',
    'em', 'figcaption', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
    'i', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'mark', 'meter', 'option',
    'output', 'p', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
    'small', 'span', 'strong', 'sub', 'summary', 'sup', 'td', 'textarea', 'th',
    'time', 'title', 'u', 'var'
])

// All known tags grouped by category for the dropdown
const TAG_GROUPS = {
    'Document': ['html', 'head', 'body', 'title', 'meta', 'link', 'base', 'style', 'script', 'noscript', 'template'],
    'Sections': ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'address'],
    'Headings': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    'Text Block': ['p', 'blockquote', 'pre', 'div', 'hr', 'br', 'figure', 'figcaption', 'details', 'summary', 'dialog'],
    'Inline Text': ['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'],
    'Lists': ['ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu'],
    'Table': ['table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'col', 'colgroup'],
    'Forms': ['form', 'fieldset', 'legend', 'label', 'input', 'button', 'select', 'option', 'optgroup', 'datalist', 'textarea', 'output', 'meter', 'progress'],
    'Media': ['img', 'audio', 'video', 'source', 'track', 'picture', 'embed', 'object', 'param', 'iframe', 'canvas', 'map', 'area'],
    'Semantic': ['main', 'search', 'hgroup']
}

// Global HTML attributes (valid on any element)
const GLOBAL_ATTRS = [
    'id', 'class', 'style', 'title', 'lang', 'dir', 'tabindex', 'hidden',
    'accesskey', 'contenteditable', 'draggable', 'spellcheck', 'translate',
    'data-*', 'role', 'aria-label', 'aria-hidden', 'aria-describedby'
]

// Tag-specific attributes
const TAG_ATTRS = {
    'a': ['href', 'target', 'rel', 'download', 'hreflang', 'type', 'referrerpolicy'],
    'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes', 'crossorigin', 'usemap', 'ismap'],
    'input': ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'checked', 'min', 'max', 'step', 'pattern', 'maxlength', 'minlength', 'autocomplete', 'autofocus', 'form', 'list', 'multiple', 'size', 'accept'],
    'button': ['type', 'name', 'value', 'disabled', 'form', 'formaction', 'formmethod'],
    'form': ['action', 'method', 'enctype', 'target', 'autocomplete', 'novalidate', 'name'],
    'link': ['href', 'rel', 'type', 'media', 'sizes', 'crossorigin', 'integrity'],
    'meta': ['name', 'content', 'charset', 'http-equiv', 'property'],
    'script': ['src', 'type', 'async', 'defer', 'crossorigin', 'integrity', 'nomodule'],
    'style': ['media', 'type'],
    'iframe': ['src', 'srcdoc', 'width', 'height', 'sandbox', 'allow', 'loading', 'name', 'referrerpolicy'],
    'video': ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'width', 'height', 'playsinline'],
    'audio': ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
    'source': ['src', 'type', 'media', 'srcset', 'sizes'],
    'track': ['src', 'kind', 'srclang', 'label', 'default'],
    'td': ['colspan', 'rowspan', 'headers'],
    'th': ['colspan', 'rowspan', 'headers', 'scope', 'abbr'],
    'col': ['span'],
    'colgroup': ['span'],
    'textarea': ['name', 'rows', 'cols', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength', 'wrap', 'autofocus', 'form'],
    'select': ['name', 'required', 'disabled', 'multiple', 'size', 'autofocus', 'form'],
    'option': ['value', 'selected', 'disabled', 'label'],
    'optgroup': ['label', 'disabled'],
    'label': ['for', 'form'],
    'fieldset': ['disabled', 'form', 'name'],
    'output': ['for', 'form', 'name'],
    'details': ['open'],
    'dialog': ['open'],
    'ol': ['reversed', 'start', 'type'],
    'li': ['value'],
    'time': ['datetime'],
    'data': ['value'],
    'meter': ['value', 'min', 'max', 'low', 'high', 'optimum'],
    'progress': ['value', 'max'],
    'blockquote': ['cite'],
    'q': ['cite'],
    'del': ['cite', 'datetime'],
    'ins': ['cite', 'datetime'],
    'table': ['border'],
    'object': ['data', 'type', 'width', 'height', 'name', 'form'],
    'param': ['name', 'value'],
    'embed': ['src', 'type', 'width', 'height'],
    'map': ['name'],
    'area': ['href', 'alt', 'shape', 'coords', 'target', 'rel', 'download'],
    'canvas': ['width', 'height'],
    'base': ['href', 'target'],
    'html': ['lang', 'dir'],
    'body': ['onload', 'onunload'],
}

// ── Helper: does a tag accept text content? ──────────────────────────────────

function tagAcceptsText(tag) {
    const t = (tag || '').toLowerCase()
    if (NO_TEXT_TAGS.has(t)) return false
    if (TEXT_TAGS.has(t)) return true
    // Unknown tags — show the field by default
    return true
}

// ── Helper: get allowed attribute keys for a tag ─────────────────────────────

function getAttrsForTag(tag) {
    const t = (tag || '').toLowerCase()
    const specific = TAG_ATTRS[t] || []
    // Merge global + tag-specific, deduplicated
    const all = [...GLOBAL_ATTRS, ...specific]
    return [...new Set(all)]
}

// ── Open modal ────────────────────────────────────────────────────────────────

function openEditModal(nodeId) {
    editingNodeId = nodeId
    const nl = nodeLabels[nodeId]
    if (!nl) return

    const currentTag = (nl.tag || 'div').toLowerCase()

    document.getElementById('modal-tag-badge').textContent = `<${currentTag}>`

    // Populate tag dropdown
    const tagSelect = document.getElementById('edit-tag')
    tagSelect.innerHTML = ''
    let found = false
    for (const [group, tags] of Object.entries(TAG_GROUPS)) {
        const optgroup = document.createElement('optgroup')
        optgroup.label = group
        for (const t of tags) {
            const opt = document.createElement('option')
            opt.value = t
            opt.textContent = `<${t}>`
            if (t === currentTag) { opt.selected = true; found = true }
            optgroup.appendChild(opt)
        }
        tagSelect.appendChild(optgroup)
    }
    // If the current tag isn't in our list, add it as a custom option at the top
    if (!found) {
        const customOpt = document.createElement('option')
        customOpt.value = currentTag
        customOpt.textContent = `<${currentTag}> (custom)`
        customOpt.selected = true
        tagSelect.insertBefore(customOpt, tagSelect.firstChild)
    }

    // Text content field
    document.getElementById('edit-info').value = nl.info || ''
    _toggleTextField(currentTag)

    // Rebuild attribute rows
    const list = document.getElementById('attrs-list')
    list.innerHTML = ''
    for (const [k, v] of Object.entries(nl.map || {})) {
        list.appendChild(_attrRow(currentTag, k, v))
    }

    document.getElementById('edit-modal').classList.add('open')
    tagSelect.focus()
}

// ── Toggle text field visibility based on tag ────────────────────────────────

function _toggleTextField(tag) {
    const field = document.getElementById('edit-info-field')
    if (!field) return
    if (tagAcceptsText(tag)) {
        field.style.display = ''
    } else {
        field.style.display = 'none'
    }
}

// ── Tag change handler ───────────────────────────────────────────────────────

function onTagChange() {
    const tag = document.getElementById('edit-tag').value
    document.getElementById('modal-tag-badge').textContent = `<${tag}>`
    _toggleTextField(tag)

    // Rebuild attribute rows with new dropdowns for the new tag
    // Preserve existing values where the key still applies
    const oldRows = document.querySelectorAll('#attrs-list .attr-row')
    const existing = []
    for (const row of oldRows) {
        const k = row.querySelector('[data-role="key"]').value.trim()
        const v = row.querySelector('[data-role="val"]').value
        if (k) existing.push([k, v])
    }

    const list = document.getElementById('attrs-list')
    list.innerHTML = ''
    for (const [k, v] of existing) {
        list.appendChild(_attrRow(tag, k, v))
    }
}

// ── Close modal ───────────────────────────────────────────────────────────────

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('open')
    editingNodeId = null
}

// ── Build one key-dropdown / value-text attribute row ─────────────────────────

function _attrRow(tag, key = '', value = '') {
    const row = document.createElement('div')
    row.className = 'attr-row'

    // Key: dropdown of valid attributes
    const ki = document.createElement('select')
    ki.dataset.role = 'key'
    ki.className = 'attr-key-select'

    const emptyOpt = document.createElement('option')
    emptyOpt.value = ''
    emptyOpt.textContent = '— select —'
    ki.appendChild(emptyOpt)

    const allowed = getAttrsForTag(tag)
    let keyFound = false
    for (const attr of allowed) {
        const opt = document.createElement('option')
        opt.value = attr
        opt.textContent = attr
        if (attr === key) { opt.selected = true; keyFound = true }
        ki.appendChild(opt)
    }
    // If current key is not in the allowed list (e.g. custom data- attribute)
    if (key && !keyFound) {
        const customOpt = document.createElement('option')
        customOpt.value = key
        customOpt.textContent = key + ' (custom)'
        customOpt.selected = true
        ki.insertBefore(customOpt, ki.children[1])
    }

    // Value: text input (space-separated for multi-value like class)
    const vi = document.createElement('input')
    vi.type = 'text'
    vi.placeholder = 'value'
    vi.value = value
    vi.dataset.role = 'val'

    // Remove button
    const rm = document.createElement('button')
    rm.className = 'btn-remove'
    rm.textContent = '✕'
    rm.onclick = () => row.remove()

    row.appendChild(ki)
    row.appendChild(vi)
    row.appendChild(rm)
    return row
}

// ── Public: add a blank attribute row ─────────────────────────────────────────

function addAttrRow() {
    const tag = document.getElementById('edit-tag').value || 'div'
    document.getElementById('attrs-list').appendChild(_attrRow(tag))
}

// ── Save edits ────────────────────────────────────────────────────────────────

function saveNodeEdit() {
    if (editingNodeId === null) return

    const newTag = document.getElementById('edit-tag').value.trim()
    if (!newTag) { alert('Tag name cannot be empty.'); return }

    // Text content: only save if the tag accepts text
    let newInfo = ''
    if (tagAcceptsText(newTag)) {
        newInfo = document.getElementById('edit-info').value
    }

    // Collect attributes — skip rows with empty keys
    const newMap = {}
    for (const row of document.querySelectorAll('#attrs-list .attr-row')) {
        const k = row.querySelector('[data-role="key"]').value.trim()
        const v = row.querySelector('[data-role="val"]').value
        if (k) {
            // Merge duplicate keys by space-separating values
            if (newMap[k]) {
                newMap[k] = newMap[k] + ' ' + v
            } else {
                newMap[k] = v
            }
        }
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
