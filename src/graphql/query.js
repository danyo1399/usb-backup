const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInputObjectType
} = require('graphql')
const { defaultLogger } = require('../logging')
const repo = require('../repo')
const { SourceDevice, BackupDevice, File, ReportFile } = require('./types')

const FilesByDeviceIdRequest = new GraphQLInputObjectType({
  name: 'FilesByDeviceIdRequest',
  fields: {
    deviceId: { type: GraphQLString }
  }
})
module.exports = new GraphQLObjectType({
  name: 'Query',
  fields: {
    version: {
      type: GraphQLString,
      resolve: async () => {
        const pkg = require('../../package.json')
        return pkg.version
      }
    },
    sourceDevices: {
      type: new GraphQLList(SourceDevice),
      resolve: async () => {
        const data = await repo.getDevicesAsync('source')
        return data
      }
    },
    backupDevices: {
      type: new GraphQLList(BackupDevice),
      resolve: async () => {
        const data = await repo.getDevicesAsync('backup')
        return data
      }
    },
    filesByDeviceId: {
      type: new GraphQLList(File),
      args: {
        input: { type: FilesByDeviceIdRequest }
      },
      resolve: async (_, { input: { deviceId } }) => {
        let response
        try {
          response = await repo.getFilesByDeviceAsync(deviceId)
        } catch (err) {
          defaultLogger.error('failed to get files', err)
        }

        return response
      }
    },
    reportFilesOnSourceWithNoBackupAsync: {
      type: new GraphQLList(ReportFile),
      resolve: async () => {
        const data = await repo.reportFilesOnSourceWithNoBackupAsync()
        return data
      }
    },
    reportFilesOnBackupWithNoSourceAsync: {
      type: new GraphQLList(ReportFile),
      resolve: async () => {
        const data = await repo.reportFilesOnBackupWithNoSourceAsync()
        return data
      }
    },
    reportDuplicateFilesOnSourceDevicesAsync: {
      type: new GraphQLList(ReportFile),
      resolve: async () => {
        const data = await repo.reportDuplicateFilesOnDeviceTypeAsync('source')
        return data
      }
    },
    reportDuplicateFilesOnBackupDevicesAsync: {
      type: new GraphQLList(ReportFile),
      resolve: async () => {
        const data = await repo.reportDuplicateFilesOnDeviceTypeAsync('backup')
        return data
      }
    }
  }
})
