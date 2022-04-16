const { GraphQLObjectType } = require('graphql')
const { createBackupDeviceAsync } = require('../../../device')
const { defaultLogger } = require('../../../logging')
const { BackupDevice, Error } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')
const { CreateBackupDeviceRequest } = require('../types')

const AddBackupDeviceResponse = new GraphQLObjectType({
  name: 'AddBackupDeviceResponse',
  fields: {
    device: { type: BackupDevice },
    error: { type: Error }
  }
})

module.exports = {
  addBackupDevice: {
    type: AddBackupDeviceResponse,
    args: {
      input: { type: CreateBackupDeviceRequest }
    },
    resolve: async (a, { input }) => {
      let response
      try {
        const device = await createBackupDeviceAsync(input)
        response = { device: device, error: response }
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('add backup error', response)
      }
      return response
    }
  }
}
