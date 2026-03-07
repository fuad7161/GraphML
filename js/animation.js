// ─── animation.js ────────────────────────────────────────────────────────────
// Responsibilities:
//   startAnimation() — kick off the intro: edges draw in sequence, nodes fade in
//   easeOutCubic()   — smooth deceleration curve used for edge drawing
//   easeOutBack()    — overshoot bounce curve (available for future use)
//   renderLoop()     — continuous rAF loop that redraws on every frame

function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame)
    animating = true
    animProgress = 0

    // Reset all node alphas to 0 (invisible)
    for (let id of nodeList) nodeAlpha[id] = 0

    // Stagger each node's fade-in by 60ms per index
    nodeList.forEach((id, idx) => {
        setTimeout(() => {
            let a = 0
            const tick = () => {
                a = Math.min(1, a + 0.06)
                nodeAlpha[id] = a
                if (a < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
        }, idx * 60)
    })

    // Edge draw: animProgress goes 0 → 1 over 900ms
    const dur = 900
    const start = performance.now()

    function frame(now) {
        const t = Math.min((now - start) / dur, 1)
        animProgress = easeOutCubic(t)
        draw()
        if (t < 1) {
            animFrame = requestAnimationFrame(frame)
        } else {
            animating = false
            draw()
        }
    }
    animFrame = requestAnimationFrame(frame)
}

// Smooth deceleration: fast at start, slows to a stop
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}

// Slight overshoot bounce (available for future use)
function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// ── Continuous render loop ───────────────────────────────────────────────────
// Runs forever. When intro animation is done, it keeps the canvas alive
// so hover/drag effects render in real time.

function renderLoop() {
    if (!animating) draw()
    requestAnimationFrame(renderLoop)
}
requestAnimationFrame(renderLoop)
