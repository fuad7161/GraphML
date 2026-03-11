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
    nodeLabels = {}
    treeNodes = {}
    particles = []
    animProgress = 0
    nodeAlpha = {}
    selectedNode = null
    collapsedNodes = new Set()
    searchQuery = ''
    matchedNodes = new Set()
    const si = document.getElementById('search-input')
    if (si) si.value = ''

    const text = document.getElementById("input").value.trim()
    if (!text) return

    // Parse the HTML input into an edge list + label map
    const result = htmlToEdges(text)
    if (!result.rootId) return

    edges = result.edges
    Object.assign(nodeLabels, result.nodeLabels)
    Object.assign(treeNodes, result.treeNodes)

    // Build undirected adjacency list from parent→child edges
    for (const [u, v] of edges) {
        if (!adj[u]) adj[u] = []
        if (!adj[v]) adj[v] = []
        adj[u].push(v)
        adj[v].push(u)
    }

    layoutTree(result.rootId)
    updateStats()
    startAnimation()
}

function layoutTree(startRoot) {
    rootNode = startRoot !== undefined ? startRoot : edges[0][0]
    const levels = {}   // { depth: [nodeId, ...] }
    maxDepth = 0

    // DFS to group nodes by depth
    function dfs(node, depth, parent) {
        if (!levels[depth]) levels[depth] = []
        levels[depth].push(node)
        nodeList.push(node)
        if (depth > maxDepth) maxDepth = depth

        for (let next of (adj[node] || [])) {
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

// ── Add a new child node under a given parent ────────────────────────────────

let _nextNodeId = 0   // auto-incremented; initialised on build

function _maxNodeId() {
    let mx = 0
    for (const id of nodeList) if (Number(id) > mx) mx = Number(id)
    return mx
}

function addChildNode(parentId) {
    if (!_nextNodeId) _nextNodeId = _maxNodeId()
    const newId = ++_nextNodeId

    // Data model
    nodeLabels[newId] = { tag: 'div', info: '', map: {} }
    treeNodes[newId] = { tag: 'div', map: {}, info: '', children: [], parentId: parentId }
    treeNodes[parentId].children.push(newId)

    // Edge + adjacency
    edges.push([parentId, newId])
    if (!adj[parentId]) adj[parentId] = []
    adj[parentId].push(newId)
    adj[newId] = [parentId]

    // Layout: place near parent
    const p = nodes[parentId]
    nodes[newId] = {
        x: p.x + (Math.random() - 0.5) * 80,
        y: p.y + 80,
        depth: p.depth + 1,
        targetX: p.x,
        targetY: p.y + 80,
        type: 'leaf'
    }
    nodeList.push(newId)
    nodeAlpha[newId] = 1

    // Parent is no longer a leaf
    if (nodes[parentId].type === 'leaf') nodes[parentId].type = 'inner'

    // Un-collapse parent if it was collapsed
    collapsedNodes.delete(parentId)

    updateStats()
    draw()

    // Immediately open editor for the new node
    openEditModal(newId)
}

// ── Delete a node (and its subtree) from the tree ────────────────────────────

function deleteNodeFromTree(id) {
    if (id === rootNode) return   // can't delete root

    const tn = treeNodes[id]
    if (!tn) return

    // Collect all descendants (BFS)
    const toRemove = new Set()
    const queue = [id]
    while (queue.length) {
        const cur = queue.shift()
        toRemove.add(cur)
        const ch = treeNodes[cur] ? treeNodes[cur].children : []
        for (const c of ch) queue.push(c)
    }

    // Remove from parent's children list
    const parentId = tn.parentId
    if (parentId !== null && treeNodes[parentId]) {
        treeNodes[parentId].children = treeNodes[parentId].children.filter(c => c !== id)
    }

    // Clean up data structures
    for (const rid of toRemove) {
        delete nodeLabels[rid]
        delete treeNodes[rid]
        delete nodes[rid]
        delete nodeAlpha[rid]
        collapsedNodes.delete(rid)
    }
    edges = edges.filter(([u, v]) => !toRemove.has(u) && !toRemove.has(v))
    nodeList = nodeList.filter(n => !toRemove.has(n))

    // Rebuild adjacency
    adj = {}
    for (const [u, v] of edges) {
        if (!adj[u]) adj[u] = []
        if (!adj[v]) adj[v] = []
        adj[u].push(v)
        adj[v].push(u)
    }

    // If parent becomes a leaf
    if (parentId !== null && treeNodes[parentId] && treeNodes[parentId].children.length === 0) {
        nodes[parentId].type = 'leaf'
    }

    updateStats()
    draw()
}

// ── Toggle collapse / expand a subtree ───────────────────────────────────────

function toggleCollapse(id) {
    if (collapsedNodes.has(id)) {
        collapsedNodes.delete(id)
    } else {
        collapsedNodes.add(id)
    }
    draw()
}
