const { newIdNumber } = require('../utils')
const {
  deleteFileAsync,
  getFilesByDeviceAsync

} = require('../repo')
const fs = require('fs-extra')
const { assertDeviceOnlineAsync } = require('../device')
const { appendFilePathToPath } = require('../path')

module.exports.createRemoveBackupDuplicatesJobAsync = async (...backupDeviceIds) => {
  const context = { backupDeviceIds }
  const id = newIdNumber()
  let _abort = false
  async function executeAsync (log) {
    for (const backupDeviceId of backupDeviceIds) {
      const device = await assertDeviceOnlineAsync(backupDeviceId, { deviceType: 'backup' })
      log.info(`Processing device ${device.name}`)
      const files = await getFilesByDeviceAsync(device.id)
      const hashMap = {}
      for (const file of files) {
        if (_abort) break
        if (hashMap[file.hash] === true) {
          const filePath = appendFilePathToPath(file.relativePath, device.path)
          try {
            log.info(`Deleting duplicate file ${filePath} with hash ${file.hash}`)
            await fs.remove(filePath)
            await deleteFileAsync(file.id)
          } catch (error) {
            log.error(`Failed to delete file at path ${filePath} with id ${file.id}`)
          }
        }
        hashMap[file.hash] = true
      }
    }
  }

  async function abort () {
    _abort = true
  }

  return { id, executeAsync, context, description: 'Remove backup device duplicate files', abort, name: 'removeBackupDuplicatesJob' }
}
