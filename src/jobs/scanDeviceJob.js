const { scanFileHoc, writeDeviceMetaFileAsync: writeSourceDeviceMetaFileAsync } = require('../app')
const fileTreeWalkerAsync = require('../fileTreeWalker')
const { index, identity, newIdNumber } = require('../utils')
const {
  getDeviceByIdAsync,
  addFileAsync,
  getFileIdsByDeviceAsync,
  deleteFileAsync,
  fileExistsAsync,
  setDeviceScanDateAsync

} = require('../repo')
const { deviceName, isDeviceOnlineAsync } = require('../devices')

module.exports.createScanDeviceJobAsync = async ({ sourceDeviceIds, useFullScan }) => {
  const context = { sourceDeviceIds, useFullScan }

  const id = newIdNumber()
  let _abort = false
  async function executeAsync (log) {
    await scanDevices(log, sourceDeviceIds, () => _abort)
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, abort, name: 'scanDeviceJob' }
}

const scanDevices = exports.scanDevices = async function (log, deviceIds, getIsAborting) {
  for (const deviceId of deviceIds) {
    if (getIsAborting()) break

    const device = await getDeviceByIdAsync(deviceId)

    if (!device) {
      log.warn(`device with id does not exist ${deviceId}`)
      continue
    }

    const isDeviceOnline = await isDeviceOnlineAsync(device)
    if (!isDeviceOnline) {
      log.warn(`Device offline: ${deviceName(device)}`)
      continue
    }

    const processFileAsync = scanFileHoc(
      {
        device,
        addAsync: addFileAsync,
        existsAsync: fileExistsAsync,
        onNewFile: (filename) => log.info(`Adding file ${filename}`)
      })

    const scannedFileIds = []
    log.info(`Scanning device ${deviceName(device)}`)
    await fileTreeWalkerAsync(device.path, handleFileAsync, log)

    async function handleFileAsync (err, { filename, stat, abort }) {
      try {
        if (getIsAborting()) {
          abort()
        }
        if (err) {
          return
        }
        log.debug(`Processing file ${filename}`)
        const fileId = await processFileAsync({ filename, stat })
        fileId && scannedFileIds.push(fileId)
      } catch (error) {
        log.error(`Unhandled exception thrown processing file ${filename}`, error)
      }
    }

    const dbFileIds = await getFileIdsByDeviceAsync(device.id)
    const existsInScannedFiles = index(identity, scannedFileIds)

    const deletedIds = dbFileIds.filter(id => !existsInScannedFiles(id))

    for (const id of deletedIds) {
      log.warn(`Marking file deleted: ${id}`)
      await deleteFileAsync(id)
    }

    await setDeviceScanDateAsync(deviceId)
    await writeSourceDeviceMetaFileAsync(device)
  }
}
