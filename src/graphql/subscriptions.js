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
        const jobs = jobManager.getJobChangeIterator()

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
        const logs = jobManager.getJobLogIterator(jobId)

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
    },
    greetings: {
      type: GraphQLString,
      // subscribe: async function* () {
      //   for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
      //     yield { greetings: hi }
      //   }
      // },

      subscribe: async function () {
        return {
          [Symbol.asyncIterator] () {
            return this
          },
          list: ['hello', 'world'],
          index: 0,
          next: async function next () {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            if (this.index < this.list.length) {
              const value = this.list[this.index]
              this.index++
              return { done: false, value: { greetings: value } }
            }
            return { done: true }
          }
        }
      }
    }
  }
})
