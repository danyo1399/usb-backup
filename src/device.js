const _path = require('path')
const fs = require('fs-extra')
const util = require('util')
const glob = util.promisify(require('glob'))

const FILE_SUFFIX = '.usbb'
const META_FILE_GLOB = `*${FILE_SUFFIX}`

function getMetaFilePath ({ path, id }) {
  return _path.join(path, `${id}${FILE_SUFFIX}`)
}

exports.deviceName = (device) => {
  const { id, name } = device
  return `${id}: ${name}`
}

exports.isDeviceOnlineAsync = async ({ path, id }) => {
  const metaFile = getMetaFilePath({ path, id })
  const exists = await fs.pathExists(metaFile)
  return exists
}

/**
 * Writes the device and files to a json file at the root of the device
 * @param {*} device
 * @param {*} files
 *
 * @description
 * We store a copy of the device details and its files on the backup device
 * Could be used in future to restore a lost database from the meta data files
 */
exports.createDeviceMetaFileAsync = async (device, files = []) => {
  const file = _path.join(device.path, `${device.id}${FILE_SUFFIX}`)

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
  const files = await glob(_path.join(path, META_FILE_GLOB))
  return files.length > 0
}

exports.isMetafile = (path) => {
  return /^[a-f0-9]{32}\.usbb$/.test(path)
}
