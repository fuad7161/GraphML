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
        } else {
            document.getElementById('hover-label').textContent = 'Hover a node'
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
        ctxMenuNode = hit
        selectedNode = hit
        showContextMenu(e.clientX, e.clientY, hit)
    } else {
        hideContextMenu()
    }
    draw()
})

// ── Mouse: leave canvas ──────────────────────────────────────────────────────

canvas.addEventListener('mouseleave', () => {
    draggingNode = null
    isPanning = false
    hoveredNode = null
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

// ─── Live auto-visualize (debounced) ──────────────────────────────────────────

let _liveTimer = null

document.getElementById('input').addEventListener('input', () => {
    clearTimeout(_liveTimer)
    _liveTimer = setTimeout(() => {
        const text = document.getElementById('input').value.trim()
        if (text) buildTree()
    }, 600)
})

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
