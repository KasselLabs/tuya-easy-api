const Device = require('./Device')

const POWER = '1'

class SmartPlug extends Device {
  constructor(...args) {
    super(...args)

    this.state = {}
  }

  onDeviceStateUpdate(data) {
    const { dps } = data
    const power = dps[POWER]

    const nextState = {}

    if (power !== undefined) {
      nextState.power = power
    }

    this.state = {
      ...this.state,
      ...nextState,
    }
  }

  setState({ power }) {
    const tuyaApiOptions = {}

    if (power !== undefined) {
      tuyaApiOptions[POWER] = power
    }

    return this._setState(tuyaApiOptions)
  }

  turnOn() {
    return this.setState({ power: true })
  }

  turnOff() {
    return this.setState({ power: false })
  }
}

module.exports = SmartPlug
