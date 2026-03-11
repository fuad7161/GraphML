// ─── context_menu.js ──────────────────────────────────────────────────────────
// Right-click context menu on graph nodes.
// Actions: Edit, Add Child, Collapse/Expand, Delete

function showContextMenu(x, y, nodeId) {
    const menu = document.getElementById('ctx-menu')
    if (!menu) return

    // Position at cursor
    menu.style.left = x + 'px'
    menu.style.top = y + 'px'
    menu.classList.add('visible')

    // Toggle collapse label
    const colBtn = document.getElementById('ctx-collapse')
    const tn = treeNodes[nodeId]
    const hasChildren = tn && tn.children && tn.children.length > 0
    if (colBtn) {
        colBtn.textContent = collapsedNodes.has(nodeId) ? '⊞ Expand Children' : '⊟ Collapse Children'
        colBtn.style.display = hasChildren ? '' : 'none'
    }

    // Disable delete on root
    const delBtn = document.getElementById('ctx-delete')
    if (delBtn) {
        delBtn.style.display = nodeId === rootNode ? 'none' : ''
    }
}

function hideContextMenu() {
    const menu = document.getElementById('ctx-menu')
    if (menu) menu.classList.remove('visible')
    ctxMenuNode = null
}

// ── Actions called from HTML ─────────────────────────────────────────────────

function ctxEdit() {
    if (ctxMenuNode !== null) openEditModal(ctxMenuNode)
    hideContextMenu()
}

function ctxAddChild() {
    if (ctxMenuNode !== null) addChildNode(ctxMenuNode)
    hideContextMenu()
}

function ctxCollapse() {
    if (ctxMenuNode !== null) toggleCollapse(ctxMenuNode)
    hideContextMenu()
}

function ctxDelete() {
    if (ctxMenuNode !== null && ctxMenuNode !== rootNode) {
        deleteNodeFromTree(ctxMenuNode)
        selectedNode = null
    }
    hideContextMenu()
}

// Close on outside click
document.addEventListener('click', e => {
    const menu = document.getElementById('ctx-menu')
    if (menu && !menu.contains(e.target)) {
        hideContextMenu()
    }
})
