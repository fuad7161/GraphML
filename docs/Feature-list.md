## Feature List

### ✅ Implemented

- [x] Parse HTML and generate interactive tree graph
- [x] Search nodes by tag/content/attributes
- [x] Edit node by double-clicking
- [x] Smart edit modal
    - [x] Change tag
    - [x] Edit/add/remove attributes
    - [x] Edit text content (when valid)
- [x] Node context menu (right-click)
    - [x] Add child
    - [x] Edit node
    - [x] Collapse / Expand children
    - [x] Delete node
- [x] Node action card for hover/tap (mobile-friendly quick actions)
    - [x] Add
    - [x] Edit
    - [x] Collapse / Expand
    - [x] Delete
- [x] Generate HTML from graph state
- [x] Output tools
    - [x] Copy generated HTML
    - [x] Download generated HTML file
    - [x] Clear output panel
- [x] Live preview iframe
    - [x] Open preview
    - [x] Refresh preview
    - [x] Expand / collapse preview size
- [x] Canvas navigation
    - [x] Pan (drag)
    - [x] Zoom (wheel + overlay controls)
    - [x] Fit/reset view
- [x] Stats panel (Nodes, Edges, Depth, Leaves)
- [x] Popup sidebar drawer (does not resize canvas)
- [x] Theme toggle (Night/Light), default Night, persisted in localStorage
- [x] Floating page scroll helper button (toggles up/down)
- [x] Responsive UI for desktop/tablet/mobile

### 🚧 TODO / Upcoming

- [ ] Upload `.html` file and auto-load into editor
- [ ] Save & load project state (JSON snapshot)
- [ ] Undo / Redo stack for node operations
- [ ] Better large-tree performance mode
    - [ ] Level-of-detail rendering for huge graphs
    - [ ] Optional virtualized/minimap navigation
- [ ] Export canvas as image (PNG/SVG)
- [ ] Touch gestures (pinch zoom, two-finger pan)
- [ ] Keyboard-first node navigation (arrow keys + focus ring)
- [ ] Accessibility pass
    - [ ] Improve ARIA labels for dynamic controls
    - [ ] Full keyboard support for node action card
- [ ] Advanced collapse modes
    - [ ] Expand only first child chain
    - [ ] Expand by level depth
- [ ] Built-in examples gallery (starter templates)
- [ ] Optional auto-layout presets (compact / wide / balanced)
