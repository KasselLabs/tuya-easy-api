const TuyAPI = require('tuyapi')

const convertTuyaColorToHex = require('./convertTuyaColorToHex')
const convertHexColorToTuya = require('./convertHexColorToTuya')

module.exports = class Light {
  constructor(id, key) {
    this.id = id
    this.key = key
    this._currentStatus = {}
    this._registerCurrentStatus = this._registerCurrentStatus.bind(this)

    this.device = new TuyAPI({
      id,
      key,
    })
  }

  async connect() {
    await this.device.find()

    await this.device.connect()

    this.device.on('data', this._registerCurrentStatus)
    this.device.on('dp-refresh', this._registerCurrentStatus)
  }

  async disconnect() {
    await this.device.disconnect()
  }

  getCurrentStatus() {
    return this._currentStatus
  }

  async setStatus({
    lit,
    mode,
    brightness,
    coolness,
    color,
  }) {
    const tuyaApiOptions = {}

    if (lit !== undefined) {
      tuyaApiOptions[20] = lit
    }

    if (mode !== undefined) {
      tuyaApiOptions[21] = mode
    }

    if (brightness !== undefined) {
      tuyaApiOptions[22] = brightness
    }

    if (coolness !== undefined) {
      tuyaApiOptions[23] = coolness
    }

    if (color !== undefined) {
      tuyaApiOptions[24] = convertHexColorToTuya(color)
    }

    return this.device.set({
      multiple: true,
      data: tuyaApiOptions,
    })
  }

  _registerCurrentStatus(data) {
    const { dps } = data
    const lit = dps['20']
    const mode = dps['21']
    const brightness = dps['22']
    const coolness = dps['23']
    const rawColor = dps['24']

    if (lit !== undefined) {
      this._currentStatus.lit = lit
    }

    if (mode !== undefined) {
      this._currentStatus.mode = mode
    }

    if (brightness !== undefined) {
      this._currentStatus.brightness = brightness
    }

    if (coolness !== undefined) {
      this._currentStatus.coolness = coolness
    }

    if (rawColor !== undefined) {
      this._currentStatus.color = convertTuyaColorToHex(rawColor)
    }
  }
}
