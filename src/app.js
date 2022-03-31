/*
this module contains the application apis
 */
const repo = require('./repo')
const fs = require('fs-extra')

const { newId } = require('./utils')
const { isDeviceOnlineAsync, isExistingDeviceAsync, createDeviceMetaFileAsync } = require('./device')
const { getFileRelativePath } = require('./path')
const { raiseError, errorCodes } = require('./errors')

/**
 * Creates a fingerprint for a file.
 * @param {*} param0
 * @returns {string} the id of the file
 */
exports.getFileFingerprint = function ({ deviceId, relativePath, stat: { mtimeMs, birthtimeMs, size } }) {
  return JSON.stringify([deviceId, relativePath, Math.floor(mtimeMs), size, Math.floor(birthtimeMs)])
}

/**
 * Creates a file object from a list of required fields and destructuring a file stat object
 * @param {*} param0
 * @returns
 */
const createFile = exports.createFile = ({ deviceType, deviceId, relativePath, hash, stat: { mtimeMs, birthtimeMs, size } }) => {
  mtimeMs = Math.floor(mtimeMs)
  birthtimeMs = Math.floor(birthtimeMs)

  const addDate = Date.now()

  return {
    deviceType,
    deviceId,
    relativePath,
    mtimeMs,
    birthtimeMs,
    size,
    hash,
    deleted: 0,
    addDate
  }
}

/*
Files
==================================================================================
*/
exports.addFileAsync = async (device, filename, hash) => {
  const relativePath = getFileRelativePath(device.path, filename)
  const stat = await fs.stat(filename)
  const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })
  await repo.addFileAsync(newFile)
}
/*

Source Devices
==========================================================================
*/

exports.removeDeviceAsync = async (id) => {
  const source = await repo.getDeviceByIdAsync(id)
  if (!source) {
    raiseError(errorCodes.deviceDoesNotExist)
  }
  await repo.deleteDeviceAsync(source.id)
}

exports.updateDeviceAsync = async ({ id, name, description, path }) => {
  const device = await repo.getDeviceByIdAsync(id)
  if (!device) {
    raiseError(errorCodes.deviceDoesNotExist)
  }
  const hasPathChanged = path !== device.path
  if (hasPathChanged) {
    const isDeviceOnline = await isDeviceOnlineAsync({ id, path })

    if (!isDeviceOnline) raiseError(errorCodes.pathDoesNotMatchDevice)
  }
  await repo.updateDeviceAsync({ id, name, description, path })
}

exports.createSourceDeviceAsync = async (source) => {
  source.id = source.id || newId()
  source.deviceType = 'source'
  const exists = await fs.pathExists(source.path)
  if (!exists) {
    raiseError(errorCodes.devicePathDoesNotExist)
  }

  if (await isExistingDeviceAsync(source.path)) raiseError(errorCodes.existingSource)

  const createdSource = await repo.addDeviceAsync(source)

  await writeDeviceMetaFileAsync(source)
  return createdSource
}

const writeDeviceMetaFileAsync = exports.writeDeviceMetaFileAsync = async (device) => {
  const files = await repo.getFilesByDeviceAsync(device.id)

  await createDeviceMetaFileAsync(device, files)
}

/*
Backup Devices
==========================================================================
*/

exports.createBackupDeviceAsync = async (device) => {
  device.id = device.id || newId()
  device.deviceType = 'backup'
  const exists = await fs.exists(device.path)
  if (!exists) {
    raiseError(errorCodes.devicePathDoesNotExist)
  }

  if (await isExistingDeviceAsync(device.path)) raiseError(errorCodes.existingSource)
  if (process.platform === 'win32' && !device.path.includes(':')) {
    raiseError(errorCodes.pathNotSupported)
  }
  const createdDevice = await repo.addDeviceAsync(device)

  await createDeviceMetaFileAsync(createdDevice)
  return createdDevice
}
