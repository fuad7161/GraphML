# &lt;/&gt; HTML Visualizer

A browser-based tool that turns raw HTML into an interactive tree graph on a canvas. Paste any HTML snippet, instantly see its DOM structure as nodes and edges, then edit, search, and regenerate clean HTML — all without leaving the page.

---

## ✨ Features

<details>
<summary>🌳 Parse & Visualize</summary>

Paste HTML into the sidebar and hit **Visualize**. The parser tokenizes your markup and renders a tree graph on an HTML Canvas with animated node and edge drawing.
</details>

<details>
<summary>🔍 Search Nodes</summary>

Use the search bar (or `Ctrl+F`) to find nodes by tag name, text content, or attribute values. Matching nodes are highlighted while the rest dim out.
</details>

<details>
<summary>✏️ Edit Any Node</summary>

Double-click a node to open the smart editor modal:
- **Tag name** — grouped dropdown (Sections, Headings, Text, Forms, Media, etc.)
- **Attributes** — key dropdown pre-filled with global + tag-specific attributes
- **Text content** — conditionally shown (hidden for void & container-only elements)
</details>

<details>
<summary>📋 Right-Click Context Menu</summary>

Right-click a node for quick actions:
- **Add Child** — inserts a new child node and opens the editor
- **Edit Node** — opens the edit modal
- **Collapse / Expand** — hide or show the subtree
- **Delete Node** — removes the node and its entire subtree
</details>

<details>
<summary>📝 Generate HTML</summary>

Reconstructs clean, properly indented HTML from the current tree state. Copy to clipboard or download as an `.html` file — every edit you made is reflected.
</details>

<details>
<summary>👁️ Live Preview</summary>

Click **Preview** to render the generated HTML inside an embedded iframe. Refresh any time after edits to see the updated page, and expand/collapse the preview panel as needed.
</details>

<details>
<summary>🧭 Navigation & Interaction</summary>

- **Pan** — click and drag the canvas
- **Zoom** — scroll wheel or use the `+` / `−` buttons
- **Fit View** — auto-fit all nodes into the viewport
- **Breadcrumb Path** — hover a node to see its full path in the status bar
- **Tooltip** — on-canvas tooltip shows tag, attributes, and text at a glance
- **Keyboard Shortcuts** — `Delete` to remove, `Ctrl+F` to search, `Escape` to dismiss
</details>

<details>
<summary>📊 Stats Panel</summary>

Live counts of **Nodes**, **Edges**, **Depth**, and **Leaves** update as you modify the tree.
</details>

<details>
<summary>↔️ Collapsible Sidebar</summary>

Toggle the sidebar open/closed to give the canvas full width when you need more room to explore large trees.
</details>

---

## 📄 License

This project is open source. Feel free to use, modify, and share.
