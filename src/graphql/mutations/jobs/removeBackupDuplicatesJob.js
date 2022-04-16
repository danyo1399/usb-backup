const { GraphQLInputObjectType, GraphQLNonNull, GraphQLList, GraphQLString } = require('graphql')
const { emptyError } = require('../../../errors')
const { runJobAsync } = require('../../../jobs/jobManager')
const { createRemoveBackupDuplicatesJobAsync } = require('../../../jobs/removeBackupDuplicatesJob')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

const DeleteDuplicatesRequest = new GraphQLInputObjectType({
  name: 'DeleteDuplicatesRequest',
  fields: {
    backupDeviceIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString))
    }
  }
})

module.exports = {
  removeBackupDuplicatesJob: {
    type: GenericErrorResponse,
    args: {
      input: { type: DeleteDuplicatesRequest }
    },
    resolve: async (_, args) => {
      let response
      const {
        input: { backupDeviceIds }
      } = args

      try {
        const job = await createRemoveBackupDuplicatesJobAsync(...backupDeviceIds)
        runJobAsync(job)
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('remove backup duplicates job error', response)
      }
      return response || emptyError()
    }
  }
}
