// ─── Canvas ───────────────────────────────────────────────────────────────────
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// ─── Graph data ───────────────────────────────────────────────────────────────
let nodes = {}      // { id: { x, y, type, depth, targetX, targetY } }
let edges = []      // [ [u, v], ... ]
let adj = {}        // { id: [neighbor, ...] }
let nodeList = []   // ordered list of node IDs (DFS order)
let rootNode = null
let maxDepth = 0

const RADIUS = 22   // node circle radius in world pixels

// ─── Animation state ──────────────────────────────────────────────────────────
let animProgress = 0    // 0 → 1, controls how far edges are drawn
let nodeAlpha = {}      // { id: 0..1 } per-node fade-in alpha
let animFrame = null    // requestAnimationFrame handle
let animating = false   // true while intro animation is running

// ─── Viewport transform ───────────────────────────────────────────────────────
let scale = 1
let offsetX = 0
let offsetY = 0
let isPanning = false
let panStart = { x: 0, y: 0 }
let panOrigin = { x: 0, y: 0 }

// ─── Node dragging ────────────────────────────────────────────────────────────
let draggingNode = null
let dragOffset = { x: 0, y: 0 }

// ─── Hover state ──────────────────────────────────────────────────────────────
let hoveredNode = null

// ─── Particle system (reserved) ───────────────────────────────────────────────
let particles = []
