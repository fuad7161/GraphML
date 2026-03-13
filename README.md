# &lt;/&gt; HTML Visualizer

HTML Visualizer is a browser-based tool that converts raw HTML into an interactive DOM tree on canvas.

Paste HTML, visualize structure, edit nodes, regenerate markup, and preview output — all in one page.

---

## ✨ Full Feature List

### 1) Parse & Visualize DOM
- Paste HTML in the sidebar and click **Visualize**
- Builds a node-edge DOM tree on HTML Canvas
- Animated rendering for edges and nodes
- Auto-layout with depth-based spacing

### 2) Canvas Interaction
- **Pan:** click + drag
- **Zoom:** mouse wheel or `+ / −` overlay buttons
- **Fit view:** `⤢` button or Reset flow
- Smooth viewport transforms and redraw

### 3) Search
- Search input at canvas top-left
- Filters by tag/text/attributes
- Matching nodes highlighted, others dimmed
- Keyboard shortcut: **Ctrl+F**

### 4) Node Editing (Smart Modal)
- Double-click a node to open editor
- Tag dropdown grouped by HTML categories
- Attribute key picker (global + tag-specific)
- Add/remove attributes dynamically
- Text field auto-hidden for non-text tags

### 5) Node Operations (Desktop + Mobile Friendly)

#### Right-click Context Menu (Desktop)
- **Edit Node**
- **Add Child**
- **Collapse / Expand Children**
- **Delete Node**

#### Node Action Card (Hover / Tap)
- Shows node info card with quick actions
- 4 action icons:
	- ➕ Add child
	- ✏️ Edit
	- ⊟/⊞ Collapse/Expand
	- 🗑️ Delete
- Works as touch-friendly operation panel on mobile

### 6) Collapse / Expand Subtrees
- Collapse children of any node
- Expand back instantly
- Hidden subtree logic respected in render/search flow

### 7) HTML Generation
- Generate clean, indented HTML from current tree
- Copy generated HTML to clipboard
- Download generated output as `.html`
- Clear generated output panel

### 8) Live Preview
- Open iframe preview of generated HTML
- Refresh preview after changes
- Expand/collapse preview size
- Close preview panel

### 9) Sidebar Drawer
- Left popup sidebar (does not resize canvas)
- Open/close from top-left navbar menu icon
- Backdrop click closes sidebar
- **Escape** key closes sidebar

### 10) Theme Toggle
- Top-right navbar button toggles **Night / Light** mode
- Default is **Night mode**
- Theme is saved in `localStorage`

### 11) Fixed Scroll Helper Button
- Bottom-right floating button
- Toggles direction each click:
	- Go to bottom
	- Go to top

### 12) Status & Stats
- Status bar shows readiness, zoom percent, hover path
- Stats panel includes:
	- Nodes
	- Edges
	- Depth
	- Leaves

### 13) Keyboard Shortcuts
- **Ctrl+F**: focus search
- **Delete / Backspace**: delete selected non-root node
- **Escape**: dismiss overlay-style UI (sidebar/menu states)

### 14) Mobile Responsiveness
- Optimized layout for phone/tablet/desktop
- Responsive sidebar drawer sizing
- Responsive node action card and controls
- Touch-friendly UI for node operations

---

## 🧩 Project Structure

- `index.html` — UI structure and script wiring
- `css/` — modular styling (`base`, `header`, `layout`, `sidebar`, `canvas`, `statusbar`, `modal`)
- `js/` — feature modules:
	- `html_parse.js`
	- `layout.js`
	- `draw.js`
	- `viewport.js`
	- `interaction.js`
	- `context_menu.js`
	- `editor.js`
	- `generate.js`
	- `search.js`
	- `animation.js`
	- `theme.js`
	- `state.js`

---

## ▶️ Run

Just open [index.html](index.html) in a browser.

No build step required.

---

## 📄 License

This project is open source. Feel free to use, modify, and share.
