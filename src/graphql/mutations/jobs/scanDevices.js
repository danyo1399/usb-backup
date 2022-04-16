const { GraphQLInputObjectType, GraphQLNonNull, GraphQLList, GraphQLBoolean, GraphQLString } = require('graphql')
const { emptyError } = require('../../../errors')
const { runJobAsync } = require('../../../jobs/jobManager')
const { createScanDeviceJobAsync } = require('../../../jobs/scanDeviceJob')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

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

module.exports = {
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
