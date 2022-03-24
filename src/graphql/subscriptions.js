const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLInputObjectType, GraphQLInt } = require('graphql')
const { GraphQLJSONObject } = require('graphql-type-json')
const jobManager = require('../jobs/jobManager')

const Job = new GraphQLObjectType({
  name: 'Job',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    status: { type: GraphQLString },
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

module.exports = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    jobs: {
      type: new GraphQLList(Job),
      subscribe: async function () {
        const jobs = jobManager.createJobsIterator()

        return {
          [Symbol.asyncIterator] () {
            return this
          },

          next: async function next () {
            const { value, done } = await jobs.next()
            return { value: { jobs: value }, done }
          },
          return () {
            return jobs.return()
          }
        }
      }
    },
    jobLogs: {
      type: new GraphQLList(JobLog),
      args: { input: { type: GetJobLogsRequest } },
      subscribe: async function (_, { input: { jobId } }) {
        const logs = jobManager.createJobLogsIterator(jobId)

        return {
          [Symbol.asyncIterator] () {
            return this
          },

          next: async function next () {
            const { value, done } = await logs.next()
            return { value: { jobLogs: value }, done }
          },
          return () {
            return logs.return()
          }
        }
      }
    }
  }
})
