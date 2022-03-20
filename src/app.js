/*
this module contains the application apis
 */
const repo = require('./repo')
const fs = require('fs-extra')

const { raiseError, errorCodes, createFileId, newId, createFile } = require('./fns')
const { isDeviceOnlineAsync, isExistingDeviceAsync, createDeviceMetaFileAsync, isMetafile } = require('./devices')
const { getRelativePath } = require('./path')
const { hashFileAsync } = require('./crypto')

/*
Files
==================================================================================
*/
exports.addFileAsync = async (device, filename, hash) => {
  const relativePath = getRelativePath({ basePath: device.path, filePath: filename })
  const stat = await fs.stat(filename)
  const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })
  await repo.addFileAsync(newFile)
}
/*

Source Devices
==========================================================================
*/

exports.scanFileHoc = ({ device, existsAsync, addAsync, onNewFile }) => {
  return async ({ filename, stat }) => {
    const relativePath = getRelativePath({ basePath: device.path, filePath: filename })

    if (isMetafile(relativePath) === false) {
      const fileId = createFileId({ deviceId: device.id, relativePath, stat })
      const fileExists = await existsAsync(fileId)
      if (!fileExists) {
        const hash = await hashFileAsync(filename)
        const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })
        onNewFile && onNewFile(filename)
        await addAsync(newFile)
      }
      return fileId
    }
  }
}

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
  if (process.arch === 'win32' && !device.path.contains(':')) {
    raiseError(errorCodes.pathNotSupported)
  }
  const createdDevice = await repo.addDeviceAsync(device)

  await createDeviceMetaFileAsync(createdDevice)
  return createdDevice
}
