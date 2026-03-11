// ─── viewport.js ─────────────────────────────────────────────────────────────
// Responsibilities:
//   resetView()    — auto-fit all nodes into the visible canvas area
//   zoomAt()       — zoom by a factor, centered on canvas center
//   ResizeObserver — keep canvas resolution matching its container

function resetView() {
    if (nodeList.length === 0) {
        scale = 1; offsetX = 0; offsetY = 0
        return
    }

    const xs = nodeList.map(n => nodes[n].x)
    const ys = nodeList.map(n => nodes[n].y)
    const minX = Math.min(...xs) - RADIUS * 2
    const maxX = Math.max(...xs) + RADIUS * 2
    const minY = Math.min(...ys) - RADIUS * 2
    const maxY = Math.max(...ys) + RADIUS * 2

    const sw = canvas.width
    const sh = canvas.height

    const scaleX = sw / (maxX - minX)
    const scaleY = sh / (maxY - minY)
    scale = Math.min(scaleX, scaleY, 1.4) * 0.88

    offsetX = sw / 2 - scale * (minX + maxX) / 2
    offsetY = sh / 2 - scale * (minY + maxY) / 2

    document.getElementById('zoom-label').textContent = `Zoom: ${Math.round(scale * 100)}%`
    draw()
}

function zoomAt(factor) {
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    offsetX = cx - factor * (cx - offsetX)
    offsetY = cy - factor * (cy - offsetY)
    scale *= factor

    document.getElementById('zoom-label').textContent = `Zoom: ${Math.round(scale * 100)}%`
    draw()
}

// ── Responsive canvas resize ─────────────────────────────────────────────────

const _canvasWrap = document.querySelector('.canvas-wrap')
if (_canvasWrap && typeof ResizeObserver !== 'undefined') {
    const _resizer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect
            const dpr = window.devicePixelRatio || 1
            canvas.width = Math.round(width * dpr)
            canvas.height = Math.round(height * dpr)
            canvas.style.width = width + 'px'
            canvas.style.height = height + 'px'
            if (nodeList.length) resetView()
            else draw()
        }
    })
    _resizer.observe(_canvasWrap)
}
