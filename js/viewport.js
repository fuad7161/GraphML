// ─── viewport.js ─────────────────────────────────────────────────────────────
// Responsibilities:
//   resetView() — auto-fit all nodes into the visible canvas area
//   zoomAt()    — zoom by a factor, centered on canvas center

function resetView() {
    if (nodeList.length === 0) {
        scale = 1; offsetX = 0; offsetY = 0
        return
    }

    // Compute bounding box of all node positions
    const xs = nodeList.map(n => nodes[n].x)
    const ys = nodeList.map(n => nodes[n].y)
    const minX = Math.min(...xs) - RADIUS * 2
    const maxX = Math.max(...xs) + RADIUS * 2
    const minY = Math.min(...ys) - RADIUS * 2
    const maxY = Math.max(...ys) + RADIUS * 2

    const sw = canvas.width
    const sh = canvas.height

    // Scale so all nodes fit, with a bit of breathing room (×0.88)
    const scaleX = sw / (maxX - minX)
    const scaleY = sh / (maxY - minY)
    scale = Math.min(scaleX, scaleY, 1.4) * 0.88

    // Center the bounding box in the canvas
    offsetX = sw / 2 - scale * (minX + maxX) / 2
    offsetY = sh / 2 - scale * (minY + maxY) / 2

    document.getElementById('zoom-label').textContent = `Zoom: ${Math.round(scale * 100)}%`
    draw()
}

function zoomAt(factor) {
    // Zoom centered on the canvas center point
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    offsetX = cx - factor * (cx - offsetX)
    offsetY = cy - factor * (cy - offsetY)
    scale *= factor

    document.getElementById('zoom-label').textContent = `Zoom: ${Math.round(scale * 100)}%`
    draw()
}
