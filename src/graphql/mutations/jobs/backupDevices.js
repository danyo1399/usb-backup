const { GraphQLInputObjectType, GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql')
const { emptyError } = require('../../../errors')
const { createBackupDevicesJobAsync } = require('../../../jobs/backupDeviceJob')
const { runJobAsync } = require('../../../jobs/jobManager')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

const BackupDevicesRequest = new GraphQLInputObjectType({
  name: 'BackupDevicesRequest',
  fields: {
    sourceDeviceIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString))
    },
    backupDeviceId: { type: new GraphQLNonNull(GraphQLString) }
  }
})

module.exports = {
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
        defaultLogger.error('backup devices error', response)
      }
      return response || emptyError()
    }
  }
}
