/** Build visible cells with fixed timing and row-pattern offsets for each section. */
export function createSectionPath(section, phase = 0) {
  const shiftedPhase = phase + section * 2.4
  const cells = []
  for (let row = 0; row < 6; row++) {
    const rowWave = Math.cos(row * 0.8 - shiftedPhase + section * 0.37)
    for (let column = 0; column < 32; column++) {
      if (Math.sin(column * 0.28 + shiftedPhase) + rowWave <= -0.35) continue
      // Cover the whole cell; the shared paint supplies its inset 26-unit square.
      cells.push(`M${column * 30} ${row * 30 + 10}h30v30h-30z`)
    }
  }
  return cells.join('')
}

/** Locate a square in SVG coordinates, excluding gaps and rounded corners. */
export function getTileAtPoint(x, y) {
  const column = Math.floor(x / 30)
  const row = Math.floor((y - 10) / 30)
  const dx = x - column * 30 - 2
  const dy = y - row * 30 - 12
  if (column < 0 || row < 0 || row > 5 || dx < 0 || dx > 26 || dy < 0 || dy > 26) return null
  const cornerX = Math.max(2 - dx, dx - 24, 0)
  const cornerY = Math.max(2 - dy, dy - 24, 0)
  if (cornerX ** 2 + cornerY ** 2 > 4) return null
  return { column, row }
}

/** Describe the same illustrative values that determine the tile colour. */
export function formatTemperatureDetails(data) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const change = Number(data.changeCelsius)
  const sign = change > 0 ? '+' : change < 0 ? '−' : ''
  return `Illustrative data\n${data.year} · ${months[Number(data.monthStart) - 1]}–${months[Number(data.monthEnd) - 1]}\n` +
    `Temperature: ${Number(data.temperatureCelsius).toFixed(1)}°C\n` +
    `Baseline: ${Number(data.baselineCelsius).toFixed(1)}°C\n` +
    `Change: ${sign}${Math.abs(change).toFixed(1)}°C`
}

/** Keep the tooltip inside the viewport and clear of the playback control. */
export function getTooltipPlacement({ left, top, width, height }, viewport, control = null, gap = 8) {
  left = Math.max(gap, Math.min(left, viewport.width - width - gap))
  top = Math.max(gap, Math.min(top, viewport.height - height - gap))
  const maxHeight = viewport.height - top - gap
  if (!control || left + width + gap <= control.left || left >= control.right + gap ||
    top + height + gap <= control.top || top >= control.bottom + gap) return { left, top, maxHeight }

  const beside = control.left - width - gap
  if (beside >= gap) return { left: beside, top, maxHeight }

  const below = control.bottom + gap
  const above = control.top - gap
  const spaceBelow = viewport.height - below - gap
  const spaceAbove = above - gap
  if (spaceBelow >= height || spaceBelow >= spaceAbove) return { left, top: below, maxHeight: spaceBelow }
  return { left, top: Math.max(gap, above - height), maxHeight: spaceAbove }
}

/** Inspect painted squares with a pointer, touch, or arrow keys, without per-tile DOM nodes. */
export function initTooltip(root) {
  if (!root || root.hasAttribute('data-mosaic-inspector')) return
  const svg = root.querySelector('svg')
  const control = root.parentElement.querySelector('.header-animation-control, .header-demo-control')
  const tiles = [...svg.querySelectorAll('pattern rect')].map(rect => rect.dataset)
  const sections = [...svg.querySelectorAll('path[data-section]')]
  const tooltip = document.createElement('div')
  tooltip.id = `${root.id || 'header-mosaic'}-tooltip`
  tooltip.className = 'mosaic-tooltip'
  tooltip.hidden = true
  tooltip.setAttribute('role', 'tooltip')
  tooltip.setAttribute('aria-live', 'polite')
  document.body.append(tooltip)

  const marker = document.createElementNS(svg.namespaceURI, 'g')
  marker.setAttribute('class', 'mosaic-highlight')
  marker.setAttribute('visibility', 'hidden')
  for (const [colour, width] of [['#111827', 5], ['#ffffff', 2]]) {
    const outline = document.createElementNS(svg.namespaceURI, 'rect')
    for (const [name, value] of Object.entries({ width: 26, height: 26, rx: 2, fill: 'none', stroke: colour, 'stroke-width': width })) {
      outline.setAttribute(name, value)
    }
    marker.append(outline)
  }
  svg.append(marker)
  svg.setAttribute('aria-hidden', 'true')
  root.removeAttribute('aria-hidden')
  root.setAttribute('data-mosaic-inspector', '')
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'Illustrative temperatures, 1990 to 2021. Use arrow keys to inspect squares. Escape closes details.')
  root.tabIndex = 0
  let selected = null
  let pinnedFlag = false
  let dismissedFlag = false

  root.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || dismissedFlag) return
    pinnedFlag = false
    inspectPoint(event)
  })
  root.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return
    dismissedFlag = false
    pinnedFlag = true
    inspectPoint(event)
  })
  root.addEventListener('pointerleave', event => {
    dismissedFlag = false
    if (!pinnedFlag && !tooltip.contains(event.relatedTarget)) clear()
  })
  tooltip.addEventListener('pointerleave', event => {
    if (!pinnedFlag && !root.contains(event.relatedTarget)) clear()
  })
  root.addEventListener('focus', () => {
    if (!root.matches(':focus-visible')) return
    pinnedFlag = true
    dismissedFlag = false
    if (!selected) selectFirst()
  })
  root.addEventListener('blur', () => {
    pinnedFlag = false
    if (!root.matches(':hover') && !tooltip.matches(':hover')) clear()
  })
  root.addEventListener('keydown', event => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!direction) return
    event.preventDefault()
    pinnedFlag = true
    dismissedFlag = false
    if (!selected) { selectFirst(); return }
    const [dx, dy] = direction
    let { column, row } = selected
    const columns = getColumnCount()
    while (true) {
      column += dx
      row += dy
      if (column < 0 || column >= columns || row < 0 || row > 5) return
      const cell = getCell(column, row)
      if (cell) { show(cell); return }
    }
  })
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !selected) return
    dismissedFlag = true
    clear()
  })
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target) && !tooltip.contains(event.target)) clear()
  })
  control.addEventListener('click', clear)
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear() })
  window.addEventListener('resize', clear)
  window.addEventListener('scroll', clear, { passive: true })
  window.addEventListener('pagehide', clear)

  function getColumnCount() {
    const scale = svg.getBoundingClientRect().height / 200
    return Math.min(sections.length * 32, Math.max(0, Math.ceil((root.getBoundingClientRect().width / scale - 2) / 30)))
  }

  function getCell(column, row) {
    const section = sections[Math.floor(column / 32)]
    const localColumn = column % 32
    if (!section || !section.getAttribute('d').includes(`M${localColumn * 30} ${row * 30 + 10}h30v30h-30z`)) return null
    return { column, row, data: tiles[row * 32 + localColumn] }
  }

  function inspectPoint(event) {
    const bounds = svg.getBoundingClientRect()
    const scale = bounds.height / 200
    const point = getTileAtPoint((event.clientX - bounds.left) / scale, (event.clientY - bounds.top) / scale)
    const cell = point && getCell(point.column, point.row)
    if (cell) show(cell)
    else clear()
  }

  function selectFirst() {
    const columns = getColumnCount()
    for (let row = 0; row < 6; row++) {
      for (let column = 0; column < columns; column++) {
        const cell = getCell(column, row)
        if (cell) { show(cell); return }
      }
    }
  }

  function show(cell) {
    if (selected?.column === cell.column && selected.row === cell.row) return
    const activeFlag = selected !== null
    selected = cell
    control.setAttribute('data-mosaic-inspecting', '')
    if (!activeFlag) root.dispatchEvent(new CustomEvent('mosaic-inspection', { detail: true }))
    tooltip.textContent = formatTemperatureDetails(cell.data)
    tooltip.style.left = '8px'
    tooltip.style.top = '8px'
    tooltip.style.width = ''
    tooltip.style.maxHeight = ''
    tooltip.hidden = false
    root.setAttribute('aria-describedby', tooltip.id)
    marker.setAttribute('transform', `translate(${cell.column * 30 + 2} ${cell.row * 30 + 12})`)
    marker.setAttribute('visibility', 'visible')
    const bounds = svg.getBoundingClientRect()
    const scale = bounds.height / 200
    const box = tooltip.getBoundingClientRect()
    tooltip.style.width = `${box.width}px`
    const left = bounds.left + (cell.column * 30 + 2) * scale
    const top = bounds.top + (cell.row * 30 + 38) * scale
    const placement = getTooltipPlacement(
      { left, top, width: box.width, height: box.height },
      { width: window.innerWidth, height: window.innerHeight },
      control.hidden ? null : control.getBoundingClientRect(),
    )
    tooltip.style.left = `${placement.left}px`
    tooltip.style.top = `${placement.top}px`
    tooltip.style.maxHeight = `${placement.maxHeight}px`
  }

  function clear() {
    if (!selected) return
    selected = null
    pinnedFlag = false
    tooltip.hidden = true
    control.removeAttribute('data-mosaic-inspecting')
    marker.setAttribute('visibility', 'hidden')
    root.removeAttribute('aria-describedby')
    root.dispatchEvent(new CustomEvent('mosaic-inspection', { detail: false }))
  }
}
