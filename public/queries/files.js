import { execute } from '../graphql.js'

export async function getFilesByDeviceIdAsync (deviceId) {
  const { data: { filesByDeviceId } } = await execute({
    query: `
            query ($input: FilesByDeviceIdRequest) {
              filesByDeviceId(input: $input) {
                id, hash, size, relativePath, mtimeMs
                }
            }
        `,
    variables: {
      input: {
        deviceId: deviceId
      }
    }
  })
  return filesByDeviceId
}

export async function reportFilesOnSourceWithNoBackupAsync (deviceId) {
  const { data: { reportFilesOnSourceWithNoBackupAsync } } = await execute({
    query: `
            query {
              reportFilesOnSourceWithNoBackupAsync {
                id, hash, size, relativePath, mtimeMs, deviceName, birthtimeMs, addDate, editDate, devicePath
                }
            }
        `
  })
  return reportFilesOnSourceWithNoBackupAsync
}

export async function reportFilesOnBackupWithNoSourceAsync (deviceId) {
  const { data: { reportFilesOnBackupWithNoSourceAsync } } = await execute({
    query: `
            query {
              reportFilesOnBackupWithNoSourceAsync {
                id, hash, size, relativePath, mtimeMs, deviceName, birthtimeMs, addDate, editDate, devicePath
                }
            }
        `
  })
  return reportFilesOnBackupWithNoSourceAsync
}

export async function reportDuplicateFilesOnSourceDevicesAsync (deviceId) {
  const { data: { reportDuplicateFilesOnSourceDevicesAsync } } = await execute({
    query: `
            query {
              reportDuplicateFilesOnSourceDevicesAsync {
                id, hash, size, relativePath, mtimeMs, deviceName, birthtimeMs, addDate, editDate, devicePath
                }
            }
        `
  })
  return reportDuplicateFilesOnSourceDevicesAsync
}
