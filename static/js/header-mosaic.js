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
