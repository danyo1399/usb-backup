const { GraphQLInputObjectType, GraphQLString, GraphQLList } = require('graphql')
const { emptyError } = require('../../../errors')
const { runJobAsync } = require('../../../jobs/jobManager')
const { createRestoreBackupFilesToSourceRequest } = require('../../../jobs/restoreBackupFilesToSourceRequest')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

const RestoreBackupFilesToSourceRequest = new GraphQLInputObjectType({
  name: 'RestoreBackupFilesToSourceRequest',
  fields: {
    sourceDeviceId: { type: GraphQLString },
    backupDeviceId: { type: GraphQLString },
    relativePath: { type: GraphQLString },
    paths: { type: new GraphQLList(GraphQLString) }
  }
})

module.exports = {
  restoreBackupFilesToSourceRequest: {
    type: GenericErrorResponse,
    args: {
      input: { type: RestoreBackupFilesToSourceRequest }
    },
    resolve: async (_, args) => {
      let response
      const { input: { sourceDeviceId, backupDeviceId, relativePath, paths } } = args

      try {
        const job = await createRestoreBackupFilesToSourceRequest(backupDeviceId, sourceDeviceId, relativePath, paths)
        runJobAsync(job)
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('crete copy from backup device job error', response)
      }
      return response || emptyError()
    }
  }
}
