const Device = require('./Device')

const STATE = '1'
const CLOSED_PERCENTAGE = '2'
const LAST_ACTION = '7'

const OPEN = 'open'
const CLOSE = 'close'

// Last action states
// const OPENING = 'opening'
// const CLOSING = 'closing'

// TODO set open and close state based on last action, not only the '1' dps

class SmartCurtain extends Device {
  constructor(...args) {
    super(...args)

    this.state = {}
  }

  onDeviceStateUpdate(data) {
    const { dps } = data
    const state = dps[STATE]
    const closedPercentage = dps[CLOSED_PERCENTAGE]
    const lastAction = dps[LAST_ACTION]

    const nextState = {}

    if (state !== undefined) {
      nextState.state = state
    }

    if (closedPercentage !== undefined) {
      nextState.closedPercentage = closedPercentage
    }
    if (lastAction !== undefined) {
      nextState.lastAction = lastAction
    }

    this.state = {
      ...this.state,
      ...nextState,
    }
  }

  setState({ state, closedPercentage }) {
    const tuyaApiOptions = {}

    if (state !== undefined) {
      tuyaApiOptions[STATE] = state
    }

    if (closedPercentage !== undefined) {
      tuyaApiOptions[CLOSED_PERCENTAGE] = closedPercentage
    }

    return this._setState(tuyaApiOptions)
  }

  open() {
    return this.setState({ state: OPEN })
  }

  close() {
    return this.setState({ state: CLOSE })
  }

  setClosedPercentage(closedPercentage) {
    return this.setState({ closedPercentage })
  }
}

module.exports = SmartCurtain
