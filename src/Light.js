const TuyAPI = require('tuyapi')

const convertTuyaColorToHex = require('./convertTuyaColorToHex')
const convertHexColorToTuya = require('./convertHexColorToTuya')

const RECONNECT_TIMEOUT = 5000

// Tuya Keys
const POWER = '20'
const MODE = '21'
const BRIGHTNESS = '22'
const TEMPERATURE = '23'
const COLOR = '24'

// Light Modes
const WHITE_MODE = 'white'
const COLOR_MODE = 'colour'

const sleep = async (sleepTime) => new Promise((resolve) => {
  setTimeout(() => {
    resolve()
  }, sleepTime)
})

const parseBrightness = (rawBrightness) => {
  const brightness = rawBrightness * 10
  if (brightness < 10) {
    return 10
  }

  if (brightness > 1000) {
    return 1000
  }

  return brightness
}

class Light {
  static get WHITE_MODE() {
    return WHITE_MODE
  }

  static get COLOR_MODE() {
    return COLOR_MODE
  }

  constructor(id, key, options = {}) {
    this.id = id
    this.key = key
    this._currentState = {}
    this._registerCurrentState = this._registerCurrentState.bind(this)
    this._log = this._log.bind(this)

    this._connected = false

    this._debug = options.debug

    this._log('Debug mode enabled')

    this.device = new TuyAPI({
      id,
      key,
    })
  }

  _log(...args) {
    if (this._debug) {
      console.log(`[Light ${this.id}]`, ...args)
    }
  }

  // This method will always retry to connect to the Light if not found
  async _findLightDevice() {
    try {
      await this.device.find()
    } catch (error) {
      if (this._debug) {
        console.error(error)
      }
      this._log(`Light device not found, retrying in ${RECONNECT_TIMEOUT / 1000} seconds...`)
      sleep(RECONNECT_TIMEOUT)
      return this._findLightDevice()
    }

    return null
  }

  async connect() {
    await this._findLightDevice()

    await this.device.connect()

    this.device.on('disconnected', () => {
      this._log('Light Disconnected.')
      // TODO handle try to auto reconnect to the light
    })

    this.device.on('error', (error) => {
      this._log('Light Error!')
      if (this._debug) {
        console.error(error)
      }
      throw error
    })

    this.device.on('data', this._registerCurrentState)
    this.device.on('dp-refresh', this._registerCurrentState)

    // Only return the connect after the first State is registered
    return new Promise((resolve) => {
      const intervalId = setInterval(() => {
        if (this._connected) {
          clearInterval(intervalId)
          resolve()
        }
      }, 100)
    })
  }

  async disconnect() {
    await this.device.disconnect()
  }

  getCurrentState() {
    return this._currentState
  }

  async setState({
    power,
    mode,
    brightness,
    temperature,
    color,
  }) {
    const tuyaApiOptions = {}

    if (power !== undefined) {
      tuyaApiOptions[POWER] = power
    }

    if (mode !== undefined) {
      tuyaApiOptions[MODE] = mode
    }

    if (brightness !== undefined) {
      const parsedBrightness = parseBrightness(brightness)
      tuyaApiOptions[BRIGHTNESS] = parsedBrightness
    }

    if (temperature !== undefined) {
      tuyaApiOptions[TEMPERATURE] = temperature
    }

    if (color !== undefined) {
      tuyaApiOptions[COLOR] = convertHexColorToTuya(color)
    }

    return this.device.set({
      multiple: true,
      data: tuyaApiOptions,
    })
  }

  _registerCurrentState(data) {
    const { dps } = data
    const power = dps[POWER]
    const mode = dps[MODE]
    const brightness = dps[BRIGHTNESS]
    const temperature = dps[TEMPERATURE]
    const rawColor = dps[COLOR]

    if (!this._connected) {
      this._connected = true
    }

    const nextState = {}

    if (power !== undefined) {
      nextState.power = power
    }
    if (mode !== undefined) {
      nextState.mode = mode
    }
    if (brightness !== undefined) {
      nextState.brightness = brightness / 10
    }
    if (temperature !== undefined) {
      nextState.temperature = temperature
    }
    if (rawColor !== undefined) {
      nextState.color = convertTuyaColorToHex(rawColor)
    }

    this._currentState = {
      ...this._currentState,
      ...nextState,
    }

    this._log('New state: ', this._currentState)
  }

  turnOn() {
    return this.setState({ power: true })
  }

  turnOff() {
    return this.setState({ power: false })
  }

  setColorMode() {
    return this.setState({ mode: COLOR_MODE })
  }

  setWhiteMode() {
    return this.setState({ mode: WHITE_MODE })
  }

  /**
   * Change Light brightness percentage
   * @param {number} brightness From 1 to 100 percentage of the brightness
   * @returns
   */
  setBrightness(brightness) {
    return this.setState({ brightness })
  }

  /**
   * Change light temperature
   * @param {number} temperature From 0 (HOT) to 1000 (COLD)
   * @returns
   */
  async setTemperature(temperature) {
    const isWhiteMode = this._currentState.mode === WHITE_MODE
    if (!isWhiteMode) {
      await this.setWhiteMode()
    }
    return this.setState({ temperature })
  }

  /**
   * Change light color
   * @param {string} color Color in CSS string example 'FF0000' or 'rgb(0,0,255)'
   * @returns
   */
  async setColor(color) {
    const isColorMode = this._currentState.mode === COLOR_MODE
    if (!isColorMode) {
      await this.setColorMode()
    }
    return this.setState({ color })
  }
}

module.exports = Light
