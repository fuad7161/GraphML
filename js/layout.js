// ─── layout.js ────────────────────────────────────────────────────────────────
// Responsibilities:
//   buildTree()   — parse textarea input, build edges & adjacency list
//   layoutTree()  — assign x/y positions via DFS level-grouping
//   updateStats() — push node/edge/depth/leaf counts to the sidebar

function buildTree() {
    // Reset all state before rebuilding
    nodes = {}
    edges = []
    adj = {}
    nodeList = []
    particles = []
    animProgress = 0
    nodeAlpha = {}

    const text = document.getElementById("input").value.trim()
    const lines = text.split("\n").filter(l => l.trim())

    for (let line of lines) {
        const parts = line.trim().split(/\s+/).map(Number)
        if (parts.length < 2 || parts.some(isNaN)) continue

        const [u, v] = parts
        edges.push([u, v])

        if (!adj[u]) adj[u] = []
        if (!adj[v]) adj[v] = []
        adj[u].push(v)
        adj[v].push(u)   // undirected graph
    }

    if (edges.length === 0) return

    layoutTree()
    updateStats()
    startAnimation()
}

function layoutTree() {
    rootNode = edges[0][0]
    const levels = {}   // { depth: [nodeId, ...] }
    maxDepth = 0

    // DFS to group nodes by depth
    function dfs(node, depth, parent) {
        if (!levels[depth]) levels[depth] = []
        levels[depth].push(node)
        nodeList.push(node)
        if (depth > maxDepth) maxDepth = depth

        for (let next of adj[node]) {
            if (next === parent) continue   // skip parent to avoid cycles
            dfs(next, depth + 1, node)
        }
    }
    dfs(rootNode, 0, -1)

    // Assign x/y: nodes at each level are evenly spaced horizontally
    const W = canvas.width
    const H = canvas.height
    const levelHeight = Math.min(110, (H - 100) / (maxDepth + 1))

    for (let depth in levels) {
        const arr = levels[depth]
        const spacing = W / (arr.length + 1)

        arr.forEach((node, i) => {
            nodes[node] = {
                x: spacing * (i + 1),
                y: 70 + Number(depth) * levelHeight,
                depth: Number(depth),
                targetX: spacing * (i + 1),
                targetY: 70 + Number(depth) * levelHeight
            }
            nodeAlpha[node] = 0
        })
    }

    // Classify each node: root / leaf / inner
    for (let id of nodeList) {
        const deg = (adj[id] || []).length
        if (id === rootNode) nodes[id].type = 'root'
        else if (deg === 1) nodes[id].type = 'leaf'
        else nodes[id].type = 'inner'
    }

    resetView()   // auto-fit all nodes into the canvas viewport
}

function updateStats() {
    const leaves = nodeList.filter(n => nodes[n] && nodes[n].type === 'leaf').length
    document.getElementById('stat-nodes').textContent = nodeList.length
    document.getElementById('stat-edges').textContent = edges.length
    document.getElementById('stat-depth').textContent = maxDepth
    document.getElementById('stat-leaves').textContent = leaves
}
