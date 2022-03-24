const { getAllDevicesAsync } = require('./repo')

const { EventEmitter } = require('events')
const { defaultLogger } = require('./logging')
const { isDeviceOnlineAsync } = require('./devices')
const { default: checkDiskSpace } = require('check-disk-space')
const { createEmitterAsyncIterator } = require('./utils')

const EVENTS = { DEVICES_UPDATED: 'DEVICES_UPDATED' }
const eventEmitter = new EventEmitter({ captureRejections: true })
eventEmitter.on('error', (err) => {
  defaultLogger.error('device info error', err)
})

/**
 * Retrives connected device info such as online, free disk space, total size
 *
 * Remarks:
 * It can take a long time to enumerate devices if some devices are offline network devices as
 * we need to wait for a timeout.
 */
exports.deviceInfo = {
  devices: [],
  async refresh () {
    const devices = await getAllDevicesAsync()
    const promises = devices.map(async device => {
      let freeSpace
      let totalSpace
      let isOnline
      try {
        isOnline = await isDeviceOnlineAsync(device)

        if (isOnline) {
          const space = await checkDiskSpace(device.path)
          freeSpace = space.free
          totalSpace = space.size
        }
      } catch (error) {
        defaultLogger.error('Error reading free space', error)
        // NOOP
      }

      const newDevice = { id: device.id, freeSpace, totalSpace, isOnline }
      eventEmitter.emit(EVENTS.DEVICES_UPDATED, newDevice)
      return newDevice
    })

    this.devices = await Promise.all(promises)
    // This isnt right because some could take forever to return

    return this.devices
  },
  iterator () {
    const iterator = createEmitterAsyncIterator(eventEmitter, EVENTS.DEVICES_UPDATED)
    this.refresh()
    return iterator
  }
}
