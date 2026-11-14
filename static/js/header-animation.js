import * as mosaic from './header-mosaic.js'

;(function () {
  /** Play the selected mosaic without scheduling work between its discrete steps. */
  function initHeaderAnimation(root, { durationMs = 24000, steps = 64 } = {}) {
    if (!root || root.hasAttribute('data-initialized')) return
    root.setAttribute('data-initialized', '')
    if (
      typeof window.matchMedia !== 'function' ||
      typeof window.performance?.now !== 'function' ||
      typeof IntersectionObserver !== 'function' ||
      window.location.hash
    ) return

    const control = root.querySelector('.header-animation-control')
    const sections = [...root.querySelectorAll('.header-animation-art path[data-section]')].map(path => ({
      path, section: Number(path.dataset.section),
    }))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const printMedia = window.matchMedia('print')
    const stepMs = durationMs / steps
    let manualPauseFlag = false
    let onScreenFlag = false
    let pageHiddenFlag = false
    let elapsedMs = 0
    let startedAt = null
    let timerId = null

    const observer = new IntersectionObserver(entries => {
      onScreenFlag = entries[entries.length - 1].isIntersecting
      updatePlayback()
    })
    observer.observe(root)
    document.addEventListener('visibilitychange', updatePlayback)
    reducedMotion.addEventListener('change', updatePlayback)
    printMedia.addEventListener('change', updatePlayback)
    window.addEventListener('pagehide', () => {
      pageHiddenFlag = true
      updatePlayback()
    })
    window.addEventListener('pageshow', () => {
      pageHiddenFlag = false
      updatePlayback()
    })
    control.addEventListener('click', () => {
      if (reducedMotion.matches) return
      manualPauseFlag = !manualPauseFlag
      updatePlayback()
    })
    control.hidden = false
    updatePlayback()

    function updatePlayback() {
      const action = manualPauseFlag ? 'Resume' : 'Pause'
      control.textContent = reducedMotion.matches ? 'Motion off' : action
      control.setAttribute('aria-label', reducedMotion.matches
        ? 'Header animation disabled for reduced motion' : `${action} header animation`)
      if (reducedMotion.matches) control.setAttribute('aria-disabled', 'true')
      else control.removeAttribute('aria-disabled')

      if (!canPlayHeaderAnimation({
        manualPauseFlag, onScreenFlag, pageHiddenFlag,
        tabHiddenFlag: document.hidden,
        reducedMotionFlag: reducedMotion.matches,
        printingFlag: printMedia.matches,
      })) {
        pausePlayback()
        return
      }
      if (startedAt !== null) return
      startedAt = window.performance.now()
      renderStep()
    }

    function pausePlayback() {
      if (startedAt !== null) {
        elapsedMs = (elapsedMs + window.performance.now() - startedAt) % durationMs
        startedAt = null
      }
      if (timerId !== null) window.clearTimeout(timerId)
      timerId = null
    }

    function renderStep() {
      timerId = null
      if (startedAt === null) return
      const currentTime = (elapsedMs + window.performance.now() - startedAt) % durationMs
      const phase = Math.floor(currentTime / stepMs) / steps * 2 * Math.PI
      for (const { path, section } of sections) {
        const shape = mosaic.createSectionPath(section, phase)
        if (path.getAttribute('d') !== shape) path.setAttribute('d', shape)
      }
      timerId = window.setTimeout(renderStep, Math.ceil(stepMs - currentTime % stepMs))
    }
  }

  /** Decide whether playback can advance without reading the DOM. */
  function canPlayHeaderAnimation({ manualPauseFlag, onScreenFlag, pageHiddenFlag, tabHiddenFlag, reducedMotionFlag, printingFlag }) {
    return onScreenFlag && !manualPauseFlag && !pageHiddenFlag && !tabHiddenFlag && !reducedMotionFlag && !printingFlag
  }

  initHeaderAnimation(document.querySelector('.header-animation'))
})()
