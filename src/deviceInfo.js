const { getAllDevicesAsync, updateDeviceInfo } = require('./repo')

const { EventEmitter } = require('events')
const { defaultLogger } = require('./logging')
const { getDeviceIdForPathAsync } = require('./device')
const { default: checkDiskSpace } = require('check-disk-space')
const { createEmitterAsyncIterator, removeDuplicates, prop, map } = require('./utils')

const EVENTS = { DEVICES_UPDATED: 'DEVICES_UPDATED' }
const eventEmitter = new EventEmitter({ captureRejections: true })
eventEmitter.on('error', (err) => {
  defaultLogger.error('device info error', err)
})

function sendUpdate ({ id, freeSpace, totalSpace, isOnline }) {
  const newDevice = { id, freeSpace, totalSpace, isOnline }
  eventEmitter.emit(EVENTS.DEVICES_UPDATED, newDevice)
  return newDevice
}

async function processPath (path) {
  try {
    defaultLogger.info(`Getting device info for path ${path}`)
    const id = await getDeviceIdForPathAsync(path)
    if (id) {
      defaultLogger.info(`found device id ${id} at path ${path}`)
      let free, size
      try {
        const space = await checkDiskSpace(path)
        free = space.free
        size = space.size
        // The path could have changed for the device. Lets update it
        await updateDeviceInfo(id, free, size, path)
      } catch (error) {
        defaultLogger.info('failed to retrieve free space for path', path)
      }

      return sendUpdate({ id, freeSpace: free, totalSpace: size, isOnline: true })
    } else {
      defaultLogger.info('No device found at path', path)
    }
  } catch (error) {
    defaultLogger.warn('failed to process device info for path ' + path, error)
  }
}

const createDeviceInfoService = exports._createDeviceInfoService = () => (
  {
    devices: [],
    async refresh () {
      const devices = await getAllDevicesAsync()

      // We iterate by unique paths instead of devices so we can
      // update devices that can be mounted on different paths.
      // EG a usb drive could be mounted on d:\ or e:\
      const getDevicePaths = map(prop('path'))
      const paths = getDevicePaths(devices)
      const uniquePaths = removeDuplicates(paths)
      const processPathPromises = uniquePaths.map(p => processPath(p))

      const updatedDeviceInfos = (await Promise.all(processPathPromises)).filter(x => x != null)

      this.devices = devices.map(device => {
        let deviceInfo = updatedDeviceInfos.find(x => x.id === device.id)
        if (!deviceInfo) {
          deviceInfo = sendUpdate({ ...device, isOnline: false })
        }

        return deviceInfo
      })

      return this.devices
    },
    iterator () {
      // Send last known device infos while we refresh
      const iterator = createEmitterAsyncIterator(eventEmitter, [EVENTS.DEVICES_UPDATED], { initialItems: this.devices })

      this.refresh()
      return iterator
    }
  })

/**
 * Retrieves connected device info such as online, free disk space, total size
 *
 * Remarks:
 * It can take a long time to enumerate devices if some devices are offline network devices as
 * we need to wait for a timeout.
 */
exports.deviceInfo = createDeviceInfoService()
