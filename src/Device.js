const TuyAPI = require('tuyapi')

const RECONNECT_TIMEOUT = 5000
const DEFAULT_MAX_RECONNECT_TRIALS = 5

const sleep = async (sleepTime) => new Promise((resolve) => {
  setTimeout(() => {
    resolve()
  }, sleepTime)
})

class Device {
  /**
   *
   * @param {*} id Device ID on Tuya API
   * @param {*} key Device Key on Tuya API
   * @param {*} options options.debug enable verbose debug mode,
   * options.waitFirstState will wait for the first state when
   *           connect to the device to resolve `connect()` method.
   * options.debugLabel device label on debug logs
   * options.maxConnectTrials max time that the device will try to connect
   */
  constructor(id, key, options = {}) {
    this.id = id
    this.key = key
    this._currentState = {}
    this._registerCurrentState = this._registerCurrentState.bind(this)
    this._log = this._log.bind(this)

    this._connected = false

    this._debug = options.debug
    this._debugLabel = options.debugLabel
    this._waitFirstState = options.waitFirstState
    this._maxConnectTrials = options.maxConnectTrials || DEFAULT_MAX_RECONNECT_TRIALS
    this._connectTrials = 0

    this._log('Debug mode enabled')

    this.device = new TuyAPI({
      id,
      key,
    })
  }

  _log(...args) {
    if (this._debug) {
      // eslint-disable-next-line no-console
      console.log(`[Device ${this._debugLabel || this.id}]`, ...args)
    }
  }

  // This method will retry to connect to the Light if not found
  async _findDevice() {
    try {
      await this.device.find()
    } catch (error) {
      if (this._debug) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
      this._connectTrials += 1
      if (this._connectTrials > this._maxConnectTrials) {
        throw new Error('Device offline or not found')
      }
      this._log(`Device not found, retrying in ${RECONNECT_TIMEOUT / 1000} seconds...`)
      sleep(RECONNECT_TIMEOUT)
      return this._findDevice()
    }

    return null
  }

  isConnected() {
    return this._connected
  }

  async connect() {
    await this._findDevice()

    await this.device.connect()

    this.device.on('disconnected', () => {
      this._log('Device Disconnected.')
      // TODO handle try to auto reconnect to the Device
    })

    this.device.on('error', (error) => {
      this._log('Device Error!')
      if (this._debug) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
      throw error
    })

    this.device.on('data', this._registerCurrentState)
    this.device.on('dp-refresh', this._registerCurrentState)

    if (this._waitFirstState) {
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

    return Promise.resolve()
  }

  async disconnect() {
    await this.device.disconnect()
  }

  _getState() {
    return this._currentState
  }

  async _setState(data) {
    return this.device.set({
      multiple: true,
      data,
    })
  }

  _registerCurrentState(data) {
    const { dps } = data
    const nextState = dps

    if (!this._connected) {
      this._log('Device Connected.')
      this._connected = true
    }

    this._currentState = {
      ...this._currentState,
      ...nextState,
    }

    this._log('New state: ', this._currentState)

    this.onDeviceStateUpdate(data)
  }

  // eslint-disable-next-line class-methods-use-this
  onDeviceStateUpdate(data) {
    // eslint-disable-next-line no-console
    console.log('NOT IMPLEMENTED onDeviceStateUpdate data:')
    // eslint-disable-next-line no-console
    console.log(data)
  }
}

module.exports = Device
