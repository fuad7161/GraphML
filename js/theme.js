// ─── theme.js ───────────────────────────────────────────────────────────────
// Light / Night mode toggle. Default is night mode.

const THEME_KEY = 'html-visualizer-theme'

function applyTheme(theme) {
    const isLight = theme === 'light'
    document.body.classList.toggle('light-mode', isLight)

    const btn = document.getElementById('theme-toggle')
    if (!btn) return

    if (isLight) {
        btn.textContent = '🌙'
        btn.title = 'Switch to night mode'
        btn.setAttribute('aria-label', 'Switch to night mode')
    } else {
        btn.textContent = '☀️'
        btn.title = 'Switch to light mode'
        btn.setAttribute('aria-label', 'Switch to light mode')
    }
}

function toggleTheme() {
    const isLightNow = document.body.classList.contains('light-mode')
    const nextTheme = isLightNow ? 'dark' : 'light'
    applyTheme(nextTheme)
    localStorage.setItem(THEME_KEY, nextTheme)
}

window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(THEME_KEY)
    // Default is dark/night mode
    applyTheme(saved === 'light' ? 'light' : 'dark')
})
