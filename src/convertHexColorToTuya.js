const tinycolor = require('tinycolor2')
const { MAX_HUE, MAX_SATURATION, MAX_VALUE } = require('./constants')

module.exports = function convertHexColorToTuya(hexColor) {
  const color = tinycolor(hexColor)
  const { h, s, v } = color.toHsv()
  const hue = ((h / 360) * MAX_HUE).toString(16).padStart(4, '0')
  const saturation = (s * MAX_SATURATION).toString(16).padStart(4, '0')
  const value = (v * MAX_VALUE).toString(16).padStart(4, '0')

  return hue + saturation + value
}
