function parseAttributes(str) {
    const attrs = {};
    const regex = /([a-zA-Z0-9:-]+)="([^"]*)"/g;

    let match;

    while ((match = regex.exec(str))) {
        attrs[match[1]] = match[2];
    }

    return attrs;
}

function parseHTML(html) {

    const tokens = html.match(/<\/?[^>]+>|[^<]+/g);

    const stack = [];
    let root = null;
    let nodeId = 0;

    for (let token of tokens) {

        token = token.trim();
        if (!token) continue;

        // END TAG
        if (token.startsWith("</")) {
            stack.pop();
            continue;
        }

        // START TAG
        if (token.startsWith("<")) {

            const tagContent = token.slice(1, -1).trim();
            const parts = tagContent.split(/\s+/);

            const tagName = parts[0];
            const attrs = parseAttributes(tagContent);

            const node = {
                id: ++nodeId,
                tag: tagName,
                map: attrs,
                info: "",
                children: []
            };

            if (!root) root = node;

            if (stack.length) {
                stack[stack.length - 1].children.push(node);
            }

            // self closing tags
            const selfClosing = token.endsWith("/>") || ["img", "br", "hr", "input", "meta", "link"].includes(tagName);

            if (!selfClosing) {
                stack.push(node);
            }

            continue;
        }

        // TEXT NODE
        if (stack.length) {
            const current = stack[stack.length - 1];
            current.info += (current.info ? " " : "") + token;
        }
    }

    return root;
}

// ─── htmlToEdges ─────────────────────────────────────────────────────────────
// Converts a parsed HTML tree into a flat edge list and a node label map.
// Returns: { edges: [[parentId, childId], ...], nodeLabels: { id: {tag, info} }, rootId }

function htmlToEdges(html) {
    const root = parseHTML(html);
    if (!root) return { edges: [], nodeLabels: {}, rootId: null, treeNodes: {} };

    const edges = [];
    const nodeLabels = {};
    const treeNodes = {};   // { id: { tag, map, info, children:[id,…], parentId } }

    function traverse(node, parentId) {
        nodeLabels[node.id] = { tag: node.tag, info: node.info, map: { ...node.map } };
        treeNodes[node.id] = {
            tag: node.tag,
            map: { ...node.map },
            info: node.info,
            children: node.children.map(c => c.id),
            parentId: parentId
        };
        for (const child of node.children) {
            edges.push([node.id, child.id]);
            traverse(child, node.id);
        }
    }
    traverse(root, null);

    return { edges, nodeLabels, rootId: root.id, treeNodes };
}