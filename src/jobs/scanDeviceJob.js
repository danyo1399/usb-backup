const fileTreeWalkerAsync = require('../fileTreeWalker')
const { index, identity, newIdNumber } = require('../utils')
const {
  getDeviceByIdAsync,
  getFileIdsByDeviceAsync,
  deleteFileAsync,
  getFileByFingerprintAsync,
  updateDeviceScanDateAsync,
  findSimilarFilesAsync,
  deleteFileHardAsync,
  getFileByDeviceRelativePathAsync,
  getFileByIdAsync,
  getFilesByHashAndDeviceTypeAsync

} = require('../repo')
const fs = require('fs-extra')
const { deviceName, isDeviceOnlineAsync, isMetafile, writeDeviceMetaFileAsync } = require('../device')
const { getFileRelativePath, joinPaths } = require('../path')
const path = require('path')
const { hashFileAsync } = require('../crypto')
const { createFileAsync, areFileFingerprintsEqual } = require('../file')

module.exports.createScanDeviceJobAsync = async ({ sourceDeviceIds, useFullScan }) => {
  const context = { sourceDeviceIds, useFullScan }

  const devices = (await Promise.all(sourceDeviceIds.map(id => getDeviceByIdAsync(id)))).map(d => `[${d.name}]`)
  const description = `${useFullScan ? 'full scan' : 'fast scan'} devices ${devices.join(', ')}`
  const id = newIdNumber()
  let _abort = false
  async function executeAsync (log) {
    await scanDevices(log, sourceDeviceIds, () => _abort, useFullScan)
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, description, abort, name: 'scanDeviceJob', allowConcurrent: true }
}

const scanDevices = exports.scanDevices = async function (log, deviceIds, getIsAborting, useFullScan) {
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
        log,
        useFullScan
      })

    const scannedFileIds = []
    log.info(`Performing ${useFullScan ? 'full' : 'fast'} scan device ${deviceName(device)}`)
    await fileTreeWalkerAsync(device.path, handleFileAsync, log)

    async function handleFileAsync (err, { filename, stat, abort }) {
      try {
        if (getIsAborting()) {
          abort()
        }
        if (err) {
          return
        }

        const fileId = await processFileAsync({ filename, stat })
        fileId != null && scannedFileIds.push(fileId)
      } catch (error) {
        log.error(`Unhandled exception thrown processing file ${filename}. ${error.message}`, error)
      }
    }
    log.debug('Removing orphan files')
    const dbFileIds = await getFileIdsByDeviceAsync(device.id)
    const existsInScannedFiles = index(identity, scannedFileIds)

    const deletedIds = dbFileIds.filter(id => !existsInScannedFiles(id))

    for (const id of deletedIds) {
      const fileToDelete = await getFileByIdAsync(id)

      log.warn(`Marking file deleted: id ${id}, device ${device.name}, path ${fileToDelete?.relativePath}`)
      await deleteFileAsync(id)
    }

    await updateDeviceScanDateAsync(deviceId)
    await writeDeviceMetaFileAsync(device)
  }
}

const scanFileHoc = ({ device, log, useFullScan }) => {
  async function getMovedFileAsync (filename, stat) {
    // Detect file moved
    let movedFile = null
    const baseName = path.basename(filename)
    const { mtimeMs, birthtimeMs, size } = stat
    const files = await findSimilarFilesAsync(device.id, size, baseName, birthtimeMs, mtimeMs)

    if (files.length === 1 && files[0].hash) {
      const file = files[0]
      const fullPath = joinPaths(device.path, file.relativePath)

      const exists = await fs.pathExists(fullPath)
      if (!exists) {
        movedFile = file
        movedFile.fullPath = fullPath
      }
    }
    return movedFile
  }

  async function doFullScanAsync (filename, relativePath, stat) {
    const hash = await hashFileAsync(filename)
    const existingFile = await getFileByDeviceRelativePathAsync(device.id, relativePath)

    const isNewFile = existingFile == null
    const hashChanged = !!existingFile && existingFile.hash !== hash
    const fingerprintChanged = !!existingFile && !areFileFingerprintsEqual({ relativePath, ...stat }, existingFile)

    if (isNewFile || hashChanged || fingerprintChanged) {
      const changeDesc = isNewFile ? 'New file' : hashChanged ? 'Hash changed' : 'Fingerprint changed'
      log.info(`${changeDesc}, creating new file ${filename}`)
      const { file: newFile } = await createFileAsync(device, filename, { hash, stat })

      return newFile.id
    }
    return existingFile.id
  }
  async function doFastScanAsync (filename, relativePath, stat) {
    const file = await getFileByFingerprintAsync(device.id, relativePath, stat)
    if (file) return file.id

    const movedFile = await getMovedFileAsync(filename, stat)
    const hash = movedFile?.hash ?? await hashFileAsync(filename)

    if (movedFile) {
      log.info(`File moved from ${movedFile.fullPath} to ${filename}`)
      await deleteFileHardAsync(movedFile.id)
    } else {
      const existingFile = (await getFilesByHashAndDeviceTypeAsync(hash, device.deviceType))[0]
      if (existingFile) log.warn(`Another file exists with same hash: ${existingFile.deviceName} - ${existingFile.relativePath}`)
      log.info(`${device.deviceType} file added ${filename}`)
    }

    // insert file after duplicate file hash check so new file is not flagged as duplicate.
    return (await createFileAsync(device, filename, { hash, stat })).file.id
  }

  return async ({ filename, stat }) => {
    const relativePath = getFileRelativePath(device.path, filename)
    if (isMetafile(relativePath)) return

    if (useFullScan) {
      return await doFullScanAsync(filename, relativePath, stat)
    } else {
      return await doFastScanAsync(filename, relativePath, stat)
    }
  }
}
