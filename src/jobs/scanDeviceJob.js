const { writeDeviceMetaFileAsync: writeSourceDeviceMetaFileAsync, createFileId, createFile } = require('../app')
const fileTreeWalkerAsync = require('../fileTreeWalker')
const { index, identity, newIdNumber } = require('../utils')
const {
  getDeviceByIdAsync,
  addFileAsync,
  getFileIdsByDeviceAsync,
  deleteFileAsync,
  getFileExistsAsync,
  updateDeviceScanDateAsync,
  findSimilarFilesAsync,
  deleteFileHardAsync

} = require('../repo')
const fs = require('fs-extra')
const { deviceName, isDeviceOnlineAsync, isMetafile } = require('../device')
const { getRelativePath } = require('../path')
const path = require('path')
const { hashFileAsync } = require('../crypto')

module.exports.createScanDeviceJobAsync = async ({ sourceDeviceIds, useFullScan }) => {
  const context = { sourceDeviceIds, useFullScan }

  const devices = (await Promise.all(sourceDeviceIds.map(id => getDeviceByIdAsync(id)))).map(d => `[${d.name}]`)
  const description = `${useFullScan ? 'full scan' : 'scan'} devices ${devices.join(', ')}`
  const id = newIdNumber()
  let _abort = false
  async function executeAsync (log) {
    await scanDevices(log, sourceDeviceIds, () => _abort)
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, description, abort, name: 'scanDeviceJob' }
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
        existsAsync: getFileExistsAsync,
        log
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

    await updateDeviceScanDateAsync(deviceId)
    await writeSourceDeviceMetaFileAsync(device)
  }
}

const scanFileHoc = ({ device, existsAsync, addAsync, log, fullScan }) => {
  async function getMovedFileAsync (filename, stat) {
    // Detect file moved
    let movedFile = null
    const baseName = path.basename(filename)
    const { mtimeMs, birthtimeMs, size } = stat
    const files = await findSimilarFilesAsync(device.id, size, baseName, birthtimeMs, mtimeMs)

    if (files.length === 1 && files[0].hash) {
      const file = files[0]
      const fullPath = path.join(device.path, file.relativePath)

      const exists = await fs.pathExists(fullPath)
      if (!exists) {
        movedFile = file
        movedFile.fullPath = fullPath
      }
    }
    return movedFile
  }
  return async ({ filename, stat }) => {
    const relativePath = getRelativePath(device.path, filename)

    if (isMetafile(relativePath) === false) {
      const fileId = createFileId({ deviceId: device.id, relativePath, stat })
      const fileExists = await existsAsync(fileId)
      if (!fileExists) {
        const movedFile = !fullScan ? await getMovedFileAsync(filename, stat) : null

        const hash = movedFile?.hash ?? await hashFileAsync(filename)
        const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })
        movedFile ? log.info(`File moved from ${movedFile.fullPath} to ${filename}`) : log.info(`Adding file ${filename}`)
        await addAsync(newFile)

        if (movedFile) {
          await deleteFileHardAsync(movedFile.id)
        }
      }
      return fileId
    }
  }
}
