// ─── draw.js ──────────────────────────────────────────────────────────────────
// Responsibilities:
//   draw()       — master draw call: clear → grid → edges → nodes → tooltip
//   drawGrid()   — faint background dot-grid (respects pan/zoom)
//   drawEdges()  — animated gradient lines with hover glow
//   nodeColor()  — returns fill/stroke colors based on node type & hover state
//   drawNodes()  — layered circle rendering: glow → shadow → fill → shine → label
//   drawTooltip()— rich floating info card next to hovered node

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    drawGrid()
    drawEdges()
    drawNodes()

    ctx.restore()
}

// ── Background grid ──────────────────────────────────────────────────────────

function drawGrid() {
    const gridSize = 50
    const W = canvas.width / scale
    const H = canvas.height / scale
    const ox = -offsetX / scale
    const oy = -offsetY / scale

    ctx.strokeStyle = 'rgba(255,255,255,0.025)'
    ctx.lineWidth = 1

    const startX = Math.floor(ox / gridSize) * gridSize
    const startY = Math.floor(oy / gridSize) * gridSize

    for (let x = startX; x < ox + W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + H); ctx.stroke()
    }
    for (let y = startY; y < oy + H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + W, y); ctx.stroke()
    }
}

// ── Edges ────────────────────────────────────────────────────────────────────

function drawEdges() {
    const hasSearch = searchQuery.length > 0

    for (let i = 0; i < edges.length; i++) {
        const [u, v] = edges[i]
        const a = nodes[u], b = nodes[v]
        if (!a || !b) continue

        // Hide edges into collapsed subtrees
        if (collapsedNodes.has(u)) continue
        if (isHiddenByCollapse(v)) continue

        const edgeProg = Math.min(1, Math.max(0, animProgress * edges.length - i))
        const cx = a.x + (b.x - a.x) * edgeProg
        const cy = a.y + (b.y - a.y) * edgeProg

        const isHovered = hoveredNode === u || hoveredNode === v
        const isBackground = hoveredNode !== null && !isHovered
        const isSearchDimmed = hasSearch && !matchedNodes.has(u) && !matchedNodes.has(v)

        ctx.save()
        ctx.globalAlpha = isSearchDimmed ? 0.08 : (isBackground ? 0.2 : 1)

        if (isHovered) {
            ctx.shadowColor = '#818cf8'
            ctx.shadowBlur = 12
        }

        const grad = ctx.createLinearGradient(a.x, a.y, cx, cy)
        grad.addColorStop(0, isHovered ? '#a78bfa' : 'rgba(99,102,241,0.6)')
        grad.addColorStop(1, isHovered ? '#60a5fa' : 'rgba(56,189,248,0.4)')

        ctx.strokeStyle = grad
        ctx.lineWidth = isHovered ? 2.5 : 1.8
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(cx, cy)
        ctx.stroke()
        ctx.restore()

        if (animating && edgeProg > 0 && edgeProg < 1) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#a78bfa'
            ctx.shadowColor = '#a78bfa'
            ctx.shadowBlur = 10
            ctx.fill()
            ctx.restore()
        }
    }
}

// ── Node color helper ────────────────────────────────────────────────────────

function nodeColor(id) {
    const t = nodes[id].type
    if (id == selectedNode) return { fill: ['#f59e0b', '#d97706'], stroke: '#fde68a' }
    if (id == hoveredNode) return { fill: ['#fbbf24', '#f59e0b'], stroke: '#fde68a' }
    if (t === 'root') return { fill: ['#7c3aed', '#4f46e5'], stroke: '#a78bfa' }
    if (t === 'leaf') return { fill: ['#059669', '#10b981'], stroke: '#6ee7b7' }
    return { fill: ['#0ea5e9', '#4f46e5'], stroke: '#93c5fd' }
}

// ── Nodes ────────────────────────────────────────────────────────────────────

function drawNodes() {
    const hasSearch = searchQuery.length > 0

    for (let id of nodeList) {
        const node = nodes[id]
        if (!node) continue

        // Skip children of collapsed parents
        if (isHiddenByCollapse(id)) continue

        const alpha = nodeAlpha[id] || 0
        if (alpha <= 0) continue

        const isMatch = matchedNodes.has(id)
        const isDimmed = hasSearch && !isMatch
        const isCollapsed = collapsedNodes.has(id)

        ctx.save()
        ctx.globalAlpha = alpha * (isDimmed ? 0.15 : 1)

        const col = nodeColor(id)
        const r = RADIUS
        const isHov = id == hoveredNode
        const isSel = id == selectedNode

        // 1. Outer glow ring
        if (isHov || isSel) {
            const glowGrad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 16)
            glowGrad.addColorStop(0, 'rgba(251,191,36,0.35)')
            glowGrad.addColorStop(1, 'rgba(251,191,36,0)')
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 16, 0, Math.PI * 2)
            ctx.fillStyle = glowGrad
            ctx.fill()
        } else if (isMatch && hasSearch) {
            const glowGrad = ctx.createRadialGradient(node.x, node.y, r - 2, node.x, node.y, r + 14)
            glowGrad.addColorStop(0, 'rgba(52,211,153,0.4)')
            glowGrad.addColorStop(1, 'rgba(52,211,153,0)')
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 14, 0, Math.PI * 2)
            ctx.fillStyle = glowGrad
            ctx.fill()
        } else {
            const glowGrad = ctx.createRadialGradient(node.x, node.y, r - 4, node.x, node.y, r + 10)
            glowGrad.addColorStop(0, 'rgba(99,102,241,0.2)')
            glowGrad.addColorStop(1, 'rgba(99,102,241,0)')
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2)
            ctx.fillStyle = glowGrad
            ctx.fill()
        }

        // 2. Drop shadow
        ctx.shadowColor = col.stroke
        ctx.shadowBlur = isHov ? 20 : 10

        // 3. Main circle
        const grad = ctx.createRadialGradient(node.x - 6, node.y - 6, 2, node.x, node.y, r)
        grad.addColorStop(0, col.fill[0])
        grad.addColorStop(1, col.fill[1])
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // 4. Stroke ring
        ctx.shadowBlur = 0
        ctx.strokeStyle = isMatch && hasSearch ? '#34d399' : col.stroke
        ctx.lineWidth = (isHov || isSel) ? 2.5 : (isMatch && hasSearch) ? 2.5 : 1.5
        ctx.globalAlpha = alpha * ((isHov || isSel) ? 1 : 0.7)
        ctx.stroke()

        // 5. Shine highlight
        ctx.globalAlpha = alpha * 0.35
        const shine = ctx.createRadialGradient(node.x - 7, node.y - 7, 1, node.x - 4, node.y - 4, r * 0.7)
        shine.addColorStop(0, 'rgba(255,255,255,0.9)')
        shine.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = shine
        ctx.fill()

        // 6. Text label
        ctx.globalAlpha = alpha
        ctx.shadowBlur = 0
        ctx.fillStyle = 'white'
        const labelText = nodeLabels[id] ? nodeLabels[id].tag : String(id)
        const fontSize = labelText.length > 5 ? 10 : labelText.length > 3 ? 12 : 13
        ctx.font = `bold ${fontSize}px 'Inter', Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelText.slice(0, 6), node.x, node.y)

        // 7. Collapsed indicator (small "+" badge)
        if (isCollapsed) {
            const bx = node.x + r * 0.65
            const by = node.y - r * 0.65
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.arc(bx, by, 7, 0, Math.PI * 2)
            ctx.fillStyle = '#f59e0b'
            ctx.fill()
            ctx.fillStyle = '#000'
            ctx.font = 'bold 10px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('+', bx, by)
        }

        ctx.restore()
    }
}

// ── Helper: is this node hidden because an ancestor is collapsed? ────────────

function isHiddenByCollapse(id) {
    let cur = treeNodes[id]
    if (!cur) return false
    let pid = cur.parentId
    while (pid !== null && pid !== undefined) {
        if (collapsedNodes.has(pid)) return true
        const p = treeNodes[pid]
        if (!p) break
        pid = p.parentId
    }
    return false
}

// ── On-canvas tooltip (drawn in world space near hovered node) ───────────────

function drawTooltip() {
    if (hoveredNode === null || draggingNode !== null) return
    const node = nodes[hoveredNode]
    const nl = nodeLabels[hoveredNode]
    if (!node || !nl) return

    const lines = []
    lines.push(`<${nl.tag}>`)
    if (nl.info) lines.push(`"${nl.info.trim().slice(0, 40)}"`)
    const attrs = Object.entries(nl.map || {})
    for (const [k, v] of attrs.slice(0, 4)) {
        lines.push(`${k}="${v.slice(0, 20)}"`)
    }
    if (attrs.length > 4) lines.push(`… +${attrs.length - 4} more`)

    const path = getBreadcrumb(hoveredNode)
    if (path.length > 1) {
        lines.push('─'.repeat(14))
        lines.push(path.join(' › '))
    }

    ctx.save()
    ctx.font = '11px "Courier New", monospace'

    const padX = 12, padY = 8, lineH = 15
    let maxW = 0
    for (const l of lines) {
        const m = ctx.measureText(l).width
        if (m > maxW) maxW = m
    }
    const boxW = maxW + padX * 2
    const boxH = lines.length * lineH + padY * 2
    let tx = node.x + RADIUS + 14
    let ty = node.y - boxH / 2

    // Draw background
    ctx.globalAlpha = 0.92
    ctx.fillStyle = '#0f0f1a'
    ctx.strokeStyle = 'rgba(99,102,241,0.35)'
    ctx.lineWidth = 1

    const cr = 6
    ctx.beginPath()
    ctx.moveTo(tx + cr, ty)
    ctx.lineTo(tx + boxW - cr, ty)
    ctx.quadraticCurveTo(tx + boxW, ty, tx + boxW, ty + cr)
    ctx.lineTo(tx + boxW, ty + boxH - cr)
    ctx.quadraticCurveTo(tx + boxW, ty + boxH, tx + boxW - cr, ty + boxH)
    ctx.lineTo(tx + cr, ty + boxH)
    ctx.quadraticCurveTo(tx, ty + boxH, tx, ty + boxH - cr)
    ctx.lineTo(tx, ty + cr)
    ctx.quadraticCurveTo(tx, ty, tx + cr, ty)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Draw text lines
    ctx.globalAlpha = 1
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    for (let i = 0; i < lines.length; i++) {
        const isFirst = i === 0
        const isPath = i === lines.length - 1 && path.length > 1
        ctx.fillStyle = isFirst ? '#818cf8' : isPath ? '#475569' : '#94a3b8'
        ctx.fillText(lines[i], tx + padX, ty + padY + i * lineH)
    }
    ctx.restore()
}

// ── Breadcrumb: root → … → node ─────────────────────────────────────────────

function getBreadcrumb(id) {
    const path = []
    let cur = id
    while (cur !== null && cur !== undefined) {
        const nl = nodeLabels[cur]
        path.unshift(nl ? nl.tag : String(cur))
        const tn = treeNodes[cur]
        if (!tn) break
        cur = tn.parentId
    }
    return path
}
