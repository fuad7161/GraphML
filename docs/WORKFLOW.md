# Graph Visualizer — Code Workflow

## Project File Structure

```
HTML_Visualizer/
├── tree_visualizer.html   ← Page structure (HTML only)
├── WORKFLOW.md            ← This file
├── css/
│   ├── base.css           ← Font import, reset (*), body, scrollbar
│   ├── header.css         ← Top bar: logo, title, badge
│   ├── layout.css         ← .main flex row, .sidebar, .card panels
│   ├── sidebar.css        ← textarea, buttons, stats, legend, hints
│   ├── canvas.css         ← canvas element, overlay buttons, tooltip
│   └── statusbar.css      ← status bar, .dot-live, @keyframes pulse
└── js/
    ├── state.js           ← All global variables & canvas context
    ├── layout.js          ← Parsing, DFS layout, stats update
    ├── draw.js            ← All canvas drawing functions
    ├── viewport.js        ← Pan / zoom helpers
    ├── animation.js       ← Intro animation & continuous render loop
    └── interaction.js     ← Mouse events & app boot (buildTree call)
```

---

## CSS Load Order (in `tree_visualizer.html`)

CSS files are loaded in cascade order — later files can override earlier ones.

```
1. css/base.css       ← font import + * reset + body + scrollbar (foundation)
2. css/header.css     ← header, .logo, header h1, .badge
3. css/layout.css     ← .main, .sidebar, .card, .card h3
4. css/sidebar.css    ← textarea, buttons, stats, legend, .hint
5. css/canvas.css     ← canvas, .canvas-wrap, .canvas-overlay, .icon-btn, .tooltip
6. css/statusbar.css  ← .status-bar, .dot-live, @keyframes pulse
```

---

## Script Load Order (in `tree_visualizer.html`)

The browser loads these `<script>` tags **in sequence**, top to bottom.
Each file can safely use anything declared in files above it.

```
1. js/state.js        ← declares all shared variables (nodes, edges, scale…)
2. js/layout.js       ← uses state; defines buildTree / layoutTree / updateStats
3. js/draw.js         ← uses state; defines draw / drawGrid / drawEdges / drawNodes
4. js/viewport.js     ← uses state + draw(); defines resetView / zoomAt
5. js/animation.js    ← uses state + draw(); defines startAnimation, kicks off renderLoop
6. js/interaction.js  ← uses everything above; attaches mouse events; calls buildTree()
```

---

## High-Level Flow

```
User opens browser
        │
        ▼
tree_visualizer.html loads
        │
        ├── loads css/base.css         (reset + body foundation)
        ├── loads css/header.css       (top bar styles)
        ├── loads css/layout.css       (main layout + cards)
        ├── loads css/sidebar.css      (inputs, buttons, stats, legend)
        ├── loads css/canvas.css       (canvas + overlay buttons)
        ├── loads css/statusbar.css    (status bar + animations)
        ├── loads js/state.js          (global variables)
        ├── loads js/layout.js         (graph parsing & DFS)
        ├── loads js/draw.js           (canvas rendering)
        ├── loads js/viewport.js       (pan/zoom)
        ├── loads js/animation.js      (animation + renderLoop starts here)
        └── loads js/interaction.js    (mouse events + buildTree() called)
                │
                ▼
          buildTree()  ◄─── also triggered by "Visualize" button click
                │
        ┌───────┼───────────┐
        ▼       ▼           ▼
  layoutTree() updateStats() startAnimation()
        │                       │
        ▼                       ▼
  nodes get x,y          edges draw in   +  nodes fade in
  positions assigned     sequence (900ms)   (staggered, 60ms each)
                                │
                                ▼
                    renderLoop()  ← running since animation.js loaded
                                │
                                ▼
                             draw()
                          ┌────┼────┐
                          ▼    ▼    ▼
                      drawGrid drawEdges drawNodes
```

---

## Phase 1 — Global State (`js/state.js`)

All variables are declared here at the top level (no `const`/`let` scoping to a module),
so every other JS file can read and write them freely.

```
Canvas references:
    canvas   ← document.getElementById("canvas")
    ctx      ← canvas.getContext("2d")

Graph data:
    nodes    = {}    ← { id: { x, y, type, depth, targetX, targetY } }
    edges    = []    ← [ [u, v], ... ]  raw input order
    adj      = {}    ← { id: [neighbor, ...] }  adjacency list
    nodeList = []    ← node IDs in DFS traversal order
    rootNode = null  ← ID of the root node
    maxDepth = 0     ← deepest level in the tree

Animation:
    animProgress = 0      ← 0→1 controls how far edges are drawn
    nodeAlpha    = {}     ← { id: 0..1 } per-node fade-in alpha
    animFrame    = null   ← rAF handle so it can be cancelled
    animating    = false  ← true while intro is running

Viewport:
    scale   = 1           ← zoom multiplier
    offsetX = 0           ← pan X in screen pixels
    offsetY = 0           ← pan Y in screen pixels
    isPanning  = false
    panStart   = {x,y}
    panOrigin  = {x,y}

Interaction:
    draggingNode = null   ← ID of node being dragged, or null
    dragOffset   = {x,y} ← cursor offset from node center when drag started
    hoveredNode  = null   ← ID of node under cursor, or null

Constants:
    RADIUS = 22           ← node circle radius in world pixels
    particles = []        ← reserved for future particle effects
```

---

## Phase 2 — Parsing & Layout (`js/layout.js`)

### `buildTree()`
```
Called on page load (from interaction.js) and on "Visualize" button click.

1. Resets all shared state (nodes, edges, adj, nodeList, …)
2. Reads textarea value, splits into lines
3. For each line:
       parse "u v" → push [u,v] to edges[]
       push v into adj[u], push u into adj[v]  (undirected)
4. Guards: skip blank lines, skip non-numeric tokens
5. If no valid edges → return early (nothing to draw)
6. Calls → layoutTree()
         → updateStats()
         → startAnimation()
```

### `layoutTree()`
```
rootNode = edges[0][0]   ← first node mentioned is the root

DFS traversal from root:
    dfs(node, depth, parent)
        ├── adds node to levels[depth] array
        ├── pushes node into nodeList[]
        ├── tracks maxDepth
        └── recurses into neighbors, skipping parent (avoids cycles)

    Result: levels = { 0:[1], 1:[2,3], 2:[4,5], 3:[6,7] }

Position assignment per depth level:
    levelHeight = min(110px,  (canvasH - 100) / (maxDepth + 1))
    spacing     = canvasW / (nodesInLevel + 1)
    node.x      = spacing * (index + 1)       ← evenly spaced horizontally
    node.y      = 70 + depth * levelHeight    ← fixed vertical step

Node type classification (used by nodeColor() in draw.js):
    id === rootNode  → type = 'root'   → purple gradient
    degree === 1     → type = 'leaf'   → green gradient
    otherwise        → type = 'inner'  → blue gradient

Finally calls resetView() to auto-fit viewport.
```

### `updateStats()`
```
Counts nodeList.length, edges.length, maxDepth, leaf nodes
Writes values to #stat-nodes, #stat-edges, #stat-depth, #stat-leaves
```

---

## Phase 3 — Drawing (`js/draw.js`)

### `draw()` — master draw call
```
1. ctx.clearRect(0,0,W,H)                    ← wipe entire canvas
2. ctx.save()
3. ctx.translate(offsetX, offsetY)           ─┐ apply pan + zoom
4. ctx.scale(scale, scale)                   ─┘ transform
5. drawGrid()
6. drawEdges()
7. drawNodes()
8. ctx.restore()
```

### `drawGrid()`
```
Draws a faint white grid (opacity 0.025) every 50 world pixels.
Grid start position is offset-corrected so it moves with pan/zoom
without creating blank gaps at the edges.
```

### `drawEdges()`
```
For each edge [u,v] at index i:

    edgeProg = clamp(animProgress × totalEdges − i,  0, 1)
        → 0 = not drawn yet
        → 0.5 = halfway drawn
        → 1 = fully drawn

    endpoint (cx, cy) = lerp(a → b, edgeProg)

    Hover logic:
        isHovered    = edge touches hoveredNode  → bright, glowing
        isBackground = something is hovered but not this edge → alpha 0.2

    Gradient stroke: purple (#a78bfa / rgba(99,102,241))
                   → blue  (#60a5fa / rgba(56,189,248))

    During animation (edgeProg between 0–1):
        draw a small glowing purple dot at (cx, cy) — the "drawing tip"
```

### `nodeColor(id)`
```
Returns { fill:[color1, color2], stroke:color } based on:
    id == hoveredNode → amber/gold
    type === 'root'   → purple/indigo
    type === 'leaf'   → emerald green
    type === 'inner'  → sky blue/indigo
```

### `drawNodes()`
```
For each node id in nodeList (skips if alpha = 0):

    Layer 1: Outer glow ring
        hovered  → amber radial gradient, radius r+16
        default  → indigo radial gradient, radius r+10

    Layer 2: Drop shadow
        ctx.shadowColor = stroke color
        ctx.shadowBlur  = 20 (hovered) or 10 (normal)

    Layer 3: Main fill circle
        Radial gradient: lighter color at top-left (−6,−6),
                         darker color at edge

    Layer 4: Stroke ring
        Colored border, 2.5px hovered / 1.5px normal
        globalAlpha 1.0 hovered / 0.7 normal

    Layer 5: Shine highlight
        Small white radial gradient at top-left (35% opacity)
        Simulates a light reflection / specular highlight

    Layer 6: Text label
        White, bold, centered, 13px (or 11px for small nodes)
```

---

## Phase 4 — Viewport (`js/viewport.js`)

All node coordinates are in **world space**.
The canvas `translate + scale` transform converts them to **screen space**:

```
screenX = worldX × scale + offsetX
screenY = worldY × scale + offsetY
```

### `resetView()`
```
1. Compute bounding box: min/max of all node x and y values
2. Add RADIUS×2 padding on all sides
3. Compute scaleX = canvasW / bboxW,  scaleY = canvasH / bboxH
4. scale   = min(scaleX, scaleY, 1.4) × 0.88   ← 12% breathing room, cap at 140%
5. offsetX = canvasW/2 − scale × (minX + maxX)/2   ← centre horizontally
6. offsetY = canvasH/2 − scale × (minY + maxY)/2   ← centre vertically
7. Updates #zoom-label, calls draw()
```

### `zoomAt(factor)`
```
Zoom centered on the canvas center point (cx, cy):
    offsetX = cx − factor × (cx − offsetX)
    offsetY = cy − factor × (cy − offsetY)
    scale  *= factor
Updates #zoom-label, calls draw()

Called by the +/−/⤢ overlay buttons with factors 1.2 / 0.83 / fit-all
```

---

## Phase 5 — Animation (`js/animation.js`)

### `startAnimation()`
```
Cancels any running animFrame.
Sets animating = true,  animProgress = 0,  all nodeAlpha = 0.

Node fade-ins (parallel, staggered):
    nodeList.forEach((id, idx) => {
        setTimeout( delay = idx × 60ms ) {
            tick(): alpha += 0.06 per rAF frame  until alpha = 1
        }
    })

Edge draw (900ms, easeOutCubic):
    frame(now):
        t            = clamp((now − start) / 900, 0, 1)
        animProgress = easeOutCubic(t)
        draw()
        if t < 1 → request next frame
        else     → animating = false, final draw()
```

### `easeOutCubic(t)`
```
f(t) = 1 − (1−t)³

t=0 → 0  (start)        fast initial motion
t=1 → 1  (end)          decelerates smoothly to a stop
```

### `easeOutBack(t)` *(available, not currently used)*
```
f(t) = 1 + c3×(t−1)³ + c1×(t−1)²   where c1=1.70158, c3=2.70158
Produces a slight overshoot past 1, then settles back — "elastic" feel
```

### `renderLoop()`
```
Starts immediately when animation.js is parsed by the browser.
Runs every animation frame forever:

    if (!animating) draw()    ← when intro is done, keeps canvas live
    requestAnimationFrame(renderLoop)

During the intro animation, startAnimation's own frame() drives draw(),
so renderLoop skips to avoid double-drawing.
```

---

## Phase 6 — Interaction (`js/interaction.js`)

### Coordinate conversion

```
worldPos(e):
    rect = canvas.getBoundingClientRect()
    sx   = canvas.width  / rect.width    ← CSS pixel → canvas pixel ratio
    sy   = canvas.height / rect.height
    cx   = (e.clientX − rect.left) × sx
    cy   = (e.clientY − rect.top)  × sy
    return { x: (cx − offsetX) / scale,
             y: (cy − offsetY) / scale }
```

### Hit test

```
nodeAt(wx, wy):
    for each id in nodeList:
        distance = √( (node.x−wx)² + (node.y−wy)² )
        if distance ≤ RADIUS + 4 → return id   (4px forgiveness margin)
    return null
```

### Mouse event table

| Event | Condition | What happens |
|---|---|---|
| `mousedown` | hit a node | `draggingNode = id`, record `dragOffset` |
| `mousedown` | hit empty space | `isPanning = true`, record `panStart/panOrigin` |
| `mousemove` | `draggingNode !== null` | update `node.x/y` → `draw()` |
| `mousemove` | `isPanning` | update `offsetX/Y` → `draw()` |
| `mousemove` | neither | `nodeAt()` hit-test → update `hoveredNode` + status bar → `draw()` |
| `mouseup` | any | clear `draggingNode`, clear `isPanning` |
| `mouseleave` | any | clear drag/pan/hover → `draw()` |
| `wheel` | scroll up | zoom in ×1.1, centered on cursor |
| `wheel` | scroll down | zoom out ×0.91, centered on cursor |

### Boot
```
Last line of interaction.js:
    buildTree()   ← starts the whole pipeline on page load
```

---

## State Variables Reference

| Variable | File | Type | Purpose |
|---|---|---|---|
| `canvas` | state.js | Element | The `<canvas>` DOM element |
| `ctx` | state.js | CanvasRenderingContext2D | 2D drawing context |
| `nodes` | state.js | `{}` | `id → {x, y, type, depth, targetX, targetY}` |
| `edges` | state.js | `[]` | Raw `[u, v]` pairs in input order |
| `adj` | state.js | `{}` | Adjacency list `id → [neighbors]` |
| `nodeList` | state.js | `[]` | Node IDs in DFS order |
| `rootNode` | state.js | number | ID of root node |
| `maxDepth` | state.js | number | Deepest level in the tree |
| `animProgress` | state.js | 0–1 | Edge draw progress (driven by animation.js) |
| `nodeAlpha` | state.js | `{}` | `id → 0..1` fade-in alpha per node |
| `animFrame` | state.js | number | `requestAnimationFrame` handle |
| `animating` | state.js | bool | `true` during intro animation |
| `scale` | state.js | number | Zoom multiplier (1.0 = 100%) |
| `offsetX/Y` | state.js | number | Pan translation in screen pixels |
| `isPanning` | state.js | bool | `true` while dragging canvas background |
| `panStart` | state.js | `{x,y}` | Mouse position when pan began |
| `panOrigin` | state.js | `{x,y}` | `offsetX/Y` when pan began |
| `draggingNode` | state.js | id/null | Node being dragged, or `null` |
| `dragOffset` | state.js | `{x,y}` | Cursor offset from node center |
| `hoveredNode` | state.js | id/null | Node under cursor, or `null` |
| `RADIUS` | state.js | 22 | Node circle radius in world pixels |
| `particles` | state.js | `[]` | Reserved for future particle effects |

---

## CSS Architecture

```
css/base.css
├── @import         Google Fonts — Inter (300/400/500/600/700)
├── *               Universal reset: margin:0, padding:0, box-sizing:border-box
├── body            Dark #0f0f1a background, flex column, center-aligned
└── ::-webkit-scrollbar   Custom 6px dark scrollbar

css/header.css
├── header          Full-width flex bar, glass background, bottom border
├── .logo           36×36 purple-blue gradient hex icon
├── header h1       Gradient clip text (purple → blue)
└── .badge          Pill tag, purple tint, "INTERACTIVE" label

css/layout.css
├── .main           Flex row: sidebar (fixed) + canvas area (flex:1), max-width 1300px
├── .sidebar        270px fixed-width flex column of cards
├── .card           Glass-dark panel, border-radius 16px
└── .card h3        Uppercase section heading, muted color

css/sidebar.css
├── textarea        Monospace input, dark bg, purple focus ring + glow
├── textarea:focus  Purple border + box-shadow on keyboard focus
├── .btn-row        Flex row for button pair
├── button          Base button: rounded, Inter font, transitions
├── .btn-primary    Purple gradient + shadow; lifts on hover, resets on active
├── .btn-secondary  Ghost style; brightens on hover
├── .stats          2×2 CSS grid of stat boxes
├── .stat-box       Dark bg, centered content
├── .stat-box .val  Gradient number (large, bold)
├── .stat-box .lbl  Small muted label
├── .legend         Flex column of color-dot + label rows
├── .legend-item    Flex row, small text, muted color
├── .legend-dot     14×14 circle, used with inline background style
└── .hint           Tiny gray text for tips card

css/canvas.css
├── .canvas-wrap    position:relative container (needed for overlay positioning)
├── canvas          Radial+linear gradient bg, rounded 20px, grab cursor, box-shadow
├── canvas:active   Switches cursor to grabbing while panning
├── .canvas-overlay Absolute top-right flex row of icon buttons
├── .icon-btn       34×34 glass button; brightens on hover
└── .tooltip        Absolute hidden popup (purple border, dark bg)

css/statusbar.css
├── .status-bar     Full-width flex row, bottom padding, small muted text
├── .status-bar span  Flex row with gap for icon + text items
├── .dot-live       6px green circle with glow + pulse animation
└── @keyframes pulse  opacity 1 → 0.4 → 1 over 2s loop
```

---

## Full Data Flow

```
textarea input (raw text)
        │  buildTree() in layout.js
        ▼
edges[]  +  adj{}
        │  layoutTree() DFS
        ▼
nodeList[]  +  levels{}
        │  spacing math
        ▼
nodes{}  { x, y, type, depth }
        │  resetView() in viewport.js
        ▼
scale, offsetX, offsetY
        │  startAnimation() in animation.js
        ▼
animProgress 0→1 (900ms)  +  nodeAlpha{} 0→1 per node (staggered)
        │  draw() called every rAF frame
        ▼
  draw() in draw.js
    ├── drawGrid()   → faint background grid
    ├── drawEdges()  → gradient lines, traveling dot, hover glow
    └── drawNodes()  → 6-layer circle: glow/shadow/fill/stroke/shine/label
        │
        ▼
Canvas 2D output  →  user sees animated graph
        │  mouse events in interaction.js
        ▼
worldPos(e) converts screen → world coords
nodeAt(wx,wy) hit-tests nodes
        │
        ├── drag node    → update nodes[id].x/y → draw()
        ├── pan canvas   → update offsetX/Y → draw()
        ├── hover node   → update hoveredNode → draw()  (glow + dim effect)
        └── scroll zoom  → update scale + offset → draw()
```
