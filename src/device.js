const _path = require('path')
const fs = require('fs-extra')
const { defaultLogger } = require('./logging')
const { getDeviceByIdAsync, addDeviceAsync, updateDeviceAsync, getFilesByDeviceAsync, deleteDeviceAsync } = require('./repo')
const { newId } = require('./utils')
const { raiseError, errorCodes } = require('./errors')
const { joinPaths } = require('./path')

const METAFILE_SUFFIX = '.usbb'
function getMetaFilePath ({ path, id }) {
  return joinPaths(path, `${id}${METAFILE_SUFFIX}`)
}
exports.getMetaFilePath = getMetaFilePath

exports.deviceName = (device) => {
  const { id, name } = device
  return `${id}: ${name}`
}

exports.assertDeviceOnlineAsync = async (deviceId, { deviceType } = {}) => {
  const device = await getDeviceByIdAsync(deviceId)
  if (!device) {
    throw new Error(`device with id does not exist [${deviceId}]`)
  }

  if (deviceType != null && device.deviceType !== deviceType) { throw new Error(`incorrect device type. Expected ${deviceType}, received ${device.deviceType}`) }

  const isDeviceOnline = await this.isDeviceOnlineAsync(device)
  if (!isDeviceOnline) {
    throw new Error(`Device offline: ${this.deviceName(device)}`)
  }
  return device
}

exports.getDeviceIdForPathAsync = async (path) => {
  try {
    const files = (await fs.readdir(path)).filter(x => x.endsWith(METAFILE_SUFFIX))
    if (files.length > 0) {
      const filename = _path.basename(files[0])
      return filename.slice(0, filename.length - 5)
    } else {
      defaultLogger.info('no device found at path', path)
    }
  } catch (error) {
    defaultLogger.warn(`Error occured reading path ${path}`, error)
    // NOOP Device could be offline
  }
  return null
}

exports.isDeviceOnlineAsync = async ({ path, id }) => {
  const metaFile = getMetaFilePath({ path, id })
  const exists = await fs.pathExists(metaFile)
  return exists
}

/**
 * Writes the device and files to a json file at the root of the device
 * @param {*} device
 *
 * @description
 * We store a copy of the device details and its files on the backup device
 * Could be used in future to restore a lost database from the meta data files
 */
exports.writeDeviceMetaFileAsync = async (device) => {
  const files = await getFilesByDeviceAsync(device.id)

  const file = joinPaths(device.path, `${device.id}${METAFILE_SUFFIX}`)

  await fs.writeJson(file, { ...device, files })
}

exports.loadDeviceMetafileAsync = async (device) => {
  const metafilePath = getMetaFilePath(device)
  return await fs.readJSON(metafilePath)
}

/**
 * Deternines if the specific path is the root folder of a device
 * @param {*} path
 * @returns true if it is, else false
 */
exports.isExistingDeviceAsync = async (path) => {
  const files = (await fs.readdir(path)).filter(x => x.endsWith(METAFILE_SUFFIX))
  return files.length > 0
}

exports.isMetafile = (path) => {
  return /^[a-f0-9]{32}\.usbb$/.test(path)
}

exports.createSourceDeviceAsync = async (source) => {
  source.id = source.id || newId()
  source.deviceType = 'source'
  const exists = await fs.pathExists(source.path)
  if (!exists) {
    raiseError(errorCodes.devicePathDoesNotExist)
  }

  if (await this.isExistingDeviceAsync(source.path)) raiseError(errorCodes.existingSource)

  const createdSource = await addDeviceAsync(source)

  await this.writeDeviceMetaFileAsync(source)
  return createdSource
}

exports.updateDeviceAsync = async ({ id, name, description, path }) => {
  const device = await getDeviceByIdAsync(id)
  if (!device) {
    raiseError(errorCodes.deviceDoesNotExist)
  }
  const hasPathChanged = path !== device.path
  if (hasPathChanged) {
    const isDeviceOnline = await this.isDeviceOnlineAsync({ id, path })

    if (!isDeviceOnline) raiseError(errorCodes.pathDoesNotMatchDevice)
  }
  await updateDeviceAsync({ id, name, description, path })
}

exports.removeDeviceAsync = async (id) => {
  const source = await getDeviceByIdAsync(id)
  if (!source) {
    raiseError(errorCodes.deviceDoesNotExist)
  }
  await deleteDeviceAsync(source.id)
}

exports.createBackupDeviceAsync = async (device) => {
  device.id = device.id || newId()
  device.deviceType = 'backup'
  const exists = await fs.exists(device.path)
  if (!exists) {
    raiseError(errorCodes.devicePathDoesNotExist)
  }

  if (await this.isExistingDeviceAsync(device.path)) raiseError(errorCodes.existingSource)
  // Backup devices must be local hdds on windows because we need to be able to read free space on drive
  if (process.platform === 'win32' && !device.path.includes(':')) {
    raiseError(errorCodes.pathNotSupported)
  }
  const createdDevice = await addDeviceAsync(device)

  await this.writeDeviceMetaFileAsync(createdDevice)
  return createdDevice
}
