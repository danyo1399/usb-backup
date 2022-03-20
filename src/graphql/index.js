const {
  GraphQLSchema
} = require('graphql')
const { sourceDevice } = require('./types')

const mutation = require('./mutations')
const query = require('./query')
const subscription = require('./subscriptions')

module.exports.schema = new GraphQLSchema({
  types: [sourceDevice],
  query,
  mutation,
  subscription
})
