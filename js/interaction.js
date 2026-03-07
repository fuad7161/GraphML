// ─── interaction.js ───────────────────────────────────────────────────────────
// Responsibilities:
//   worldPos()  — convert screen (mouse) coordinates → world (graph) coordinates
//   nodeAt()    — hit-test: which node (if any) is under a world coordinate?
//   Mouse event listeners: mousedown, mousemove, mouseup, mouseleave, wheel

// ── Coordinate helper ────────────────────────────────────────────────────────

// Converts a mouse event's screen position to world space,
// accounting for canvas CSS scaling and the current pan/zoom transform.
function worldPos(e) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width    // CSS-to-canvas pixel ratio
    const sy = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy
    return {
        x: (cx - offsetX) / scale,
        y: (cy - offsetY) / scale
    }
}

// Returns the node ID under (wx, wy), or null if none
function nodeAt(wx, wy) {
    for (let id of nodeList) {
        const n = nodes[id]
        if (!n) continue
        const dx = n.x - wx
        const dy = n.y - wy
        if (Math.sqrt(dx * dx + dy * dy) <= RADIUS + 4) return id
    }
    return null
}

// ── Mouse: press ─────────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', e => {
    const w = worldPos(e)
    const hit = nodeAt(w.x, w.y)

    if (hit !== null) {
        // Start dragging a node
        draggingNode = hit
        dragOffset = { x: w.x - nodes[hit].x, y: w.y - nodes[hit].y }
    } else {
        // Start panning the canvas
        isPanning = true
        panStart = { x: e.clientX, y: e.clientY }
        panOrigin = { x: offsetX, y: offsetY }
    }
})

// ── Mouse: move ──────────────────────────────────────────────────────────────

canvas.addEventListener('mousemove', e => {
    const w = worldPos(e)

    if (draggingNode !== null) {
        // Move the dragged node to follow the cursor
        nodes[draggingNode].x = w.x - dragOffset.x
        nodes[draggingNode].y = w.y - dragOffset.y
        draw()
        return
    }

    if (isPanning) {
        // Shift the viewport offset by mouse delta
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
            const deg = (adj[hit] || []).length
            document.getElementById('hover-label').textContent =
                `Node ${hit} · Degree: ${deg} · Type: ${nodes[hit].type}`
        } else {
            document.getElementById('hover-label').textContent = 'Hover a node for info'
        }
        draw()
    }
})

// ── Mouse: release ───────────────────────────────────────────────────────────

canvas.addEventListener('mouseup', () => {
    draggingNode = null
    isPanning = false
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

    const factor = e.deltaY < 0 ? 1.1 : 0.91    // scroll up = zoom in

    // Zoom centered on the cursor position
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

// ─── Boot ─────────────────────────────────────────────────────────────────────
buildTree()
