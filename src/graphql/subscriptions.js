const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLInputObjectType, GraphQLInt, GraphQLFloat } = require('graphql')
const { GraphQLJSONObject } = require('graphql-type-json')
const { deviceInfo } = require('../deviceInfo')
const jobManager = require('../jobs/jobManager')
const { toGraphqlIterator } = require('./utils')

const Job = new GraphQLObjectType({
  name: 'Job',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    status: { type: GraphQLString },
    description: { type: GraphQLString },
    errorCount: { type: GraphQLInt },
    active: { type: GraphQLBoolean },
    context: { type: GraphQLJSONObject }
  }
})

const JobLog = new GraphQLObjectType({
  name: 'JobLog',
  fields: {
    type: { type: GraphQLString },
    message: { type: GraphQLString }
  }
})

const GetJobLogsRequest = new GraphQLInputObjectType({
  name: 'GetJobLogsRequest',
  fields: {
    jobId: { type: GraphQLInt }
  }
})

const DeviceInfo = new GraphQLObjectType({
  name: 'DeviceInfo',
  fields: {
    id: { type: GraphQLString },
    isOnline: { type: GraphQLBoolean },
    freeSpace: { type: GraphQLFloat },
    totalSpace: { type: GraphQLFloat }
  }
})
module.exports = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    deviceInfo: {
      type: new GraphQLList(DeviceInfo),
      subscribe: async function () {
        const iterator = deviceInfo.iterator()
        return toGraphqlIterator(iterator, 'deviceInfo')
      }
    },
    jobs: {
      type: new GraphQLList(Job),
      subscribe: async function () {
        const jobs = jobManager.createJobsIterator()

        return toGraphqlIterator(jobs, 'jobs')
      }
    },
    jobLogs: {
      type: new GraphQLList(JobLog),
      args: { input: { type: GetJobLogsRequest } },
      subscribe: async function (_, { input: { jobId } }) {
        const logs = jobManager.createJobLogsIterator(jobId)

        return toGraphqlIterator(logs, 'jobLogs')
      }
    }
  }
})
