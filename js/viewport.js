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

// ── Canvas resolution sync ───────────────────────────────────────────────────
// Sync the canvas drawing-buffer to its CSS pixel size (called once at init
// and again whenever we dynamically resize the wrapper for large trees).

const BASE_CANVAS_HEIGHT = 600

function syncCanvasSize() {
    const wrap = document.querySelector('.canvas-wrap')
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
}

// Dynamically grow / shrink canvas-wrap when the tree needs more room.
function fitCanvasToTree() {
    const wrap = document.querySelector('.canvas-wrap')
    if (!wrap) return

    let neededH = BASE_CANVAS_HEIGHT
    if (nodeList.length > 0) {
        // Height based on depth
        const depthH = (maxDepth + 1) * 110 + 120
        // Width hints (if tree is very wide the user can still pan)
        neededH = Math.max(BASE_CANVAS_HEIGHT, Math.min(depthH, 1200))
    }
    wrap.style.height = neededH + 'px'
    syncCanvasSize()
}

// Initial sync on load
syncCanvasSize()

// ── Sidebar collapse / expand ────────────────────────────────────────────────

function toggleSidebar() {
    const main = document.querySelector('.main')
    main.classList.toggle('sidebar-collapsed')

    // Flip chevron arrow direction
    const chevron = document.querySelector('.toggle-chevron')
    if (chevron) chevron.classList.toggle('collapsed')

    // After the CSS transition finishes (300ms), re-sync canvas to new width
    setTimeout(() => {
        syncCanvasSize()
        if (nodeList.length) resetView()
        else draw()
    }, 320)
}
