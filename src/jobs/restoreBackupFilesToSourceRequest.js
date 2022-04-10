const { newIdNumber } = require('../utils')
const {
  findFilesByPathAsync,
  getFileByDeviceAndHashAsync

} = require('../repo')
const { assertDeviceOnlineAsync } = require('../device')
const _path = require('path')
const { copyFileAsync, createFileAsync } = require('../file')
const fs = require('fs-extra')

exports.createRestoreBackupFilesToSourceRequest = async (backupDeviceId, sourceDeviceId, copyToRelativePath, sourcePaths) => {
  const description = 'Copy files from backup device'
  const name = 'copyFromBackupDevice'

  const context = { backupDeviceId, sourceDeviceId }
  const id = newIdNumber()
  let _abort = false
  async function executeAsync (log) {
    const backupDevice = await assertDeviceOnlineAsync(backupDeviceId, { deviceType: 'backup' })
    const sourceDevice = await assertDeviceOnlineAsync(sourceDeviceId, { deviceType: 'source' })

    // remove any leading slashes
    sourcePaths = sourcePaths.map(p => p.startsWith('/') || p.startsWith('\\') ? p.substr(1) : p)
    for (const path of sourcePaths) {
      if (_abort) break
      const files = await findFilesByPathAsync(backupDeviceId, path)
      for (const file of files) {
        if (_abort) break
        const sourcePath = _path.join(backupDevice.path, file.relativePath)
        const existingFile = await getFileByDeviceAndHashAsync(sourceDeviceId, file.hash)
        const targetPath = _path.join(sourceDevice.path, copyToRelativePath, file.relativePath)
        const sourceFileExists = await fs.pathExists(sourcePath)
        if (!sourceFileExists) {
          log.error(`backup file does not exist on device ${sourcePath}`)
          continue
        }
        if (existingFile) {
          log.warn(`Skipping file as another file with the same hash exists on source. ${sourcePath}, ${file.hash}`)
          continue
        }
        const { hash, path } = await copyFileAsync(sourcePath, targetPath, { overwrite: true })
        log.info(`copied file from ${sourcePath} to ${path}`)
        await createFileAsync(sourceDevice, path, { hash: hash })
      }
    }
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, description, abort, name }
}
