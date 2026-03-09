// ─── draw.js ──────────────────────────────────────────────────────────────────
// Responsibilities:
//   draw()       — master draw call: clear → grid → edges → nodes
//   drawGrid()   — faint background dot-grid (respects pan/zoom)
//   drawEdges()  — animated gradient lines with hover glow
//   nodeColor()  — returns fill/stroke colors based on node type & hover state
//   drawNodes()  — layered circle rendering: glow → shadow → fill → shine → label

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
    for (let i = 0; i < edges.length; i++) {
        const [u, v] = edges[i]
        const a = nodes[u], b = nodes[v]
        if (!a || !b) continue

        // Sequential edge draw: edge i starts drawing when animProgress * total > i
        const edgeProg = Math.min(1, Math.max(0, animProgress * edges.length - i))
        const cx = a.x + (b.x - a.x) * edgeProg
        const cy = a.y + (b.y - a.y) * edgeProg

        const isHovered = hoveredNode === u || hoveredNode === v
        const isBackground = hoveredNode !== null && !isHovered

        ctx.save()
        ctx.globalAlpha = isBackground ? 0.2 : 1

        // Glow effect on hovered edges
        if (isHovered) {
            ctx.shadowColor = '#818cf8'
            ctx.shadowBlur = 12
        }

        // Gradient line: purple → blue
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

        // Animated glowing dot at the drawing front during intro animation
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
    if (id == hoveredNode) return { fill: ['#fbbf24', '#f59e0b'], stroke: '#fde68a' }
    if (t === 'root') return { fill: ['#7c3aed', '#4f46e5'], stroke: '#a78bfa' }
    if (t === 'leaf') return { fill: ['#059669', '#10b981'], stroke: '#6ee7b7' }
    return { fill: ['#0ea5e9', '#4f46e5'], stroke: '#93c5fd' }
}

// ── Nodes ────────────────────────────────────────────────────────────────────

function drawNodes() {
    for (let id of nodeList) {
        const node = nodes[id]
        if (!node) continue
        const alpha = nodeAlpha[id] || 0
        if (alpha <= 0) continue

        ctx.save()
        ctx.globalAlpha = alpha

        const col = nodeColor(id)
        const r = RADIUS
        const isHov = id == hoveredNode

        // 1. Outer glow ring
        if (isHov) {
            const glowGrad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 16)
            glowGrad.addColorStop(0, 'rgba(251,191,36,0.35)')
            glowGrad.addColorStop(1, 'rgba(251,191,36,0)')
            ctx.beginPath()
            ctx.arc(node.x, node.y, r + 16, 0, Math.PI * 2)
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

        // 3. Main circle (radial gradient fill)
        const grad = ctx.createRadialGradient(node.x - 6, node.y - 6, 2, node.x, node.y, r)
        grad.addColorStop(0, col.fill[0])
        grad.addColorStop(1, col.fill[1])
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // 4. Stroke ring
        ctx.shadowBlur = 0
        ctx.strokeStyle = col.stroke
        ctx.lineWidth = isHov ? 2.5 : 1.5
        ctx.globalAlpha = alpha * (isHov ? 1 : 0.7)
        ctx.stroke()

        // 5. Shine highlight (top-left specular)
        ctx.globalAlpha = alpha * 0.35
        const shine = ctx.createRadialGradient(node.x - 7, node.y - 7, 1, node.x - 4, node.y - 4, r * 0.7)
        shine.addColorStop(0, 'rgba(255,255,255,0.9)')
        shine.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = shine
        ctx.fill()

        // 6. Text label (show HTML tag name)
        ctx.globalAlpha = alpha
        ctx.shadowBlur = 0
        ctx.fillStyle = 'white'
        const labelText = nodeLabels[id] ? nodeLabels[id].tag : String(id)
        const fontSize = labelText.length > 5 ? 10 : labelText.length > 3 ? 12 : 13
        ctx.font = `bold ${fontSize}px 'Inter', Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelText.slice(0, 6), node.x, node.y)

        ctx.restore()
    }
}
