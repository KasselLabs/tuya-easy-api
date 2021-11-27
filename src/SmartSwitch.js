const Device = require('./Device')

const SWITCH_BUTTONS = [1, 2, 3, 4, 5, 6]

const POWER_INDICATOR = '16'

class SmartSwitch extends Device {
  constructor(...args) {
    super(...args)

    this.state = {
      powerIndicator: null,
      switches: {},
    }
  }

  onDeviceStateUpdate(data) {
    const { dps } = data

    const powerIndicator = dps[POWER_INDICATOR]
    if (powerIndicator !== undefined) {
      this.state.powerIndicator = powerIndicator
    }

    SWITCH_BUTTONS.forEach((switchNumber) => {
      const powerState = dps[switchNumber]
      if (powerState !== undefined) {
        this.state.switches[switchNumber] = powerState
      }
    })
  }

  setState({ powerIndicator, switches = {} }) {
    const tuyaApiOptions = {}

    if (powerIndicator !== undefined) {
      tuyaApiOptions[POWER_INDICATOR] = powerIndicator
    }

    SWITCH_BUTTONS.forEach((switchNumber) => {
      const powerState = switches[switchNumber]
      if (powerState !== undefined) {
        tuyaApiOptions[switchNumber] = powerState
      }
    })

    return this._setState(tuyaApiOptions)
  }

  enablePowerIndicator() {
    return this.setState({ powerIndicator: true })
  }

  disablePowerIndicator() {
    return this.setState({ powerIndicator: false })
  }

  toggleSwitch(switchNumber, powerState = null) {
    const nextPowerState = (
      powerState === null
        ? !this.state.switches[switchNumber]
        : powerState
    )
    return this.setState({ switches: { [switchNumber]: nextPowerState } })
  }

  getSwitchNumbers() {
    return Object.keys(this.state.switches)
  }

  turnOn() {
    const nextState = this.getSwitchNumbers().reduce((accumulated, current) => ({
      ...accumulated,
      [current]: true,
    }), {})
    return this.setState({ switches: nextState })
  }

  turnOff() {
    const nextState = this.getSwitchNumbers().reduce((accumulated, current) => ({
      ...accumulated,
      [current]: false,
    }), {})
    return this.setState({ switches: nextState })
  }
}

module.exports = SmartSwitch
