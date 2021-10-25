const Device = require('./Device')

const convertTuyaColorToHex = require('./convertTuyaColorToHex')
const convertHexColorToTuya = require('./convertHexColorToTuya')

// Tuya Keys
const POWER = '20'
const MODE = '21'
const BRIGHTNESS = '22'
const TEMPERATURE = '23'
const COLOR = '24'
const SCENE = '25'

// Light Modes
const WHITE_MODE = 'white'
const COLOR_MODE = 'colour'
const SCENE_MODE = 'scene'

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

class Light extends Device {
  static get WHITE_MODE() {
    return WHITE_MODE
  }

  static get COLOR_MODE() {
    return COLOR_MODE
  }

  constructor(...args) {
    super(...args)

    this.state = {}
  }

  getState() {
    return this.state
  }

  async setState({
    power,
    mode,
    brightness,
    temperature,
    color,
    scene,
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

    if (scene !== undefined) {
      tuyaApiOptions[SCENE] = scene
    }

    return this._setState(tuyaApiOptions)
  }

  onDeviceStateUpdate(data) {
    const { dps } = data
    const power = dps[POWER]
    const mode = dps[MODE]
    const brightness = dps[BRIGHTNESS]
    const temperature = dps[TEMPERATURE]
    const rawColor = dps[COLOR]
    const scene = dps[SCENE]

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

    if (scene !== undefined) {
      nextState.scene = scene
    }

    if (rawColor !== undefined) {
      nextState.color = convertTuyaColorToHex(rawColor)
    }

    this.state = {
      ...this.state,
      ...nextState,
    }
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
    const isWhiteMode = this.state.mode === WHITE_MODE
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
    const isColorMode = this.state.mode === COLOR_MODE
    if (!isColorMode) {
      await this.setColorMode()
    }
    return this.setState({ color })
  }

  async setScene(scene) {
    return this.setState({ mode: SCENE_MODE, scene })
  }
}

module.exports = Light
