// ─── interaction.js ───────────────────────────────────────────────────────────
// Responsibilities:
//   worldPos()  — convert screen (mouse) coords → world (graph) coords
//   nodeAt()    — hit-test: which node (if any) is under a world coordinate?
//   Mouse event listeners: mousedown, mousemove, mouseup, mouseleave, wheel
//   Right-click context menu, double-click to edit, click to select

// ── Coordinate helper ────────────────────────────────────────────────────────

function worldPos(e) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy
    return {
        x: (cx - offsetX) / scale,
        y: (cy - offsetY) / scale
    }
}

function nodeAt(wx, wy) {
    for (let id of nodeList) {
        const n = nodes[id]
        if (!n) continue
        if (isHiddenByCollapse(id)) continue
        const dx = n.x - wx
        const dy = n.y - wy
        if (Math.sqrt(dx * dx + dy * dy) <= RADIUS + 4) return id
    }
    return null
}

const _supportsHoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
let nodeCardNode = null
let nodeCardHideTimer = null

function clearNodeCardHideTimer() {
    if (nodeCardHideTimer) {
        clearTimeout(nodeCardHideTimer)
        nodeCardHideTimer = null
    }
}

function scheduleHideNodeActionCard(delay = 180) {
    clearNodeCardHideTimer()
    nodeCardHideTimer = setTimeout(() => {
        hideNodeActionCard()
    }, delay)
}

function showNodeActionCard(nodeId, clientX = null, clientY = null) {
    const card = document.getElementById('node-action-card')
    if (!card || nodeId === null || !nodeLabels[nodeId]) return

    clearNodeCardHideTimer()

    nodeCardNode = nodeId
    selectedNode = nodeId

    const nl = nodeLabels[nodeId]
    const path = getBreadcrumb(nodeId)
    const attrs = Object.entries(nl.map || {})

    const tagEl = document.getElementById('node-card-tag')
    const pathEl = document.getElementById('node-card-path')
    const metaEl = document.getElementById('node-card-meta')
    const collapseBtn = document.getElementById('node-card-collapse-btn')

    if (tagEl) tagEl.textContent = `<${nl.tag || nodeId}>`
    if (pathEl) pathEl.textContent = path.join(' › ')
    if (metaEl) {
        const txt = (nl.info || '').trim()
        if (txt) {
            metaEl.textContent = txt.slice(0, 42)
        } else {
            metaEl.textContent = attrs.length ? `${attrs.length} attribute(s)` : 'No attributes'
        }
    }

    const tn = treeNodes[nodeId]
    const hasChildren = !!(tn && tn.children && tn.children.length)
    if (collapseBtn) {
        collapseBtn.style.display = hasChildren ? '' : 'none'
        collapseBtn.textContent = collapsedNodes.has(nodeId) ? '⊞' : '⊟'
        collapseBtn.title = collapsedNodes.has(nodeId) ? 'Expand children' : 'Collapse children'
        collapseBtn.setAttribute('aria-label', collapseBtn.title)
    }

    card.classList.add('visible')

    const fallbackX = window.innerWidth - 210
    const fallbackY = window.innerHeight - 140
    let x = clientX ?? fallbackX
    let y = clientY ?? fallbackY

    const rect = card.getBoundingClientRect()
    const pad = 8
    if (x + rect.width + pad > window.innerWidth) x = window.innerWidth - rect.width - pad
    if (y + rect.height + pad > window.innerHeight) y = Math.max(pad, y - rect.height - 18)
    x = Math.max(pad, x)
    y = Math.max(pad, y)

    card.style.left = `${x}px`
    card.style.top = `${y}px`
    draw()
}

function hideNodeActionCard() {
    clearNodeCardHideTimer()
    const card = document.getElementById('node-action-card')
    if (card) card.classList.remove('visible')
    nodeCardNode = null
}

const nodeActionCardEl = document.getElementById('node-action-card')
if (nodeActionCardEl) {
    nodeActionCardEl.addEventListener('mouseenter', () => {
        clearNodeCardHideTimer()
    })
    nodeActionCardEl.addEventListener('mouseleave', () => {
        if (_supportsHoverPointer) scheduleHideNodeActionCard(220)
    })
}

function nodeCardEdit() {
    if (nodeCardNode !== null) openEditModal(nodeCardNode)
}

function nodeCardAdd() {
    if (nodeCardNode !== null) {
        addChildNode(nodeCardNode)
        showNodeActionCard(nodeCardNode)
    }
}

function nodeCardCollapse() {
    if (nodeCardNode !== null) {
        toggleCollapse(nodeCardNode)
        showNodeActionCard(nodeCardNode)
    }
}

function nodeCardDelete() {
    if (nodeCardNode !== null && nodeCardNode !== rootNode) {
        deleteNodeFromTree(nodeCardNode)
        selectedNode = null
        hideNodeActionCard()
        draw()
    }
}

// ── Mouse: press ─────────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', e => {
    // Close context menu on any click
    hideContextMenu()

    if (e.button !== 0) return   // only left-click for drag/pan

    const w = worldPos(e)
    const hit = nodeAt(w.x, w.y)

    if (hit !== null) {
        draggingNode = hit
        selectedNode = hit
        dragOffset = { x: w.x - nodes[hit].x, y: w.y - nodes[hit].y }
    } else {
        selectedNode = null
        hideNodeActionCard()
        isPanning = true
        panStart = { x: e.clientX, y: e.clientY }
        panOrigin = { x: offsetX, y: offsetY }
    }
    draw()
})

// ── Mouse: move ──────────────────────────────────────────────────────────────

canvas.addEventListener('mousemove', e => {
    const w = worldPos(e)

    if (draggingNode !== null) {
        nodes[draggingNode].x = w.x - dragOffset.x
        nodes[draggingNode].y = w.y - dragOffset.y
        draw()
        return
    }

    if (isPanning) {
        offsetX = panOrigin.x + (e.clientX - panStart.x)
        offsetY = panOrigin.y + (e.clientY - panStart.y)
        draw()
        return
    }

    // Hover detection
    const hit = nodeAt(w.x, w.y)
    if (hit !== hoveredNode) {
        hoveredNode = hit
        if (hit !== null) {
            const nl = nodeLabels[hit]
            const tag = nl ? nl.tag : String(hit)
            const path = getBreadcrumb(hit)
            document.getElementById('hover-label').textContent = path.join(' › ')
            if (_supportsHoverPointer && !isPanning && draggingNode === null) {
                showNodeActionCard(hit, e.clientX + 14, e.clientY + 12)
            }
        } else {
            document.getElementById('hover-label').textContent = 'Hover a node'
            if (_supportsHoverPointer) scheduleHideNodeActionCard(220)
        }
        draw()
    }
})

// ── Mouse: release ───────────────────────────────────────────────────────────

canvas.addEventListener('mouseup', () => {
    draggingNode = null
    isPanning = false
})

// ── Mouse: double-click (open node editor) ────────────────────────────────────

canvas.addEventListener('dblclick', e => {
    const w = worldPos(e)
    const hit = nodeAt(w.x, w.y)
    if (hit !== null) openEditModal(hit)
})

// ── Mouse: right-click (context menu) ─────────────────────────────────────────

canvas.addEventListener('contextmenu', e => {
    e.preventDefault()
    const w = worldPos(e)
    const hit = nodeAt(w.x, w.y)

    if (hit !== null) {
        hideNodeActionCard()
        ctxMenuNode = hit
        selectedNode = hit
        showContextMenu(e.clientX, e.clientY, hit)
    } else {
        hideContextMenu()
        hideNodeActionCard()
    }
    draw()
})

canvas.addEventListener('click', e => {
    const w = worldPos(e)
    const hit = nodeAt(w.x, w.y)
    if (hit !== null) {
        showNodeActionCard(hit, e.clientX + 12, e.clientY + 10)
    }
})

// ── Mouse: leave canvas ──────────────────────────────────────────────────────

canvas.addEventListener('mouseleave', () => {
    draggingNode = null
    isPanning = false
    hoveredNode = null
    if (_supportsHoverPointer) scheduleHideNodeActionCard(220)
    draw()
})

// ── Mouse: scroll wheel (zoom) ───────────────────────────────────────────────

canvas.addEventListener('wheel', e => {
    e.preventDefault()

    const factor = e.deltaY < 0 ? 1.1 : 0.91

    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy

    offsetX = cx - factor * (cx - offsetX)
    offsetY = cy - factor * (cy - offsetY)
    scale *= factor

    document.getElementById('zoom-label').textContent = `Zoom: ${Math.round(scale * 100)}%`
    draw()
}, { passive: false })

// ── Keyboard shortcuts ───────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
    // Don't capture keys while typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode !== null && selectedNode !== rootNode) {
            deleteNodeFromTree(selectedNode)
            selectedNode = null
            draw()
        }
    }

    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        document.getElementById('search-input').focus()
    }
})

document.addEventListener('click', e => {
    const card = document.getElementById('node-action-card')
    if (!card || !card.classList.contains('visible')) return
    if (card.contains(e.target)) return
    if (e.target === canvas) return
    hideNodeActionCard()
})

// ─── Live auto-visualize (debounced) ──────────────────────────────────────────

let _liveTimer = null

document.getElementById('input').addEventListener('input', () => {
    clearTimeout(_liveTimer)
    _liveTimer = setTimeout(() => {
        const text = document.getElementById('input').value.trim()
        if (text) buildTree()
    }, 600)
})

// ─── Fixed bottom-right scroll controls ──────────────────────────────────────

let _scrollDirection = 'down'

function toggleScrollDirection() {
    const btn = document.getElementById('scroll-fab-btn')
    if (!btn) return

    if (_scrollDirection === 'down') {
        const maxY = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        )
        window.scrollTo({ top: maxY, behavior: 'smooth' })
        _scrollDirection = 'up'
        btn.textContent = '↑'
        btn.title = 'Go to top'
        btn.setAttribute('aria-label', 'Go to top')
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        _scrollDirection = 'down'
        btn.textContent = '↓'
        btn.title = 'Go to bottom'
        btn.setAttribute('aria-label', 'Go to bottom')
    }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.getElementById('input').value = `<html>
  <head>
    <title>Demo</title>
  </head>
  <body>
    <header>
      <h1>Title</h1>
    </header>
    <main>
      <p>Hello</p>
      <ul>
        <li>Item A</li>
        <li>Item B</li>
      </ul>
    </main>
  </body>
</html>`
buildTree()
