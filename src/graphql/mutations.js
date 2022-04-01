const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean
} = require('graphql')

const { SourceDevice, BackupDevice, GenericErrorResponse, Error } = require('./types')
const app = require('../app')
const { createScanDeviceJobAsync } = require('../jobs/scanDeviceJob')
const { runJobAsync } = require('../jobs/jobManager')
const { createBackupDevicesJobAsync } = require('../jobs/backupDeviceJob')
const { defaultLogger } = require('../logging')
const { toGraphqlErrorSection } = require('./utils')
const { emptyError } = require('../errors')
const { deviceInfo } = require('../deviceInfo')

function sourceDeviceMutations () {
  const CreateSourceDeviceRequest = new GraphQLInputObjectType({
    name: 'CreateSourceDeviceRequest',
    fields: {
      name: { type: GraphQLString },
      description: { type: GraphQLString },
      path: { type: GraphQLString }
    }
  })

  const AddSourceDeviceResponse = new GraphQLObjectType({
    name: 'AddSourceDeviceResponse',
    fields: {
      device: { type: SourceDevice },
      error: { type: Error }
    }
  })

  const UpdateSourceDeviceRequest = new GraphQLInputObjectType({
    name: 'UpdateSourceDeviceRequest',
    fields: {
      id: { type: GraphQLString },
      device: { type: CreateSourceDeviceRequest }
    }
  })

  return {
    updateSourceDevice: {
      type: GenericErrorResponse,
      args: {
        input: { type: UpdateSourceDeviceRequest }
      },
      resolve: async (a, args) => {
        let response
        const {
          input: {
            id,
            device: { name, path, description }
          }
        } = args
        try {
          await app.updateDeviceAsync({ id, name, description, path })
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('edit source device', response)
        }
        return response || { error: null }
      }
    },

    addSourceDevice: {
      type: AddSourceDeviceResponse,
      args: {
        input: { type: CreateSourceDeviceRequest }
      },
      resolve: async (a, { input }) => {
        let response
        try {
          const device = await app.createSourceDeviceAsync(input)
          response = { device: device, error: response }
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('add source device error', response)
        }
        return response
      }
    },
    removeSourceDevice: {
      type: GenericErrorResponse,
      args: {
        input: { type: GraphQLString }
      },
      resolve: async (a, { input: id }) => {
        let response
        try {
          await app.removeDeviceAsync(id)
          response = { error: null }
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('remove backup source error', response)
        }

        return response
      }
    }
  }
}

function backupDeviceMutations () {
  const CreateBackupDeviceRequest = new GraphQLInputObjectType({
    name: 'CreateBackupDeviceRequest',
    fields: {
      name: { type: GraphQLString },
      description: { type: GraphQLString },
      path: { type: GraphQLString }
    }
  })

  const AddBackupDeviceResponse = new GraphQLObjectType({
    name: 'AddBackupDeviceResponse',
    fields: {
      device: { type: BackupDevice },
      error: { type: Error }
    }
  })

  const UpdateBackupDeviceRequest = new GraphQLInputObjectType({
    name: 'UpdateBackupDeviceRequest',
    fields: {
      id: { type: GraphQLString },
      device: { type: CreateBackupDeviceRequest }
    }
  })
  return {
    updateBackupDevice: {
      type: GenericErrorResponse,
      args: {
        input: { type: UpdateBackupDeviceRequest }
      },
      resolve: async (a, args) => {
        let response
        const {
          input: {
            id,
            device: { name, path, description }
          }
        } = args
        try {
          await app.updateDeviceAsync({ id, name, description, path })
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('edit backup device error', response)
        }
        return response || { error: null }
      }
    },

    addBackupDevice: {
      type: AddBackupDeviceResponse,
      args: {
        input: { type: CreateBackupDeviceRequest }
      },
      resolve: async (a, { input }) => {
        let response
        try {
          const device = await app.createBackupDeviceAsync(input)
          response = { device: device, error: response }
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('add backup error', response)
        }
        return response
      }
    },
    removeBackupDevice: {
      type: GenericErrorResponse,
      args: {
        input: { type: GraphQLString }
      },
      resolve: async (a, { input: id }) => {
        let response
        try {
          await app.removeDeviceAsync(id)
          response = { error: null }
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('remove backup device error', response)
        }

        return response
      }
    }
  }
}

function jobMutations () {
  const ScanDevicesRequest = new GraphQLInputObjectType({
    name: 'ScanDevicesRequest',
    fields: {
      devices: {
        type: new GraphQLList(new GraphQLNonNull(GraphQLString))
      },
      useFullScan: {
        type: GraphQLBoolean
      }
    }
  })

  const BackupDevicesRequest = new GraphQLInputObjectType({
    name: 'BackupDevicesRequest',
    fields: {
      sourceDeviceIds: {
        type: new GraphQLNonNull(new GraphQLList(GraphQLString))
      },
      backupDeviceId: { type: new GraphQLNonNull(GraphQLString) }
    }
  })
  return {
    refreshDeviceInfo: {
      type: GenericErrorResponse,
      resolve: async () => {
        await deviceInfo.refresh()
      }
    },
    backupDevices: {
      type: GenericErrorResponse,
      args: {
        input: { type: BackupDevicesRequest }
      },
      resolve: async (_, args) => {
        let response
        const {
          input: { sourceDeviceIds, backupDeviceId }
        } = args

        try {
          const job = await createBackupDevicesJobAsync(sourceDeviceIds, backupDeviceId)
          runJobAsync(job)
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('edit backup device error', response)
        }
        return response || emptyError()
      }
    },
    scanDevices: {
      type: GenericErrorResponse,
      args: {
        input: { type: ScanDevicesRequest }
      },
      resolve: async (_, args) => {
        let response
        const {
          input: { devices: sourceDeviceIds, useFullScan }
        } = args
        try {
          const job = await createScanDeviceJobAsync({ sourceDeviceIds, useFullScan })
          runJobAsync(job)
        } catch (err) {
          response = toGraphqlErrorSection(err)
          defaultLogger.error('scan devices error', response)
        }
        return response || emptyError()
      }
    }
  }
}

module.exports = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    ...sourceDeviceMutations(),
    ...backupDeviceMutations(),
    ...jobMutations()
  }
})
