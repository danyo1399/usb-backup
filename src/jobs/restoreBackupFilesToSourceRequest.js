const { newIdNumber } = require('../utils')
const {
  findFilesByPathAsync,
  getFileByDeviceAndHashAsync

} = require('../repo')
const { assertDeviceOnlineAsync, writeDeviceMetaFileAsync } = require('../device')
const _path = require('path')
const { copyFileAsync, createFileAsync } = require('../file')
const fs = require('fs-extra')
const { joinPaths: joinPath, endsWithPathSeperator, joinPaths, basename } = require('../path')

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
    sourcePaths = sourcePaths.map(x => x.replaceAll('\\', '/')).map(p => p.startsWith('/') ? p.substr(1) : p)
    for (const path of sourcePaths) {
      if (_abort) break
      const files = await findFilesByPathAsync(backupDeviceId, path)
      for (const file of files) {
        if (_abort) break
        const sourcePath = joinPaths(backupDevice.path, file.relativePath)
        const existingFile = await getFileByDeviceAndHashAsync(sourceDeviceId, file.hash)
        const targetPath = _getTargetPath(path, file.relativePath, copyToRelativePath, sourceDevice.path)
        const sourceFileExists = await fs.pathExists(sourcePath)
        if (!sourceFileExists) {
          log.error(`backup file does not exist on device ${sourcePath}`)
          continue
        }
        if (existingFile) {
          log.warn(`Skipping file as another file with the same hash exists on source. ${sourcePath}, ${file.hash}`)
          continue
        }
        log.debug(`copying file ${sourcePath} -> ${targetPath}`)
        const { hash, path: newPath } = await copyFileAsync(sourcePath, targetPath, { overwrite: true })
        log.info(`copied file from ${sourcePath} to ${newPath}`)
        await createFileAsync(sourceDevice, newPath, { hash: hash })
      }
    }

    await writeDeviceMetaFileAsync(sourceDevice)
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, description, abort, name }
}

const _getTargetPath = exports._getTargetPath = (srcPath, fileRelativePath, copyToRelativePath, devicePath) => {
  const isFile = !endsWithPathSeperator(srcPath)
  if (isFile) {
    return joinPath(devicePath, copyToRelativePath, basename(srcPath))
  } else {
    return joinPath(devicePath, copyToRelativePath, basename(srcPath), fileRelativePath.substr(srcPath.length - 1))
  }
}
