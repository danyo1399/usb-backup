
import { execute, handleResponseError } from '../../index.js'

/*
Source Devices
==================================================================================
*/
export async function getSourceDevicesAsync () {
  const { data: { sourceDevices } } = await execute({
    query: `
            query {
                sourceDevices {
                id, name, description, path, lastScanDate
                }
            }
        `
  })
  return sourceDevices
}

export async function updateSourceDeviceAsync ({ id, name, description, path }) {
  const response = await execute({
    query: `mutation ($input: UpdateSourceDeviceRequest) {
                    updateSourceDevice(input: $input) {
                        error {code, message}
                    }
                }`,
    variables: {
      input: {
        id,
        device: {
          name,
          description,
          path

        }
      }
    }
  })

  return response
}

export async function removeSourceDeviceAsync ({ id }) {
  const response = await execute({
    query: `
        mutation ($input: String) {
            removeSourceDevice(input: $input) {
                error {code, message}
            }
        }
        `,
    variables: {
      input: id
    }
  })

  handleResponseError(response)
  return response
}

export async function createSourceDeviceAsync ({ name, description, path }) {
  const response = await execute({
    query: `mutation ($input: CreateSourceDeviceRequest) {
            addSourceDevice(input: $input) {
                        error {code, message}
                    }
                }`,
    variables: {
      input: {
        name,
        description,
        path
      }
    }
  })

  handleResponseError(response)
  return response
}

export async function scanDevicesAsync (deviceIds) {
  const response = await execute({
    query: `
      mutation ($input: ScanDevicesRequest) {
        scanDevices(input: $input) {
          error {code, message}
        }
      }
    `,
    variables: {
      input: { devices: deviceIds }
    }
  })

  handleResponseError(response)
  return response
}

export async function createBackupDevicesJobAsync (sourceDeviceIds, backupDeviceId) {
  const response = await execute({
    query: `
      mutation ($input: BackupDevicesRequest) {
        backupDevices(input: $input) {
          error {code, message}
        }
      }
    `,
    variables: {
      input: { sourceDeviceIds, backupDeviceId }
    }
  })

  handleResponseError(response)
  return response
}

/*
Backup devices
==================================================================================
*/

export async function getBackupDevicesAsync () {
  const { data: { backupDevices } } = await execute({
    query: `
                query {
                    backupDevices {
                    id, name, description, path, lastScanDate
                    }
                }
            `
  })
  return backupDevices
}
export async function updateBackupDeviceAsync ({ id, name, description, path }) {
  const response = await execute({
    query: `mutation ($input: UpdateBackupDeviceRequest) {
                    updateBackupDevice(input: $input) {
                        error {code, message}
                    }
                }`,
    variables: {
      input: {
        id,
        device: {
          name,
          description,
          path

        }
      }
    }
  })

  return response
}

export async function removeBackupDeviceAsync ({ id }) {
  const response = await execute({
    query: `
        mutation ($input: String) {
            removeBackupDevice(input: $input) {
                error {code, message}
            }
        }
        `,
    variables: {
      input: id
    }
  })

  handleResponseError(response)
  return response
}

export async function createBackupDeviceAsync ({ name, description, path }) {
  const response = await execute({
    query: `mutation ($input: CreateBackupDeviceRequest) {
            addBackupDevice(input: $input) {
                        error {code, message}
                    }
                }`,
    variables: {
      input: {
        name,
        description,
        path
      }
    }
  })

  handleResponseError(response)
  return response
}
