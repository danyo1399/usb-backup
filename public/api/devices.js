
import { toObservable, execute, handleResponseError } from './graphql.js'
import * as globals from '../globals.js'
const { rxjs } = globals
/*
Devices
==================================================================================
*/

export const deviceInfo$ = toObservable({
  query: `
  subscription {
    deviceInfo {
      id, isOnline, freeSpace, totalSpace
    }
  }
`
}).pipe(
  rxjs.map(x => x.data.deviceInfo),
  rxjs.mergeAll(),
  rxjs.scan((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
  rxjs.shareReplay(1))

/*
Source Devices
==================================================================================
*/
export async function getSourceDevicesAsync () {
  const { data: { sourceDevices } } = await execute({
    query: `
            query {
                sourceDevices {
                id, name, description, path, lastScanDate, lastBackupDate, deviceType
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

  handleResponseError(response)
  return response
}

export async function removeDeviceAsync ({ id }) {
  const response = await execute({
    query: `
        mutation ($input: String) {
            removeDevice(input: $input) {
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

export async function scanDevicesAsync (deviceIds, useFullScan) {
  const response = await execute({
    query: `
      mutation ($input: ScanDevicesRequest) {
        scanDevices(input: $input) {
          error {code, message}
        }
      }
    `,
    variables: {
      input: { devices: deviceIds, useFullScan }
    }
  })

  handleResponseError(response)
  return response
}

/*
Backup devices
==================================================================================
*/

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

export async function getBackupDevicesAsync () {
  const { data: { backupDevices } } = await execute({
    query: `
                query {
                    backupDevices {
                    id, name, description, path, lastScanDate, deviceType
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

  handleResponseError(response)
  return response
}

export async function refreshDeviceInfoAsync () {
  const response = await execute({
    query: `
    mutation {
      refreshDeviceInfo {
        error {code, message}
      }
    }`
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
