const { writeDeviceMetaFileAsync } = require('../app')
const { newIdNumber } = require('../utils')
const checkDiskSpace = require('check-disk-space').default
const path = require('path')
const {
  getDeviceByIdAsync, getSourceFilesToBackupAsync, updateLastBackupDate
} = require('../repo')
const { assertDeviceOnlineAsync } = require('../device')
const { scanDevices } = require('./scanDeviceJob')
const { ensureFilePathExistsAsync, appendFilePathToPath } = require('../path')
const { createFileAsync, copyFileAsync } = require('../file')

exports.createBackupDevicesJobAsync = async (sourceDeviceIds, backupDeviceId) => {
  const id = newIdNumber()
  let _abort = false

  const sources = (await Promise.all(sourceDeviceIds.map(id => getDeviceByIdAsync(id)))).map(src => `[${src.name}]`)
  const backupDevice = await getDeviceByIdAsync(backupDeviceId)
  const description = `backup up devices ${sources.join(', ')} to device [${backupDevice.name}]`

  async function executeAsync (log) {
    const context = { log, sourceDevice: null, freeSpace: null, addedHashes: {}, backupDevice: null, sourceFile: null }
    context.backupDevice = await assertDeviceOnlineAsync(backupDeviceId, { deviceType: 'backup' })

    log.info('Scanning devices before backup')
    await scanDevices(log, [...sourceDeviceIds, backupDeviceId], () => _abort)

    for (const deviceId of sourceDeviceIds) {
      if (_abort) break

      log.debug(`Backing up source device ${deviceId}`)
      context.sourceDevice = await assertDeviceOnlineAsync(deviceId, { deviceType: 'source' })

      const filesToBackup = await getSourceFilesToBackupAsync(context.sourceDevice.id)

      log.info(`Backing up ${filesToBackup.length} files from source device [${context.sourceDevice.name}]`)

      context.freeSpace = (await checkDiskSpace(context.backupDevice.path)).free

      for (const f of filesToBackup) {
        context.sourceFile = f

        try {
          if (context.addedHashes[context.sourceFile.hash]) {
            log.info(`Another file backed up has same contents. skipping ${context.sourceFile.relativePath}`)
            continue
          }

          if (context.freeSpace < context.sourceFile.size) {
            log.error(`Not enough free space. Skipping ${context.sourceFile.relativePath}`)
            continue
          }

          await backupFile(log, context)
        } catch (error) {
          handleBackupFileError(error, log, context)
        }
      }

      const pendingFilesAfterBackup = await getSourceFilesToBackupAsync(context.sourceDevice.id)
      if (pendingFilesAfterBackup.length === 0) {
        log.debug('Updating last backup date')
        await updateLastBackupDate(context.sourceDevice.id, Date.now())
      } else {
        log.error(`Not all files were backed up: ${pendingFilesAfterBackup.length} files remaining`)
      }

      log.debug('Writing backup metafile')
      await writeDeviceMetaFileAsync(context.backupDevice)
    }
  }

  async function handleBackupFileError (error, log, context) {
    log.error(`failed backing up file ${context.sourceFile.relativePath}. Skipping (${error.message})`, error)

    // Update free space in case insufficient space caused copy to fail
    try {
      context.freeSpace = (await checkDiskSpace(context.backupDevice.path)).free
    } catch (error) {
      // NOOP
    }
  }

  async function backupFile (log, context) {
    const sourceFilename = path.join(context.sourceDevice.path, context.sourceFile.relativePath)
    const targetFilename = appendFilePathToPath(sourceFilename, context.backupDevice.path)
    await ensureFilePathExistsAsync(targetFilename)

    log.info(`Copying file to backup device ${sourceFilename} -> ${targetFilename}`)

    const { hash: backupHash, basename: newTargetFilename } = await copyFileAsync(sourceFilename, targetFilename, { appendSuffix: true })

    context.freeSpace -= context.sourceFile.size

    if (backupHash !== context.sourceFile.hash) {
      log.warn(`Source file hash differs from backup file. source ${context.sourceFile.hash}, destination ${backupHash}`)
    }

    if (newTargetFilename !== targetFilename) {
      log.warn(`target filename already exists, used unique filename ${newTargetFilename}`)
    }

    await createFileAsync(context.backupDevice, targetFilename, { hash: backupHash })

    // two files to backup could have the same hash. We only want to copy one of them
    context.addedHashes[backupHash] = true
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, description, context: { sourceDeviceIds, backupDeviceId }, abort, name: 'BackupDeviceJob' }
}
