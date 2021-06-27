const tinycolor = require('tinycolor2')
const { MAX_HUE, MAX_SATURATION, MAX_VALUE } = require('./constants')

module.exports = function convertTuyaColorToHex(tuyaColor) {
  const hue = (parseInt(tuyaColor.slice(0, 4), 16) / MAX_HUE) * 360
  const saturation = parseInt(tuyaColor.slice(4, 8), 16) / MAX_SATURATION
  const value = parseInt(tuyaColor.slice(8, 12), 16) / MAX_VALUE

  const color = tinycolor({ h: hue, s: saturation, v: value })
  return color.toHex()
}
