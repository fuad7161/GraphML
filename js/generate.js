// ─── generate.js ─────────────────────────────────────────────────────────────
// Reconstructs clean, indented HTML from the current in-memory graph/tree.
// Uses treeNodes for structure (parent→children) and nodeLabels for the
// live data (tag, attributes, inner text) – so edits are reflected immediately.

const SELF_CLOSING = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
])

// ── Core recursive generator ──────────────────────────────────────────────────

function generateHTMLFromTree() {
    if (rootNode === null) return ''

    function nodeToHTML(id, depth) {
        const nl = nodeLabels[id]
        const tn = treeNodes[id]
        if (!nl || !tn) return ''

        const tag = nl.tag || 'div'
        const map = nl.map || {}
        const info = (nl.info || '').trim()
        const children = tn.children || []
        const pad = '  '.repeat(depth)

        // Build attribute string
        const attrStr = Object.entries(map)
            .map(([k, v]) => v !== '' ? `${k}="${v}"` : k)
            .join(' ')

        // Self-closing tags have no children or closing tag
        if (SELF_CLOSING.has(tag.toLowerCase())) {
            return attrStr
                ? `${pad}<${tag} ${attrStr}>`
                : `${pad}<${tag}>`
        }

        const open = attrStr ? `${pad}<${tag} ${attrStr}>` : `${pad}<${tag}>`
        const close = `</${tag}>`

        // Leaf with optional inline text
        if (children.length === 0) {
            return `${open}${info}${close}`
        }

        // Container node
        let html = open
        if (info) html += `\n${'  '.repeat(depth + 1)}${info}`
        for (const childId of children) {
            html += '\n' + nodeToHTML(childId, depth + 1)
        }
        html += `\n${pad}${close}`
        return html
    }

    return nodeToHTML(rootNode, 0)
}

// ── Show generated HTML in the sidebar output panel ──────────────────────────

function showGeneratedHTML() {
    if (rootNode === null) return

    const html = generateHTMLFromTree()
    const pre = document.getElementById('output-pre')
    const panel = document.getElementById('output-panel')

    pre.textContent = html
    panel.classList.add('visible')
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────

function copyGeneratedHTML() {
    const text = document.getElementById('output-pre').textContent
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copied-msg')
        msg.classList.add('show')
        setTimeout(() => msg.classList.remove('show'), 1800)
    })
}

// ── Download as .html file ────────────────────────────────────────────────────

function downloadGeneratedHTML() {
    const text = document.getElementById('output-pre').textContent
    if (!text) return
    const blob = new Blob([text], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'output.html'
    a.click()
    URL.revokeObjectURL(a.href)
}

// ── Preview Panel ─────────────────────────────────────────────────────────────

function openPreview() {
    if (rootNode === null) return
    const section = document.getElementById('preview-section')
    section.classList.add('open')
    refreshPreview()
    // Smooth scroll to the preview section
    setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
}

function refreshPreview() {
    if (rootNode === null) return
    const html = generateHTMLFromTree()
    const iframe = document.getElementById('preview-iframe')
    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
}

function closePreview() {
    const section = document.getElementById('preview-section')
    section.classList.remove('open')
}

function togglePreviewSize() {
    const wrap = document.querySelector('.preview-frame-wrap')
    wrap.classList.toggle('expanded')
}
