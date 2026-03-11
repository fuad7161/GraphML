// ─── search.js ────────────────────────────────────────────────────────────────
// Live search: type a tag name, attribute, or text to highlight matching nodes.
// Non-matching nodes and edges are dimmed; matches get a green glow.

function runSearch(query) {
    searchQuery = (query || '').trim().toLowerCase()
    matchedNodes = new Set()

    if (!searchQuery) {
        updateSearchCount(0, 0)
        draw()
        return
    }

    for (const id of nodeList) {
        const nl = nodeLabels[id]
        if (!nl) continue

        const tag = (nl.tag || '').toLowerCase()
        const info = (nl.info || '').toLowerCase()

        // Match against tag name
        if (tag.includes(searchQuery)) { matchedNodes.add(id); continue }

        // Match against text content
        if (info.includes(searchQuery)) { matchedNodes.add(id); continue }

        // Match against attribute keys or values
        for (const [k, v] of Object.entries(nl.map || {})) {
            if (k.toLowerCase().includes(searchQuery) ||
                v.toLowerCase().includes(searchQuery)) {
                matchedNodes.add(id)
                break
            }
        }
    }

    updateSearchCount(matchedNodes.size, nodeList.length)
    draw()
}

function updateSearchCount(found, total) {
    const el = document.getElementById('search-count')
    if (!el) return
    if (!searchQuery) {
        el.textContent = ''
    } else {
        el.textContent = `${found} / ${total}`
    }
}

function clearSearch() {
    const input = document.getElementById('search-input')
    if (input) input.value = ''
    runSearch('')
}
