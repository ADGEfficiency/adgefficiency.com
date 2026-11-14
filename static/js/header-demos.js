;(function () {
  /** Run only the visible, unpaused previews, at no more than 30 frames per second. */
  function initHeaderDemos(root, { frameIntervalMs = 1000 / 30 } = {}) {
    if (!root || root.hasAttribute('data-initialized')) return
    root.setAttribute('data-initialized', '')
    if (
      typeof window.matchMedia !== 'function' ||
      typeof window.requestAnimationFrame !== 'function' ||
      typeof window.cancelAnimationFrame !== 'function' ||
      typeof IntersectionObserver !== 'function'
    ) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const printMedia = window.matchMedia('print')
    const states = [...root.querySelectorAll('[data-demo]')].map(createHeaderDemo)
    const byArt = new Map(states.map(state => [state.art, state]))
    let pageHiddenFlag = false
    let frameId = null

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        byArt.get(entry.target).onScreenFlag = entry.isIntersecting
      }
      updatePlayback()
    })

    for (const state of states) {
      observer.observe(state.art)
      state.control.hidden = false
      state.control.addEventListener('click', () => {
        if (reducedMotion.matches) return
        state.manualPauseFlag = !state.manualPauseFlag
        updatePlayback()
      })
    }
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
    updatePlayback()

    function canPlay(state) {
      return state.onScreenFlag && !state.manualPauseFlag && !document.hidden &&
        !pageHiddenFlag && !reducedMotion.matches && !printMedia.matches
    }

    function updatePlayback() {
      for (const state of states) {
        if (!canPlay(state)) state.lastTimestamp = null
        const action = state.manualPauseFlag ? 'Resume' : 'Pause'
        state.control.textContent = reducedMotion.matches ? 'Motion off' : action
        state.control.setAttribute('aria-label', reducedMotion.matches
          ? `Motion disabled for ${state.label}` : `${action} ${state.label}`)
        if (reducedMotion.matches) state.control.setAttribute('aria-disabled', 'true')
        else state.control.removeAttribute('aria-disabled')
      }
      const activeFlag = states.some(canPlay)
      if (activeFlag && frameId === null) frameId = window.requestAnimationFrame(renderFrame)
      if (!activeFlag && frameId !== null) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
    }

    function renderFrame(timestamp) {
      frameId = null
      for (const state of states) {
        if (!canPlay(state)) continue
        if (state.lastTimestamp === null) state.lastTimestamp = timestamp
        const elapsed = timestamp - state.lastTimestamp
        if (elapsed < frameIntervalMs) continue
        state.elapsedMs = (state.elapsedMs + elapsed) % state.durationMs
        state.lastTimestamp = timestamp
        state.render(2 * Math.PI * state.elapsedMs / state.durationMs)
      }
      if (states.some(canPlay)) frameId = window.requestAnimationFrame(renderFrame)
    }
  }

  /** Cache one preview's geometry and independent playback state. */
  function createHeaderDemo(root) {
    const art = root.querySelector('.header-demo-art')
    const control = root.querySelector('.header-demo-control')
    const render = createDemoRenderer(root.dataset.demo, art.querySelector('svg'))
    render(0)
    return {
      art, control, render,
      label: control.getAttribute('aria-label').replace(/^Pause /, ''),
      durationMs: Number(root.dataset.duration) * 1000,
      elapsedMs: 0,
      lastTimestamp: null,
      manualPauseFlag: false,
      onScreenFlag: false,
    }
  }

  /** Bind an original motion study to its server-rendered SVG shapes. */
  function createDemoRenderer(kind, svg) {
    const paths = [...svg.querySelectorAll('path')]
    const rects = [...svg.querySelectorAll('rect')]
    switch (kind) {
      case 'silk':
        return phase => paths.forEach((path, i) => {
          path.setAttribute('d', createRibbonPath(i, paths.length, phase))
        })
      case 'tide':
        return phase => rects.forEach((rect, i) => {
          const height = 76 + 40 * Math.sin(phase - i * 0.14) + 23 * Math.sin(2 * phase + i * 0.23)
          rect.setAttribute('y', 186 - height)
          rect.setAttribute('height', height)
        })
      case 'mosaic': {
        const tiles = rects.map(rect => ({
          rect, column: Number(rect.dataset.column), row: Number(rect.dataset.row),
        }))
        let previousStep = -1
        return phase => {
          const step = Math.floor(phase / (2 * Math.PI) * 64)
          if (step === previousStep) return
          previousStep = step
          const steppedPhase = step / 64 * 2 * Math.PI
          for (const { rect, column, row } of tiles) {
            const visibleFlag = Math.sin(column * 0.28 + steppedPhase) +
              Math.cos(row * 0.8 - steppedPhase) > -0.35
            rect.setAttribute('visibility', visibleFlag ? 'visible' : 'hidden')
          }
        }
      }
      case 'lens':
        return phase => rects.forEach((rect, i) => {
          const left = getLensBoundary(i * 1000 / rects.length, phase)
          const right = getLensBoundary((i + 1) * 1000 / rects.length, phase)
          rect.setAttribute('x', left)
          rect.setAttribute('width', right - left + 0.35)
        })
      case 'contours':
        return phase => paths.forEach((path, i) => {
          path.setAttribute('d', createContourPath(i, phase))
        })
      case 'organic': {
        const blobs = [...svg.querySelectorAll('ellipse')].map(ellipse => ({
          ellipse,
          seed: Number(ellipse.dataset.seed),
          cx: Number(ellipse.getAttribute('cx')),
          cy: Number(ellipse.getAttribute('cy')),
          rx: Number(ellipse.getAttribute('rx')),
          ry: Number(ellipse.getAttribute('ry')),
        }))
        return phase => {
          for (const blob of blobs) {
            const shape = getOrganicShape(blob, phase)
            for (const [attribute, value] of Object.entries(shape)) {
              blob.ellipse.setAttribute(attribute, value)
            }
          }
        }
      }
      default:
        throw new Error(`Unknown header study: ${kind}`)
    }
  }

  /** Bend both sides of a ribbon without moving its colour through the field. */
  function createRibbonPath(index, count, phase) {
    const left = index * 1000 / count + 0.4
    const right = (index + 1) * 1000 / count - 0.4
    const bend = (x, y) => (x + 26 * Math.sin(Math.PI * x / 1000) *
      Math.sin(phase + x * 0.006 + y * 0.009)).toFixed(2)
    return `M ${bend(left, -20)} -20 C ${bend(left, 60)} 60 ${bend(left, 140)} 140 ${bend(left, 220)} 220 ` +
      `L ${bend(right, 220)} 220 C ${bend(right, 140)} 140 ${bend(right, 60)} 60 ${bend(right, -20)} -20 Z`
  }

  /** Keep stripe boundaries ordered while a closed wave changes their spacing. */
  function getLensBoundary(x, phase) {
    return x + 85 * Math.sin(Math.PI * x / 1000) * Math.sin(2 * Math.PI * x / 1000 - phase)
  }

  /** Build a smooth, filled contour with a transparent area above it. */
  function createContourPath(layer, phase) {
    const points = Array.from({ length: 28 }, (_, i) => {
      const x = -40 + i * 40
      const y = 24 + layer * 18 + 18 * Math.sin(x * 2 * Math.PI / 900 + phase + layer * 0.42) +
        8 * Math.sin(x * 2 * Math.PI / 480 - 2 * phase + layer * 0.6)
      return { x, y }
    })
    let path = `M ${points[0].x} ${points[0].y.toFixed(2)}`
    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i]
      const next = points[i + 1]
      path += ` Q ${point.x} ${point.y.toFixed(2)} ${(point.x + next.x) / 2} ${((point.y + next.y) / 2).toFixed(2)}`
    }
    const last = points[points.length - 1]
    return `${path} L ${last.x} ${last.y.toFixed(2)} L 1040 220 L -40 220 Z`
  }

  /** Move and reshape one pool along closed, slow orbits. */
  function getOrganicShape({ cx, cy, rx, ry, seed }, phase) {
    return {
      cx: cx + 28 * Math.sin(phase + seed * 1.9) + 8 * Math.sin(2 * phase + seed),
      cy: cy + 15 * Math.cos(phase + seed * 0.8),
      rx: rx * (1 + 0.13 * Math.sin(phase + seed)),
      ry: ry * (1 + 0.1 * Math.cos(2 * phase + seed * 0.7)),
    }
  }

  initHeaderDemos(document.querySelector('.header-demos'))
})()
