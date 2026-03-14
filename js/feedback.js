// ─── feedback.js ────────────────────────────────────────────────────────────
// Feedback form submit flow.
// Uses local backend endpoint that stores feedback in MongoDB.

const IS_LOCAL_HOST = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const GITHUB_PAGES_API_URL = 'https://YOUR_BACKEND_DOMAIN/api/feedback'
const FEEDBACK_ENDPOINT = IS_LOCAL_HOST
    ? 'http://localhost:3000/api/feedback'
    : (window.FEEDBACK_API_URL || GITHUB_PAGES_API_URL)

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal')
    const status = document.getElementById('feedback-status')
    if (!modal) return
    modal.classList.add('open')
    if (status) {
        status.textContent = ''
        status.className = 'feedback-status'
    }
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal')
    if (modal) modal.classList.remove('open')
}

async function submitFeedback(event) {
    event.preventDefault()

    const name = document.getElementById('fb-name')?.value.trim() || ''
    const email = document.getElementById('fb-email')?.value.trim() || ''
    const message = document.getElementById('fb-message')?.value.trim() || ''
    const status = document.getElementById('feedback-status')
    const submitBtn = document.getElementById('feedback-submit-btn')

    if (!message) {
        if (status) {
            status.textContent = 'Please write feedback before submitting.'
            status.className = 'feedback-status error'
        }
        return
    }

    if (FEEDBACK_ENDPOINT.includes('YOUR_BACKEND_DOMAIN')) {
        if (status) {
            status.textContent = 'Production feedback API is not configured yet.'
            status.className = 'feedback-status error'
        }
        return
    }

    const payload = {
        name,
        email,
        message,
        page: 'HTML Visualizer',
        userAgent: navigator.userAgent,
        submittedAt: new Date().toISOString()
    }

    try {
        if (submitBtn) submitBtn.disabled = true
        if (status) {
            status.textContent = 'Submitting...'
            status.className = 'feedback-status'
        }

        const res = await fetch(FEEDBACK_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!res.ok) throw new Error('Submit failed')

        if (status) {
            status.textContent = 'Thanks! Your feedback was submitted.'
            status.className = 'feedback-status success'
        }

        const form = document.getElementById('feedback-form')
        if (form) form.reset()

        setTimeout(() => {
            closeFeedbackModal()
        }, 900)
    } catch (err) {
        if (status) {
            status.textContent = 'Could not submit feedback. Please try again.'
            status.className = 'feedback-status error'
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false
    }
}

// Close feedback modal when clicking outside
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('feedback-modal')
    if (!overlay || !overlay.classList.contains('open')) return
    if (e.target === overlay) closeFeedbackModal()
})

// Escape closes feedback modal too
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFeedbackModal()
})
