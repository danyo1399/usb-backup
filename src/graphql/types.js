const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLEnumType
} = require('graphql')

exports.DeviceType = new GraphQLEnumType({ name: 'DeviceType', values: { source: { value: 'source' }, backup: { value: 'backup' } } })

exports.File = new GraphQLObjectType({
  name: 'File',
  fields: {
    id: { type: GraphQLInt },
    size: { type: GraphQLFloat },
    mtimeMs: { type: GraphQLFloat },
    hash: { type: GraphQLString },
    relativePath: { type: GraphQLString }
  }
})

exports.ReportFile = new GraphQLObjectType({
  name: 'ReportFile',
  fields: {
    id: { type: GraphQLInt },
    deviceId: { type: GraphQLString },
    deviceType: { type: this.DeviceType },
    deviceName: { type: GraphQLString },
    devicePath: { type: GraphQLString },
    size: { type: GraphQLFloat },
    mtimeMs: { type: GraphQLFloat },
    birthtimeMs: { type: GraphQLFloat },
    addDate: { type: GraphQLFloat },
    editDate: { type: GraphQLFloat },
    hash: { type: GraphQLString },
    relativePath: { type: GraphQLString }
  }
})

exports.SourceDevice = new GraphQLObjectType({
  name: 'SourceDevice',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLString
    },
    deviceType: {
      type: this.DeviceType
    },
    description: {
      type: GraphQLString
    },
    path: {
      type: GraphQLString
    },
    lastScanDate: {
      type: GraphQLFloat
    },
    orphanSize: {
      type: GraphQLFloat
    },
    usedSize: {
      type: GraphQLFloat
    },
    lastBackupDate: {
      type: GraphQLFloat
    },
    addDate: {
      type: GraphQLFloat
    }
  }
})

exports.BackupDevice = new GraphQLObjectType({
  name: 'BackupDevice',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    path: {
      type: GraphQLString
    },
    deviceType: {
      type: this.DeviceType
    },
    lastScanDate: {
      type: GraphQLFloat
    },
    orphanSize: {
      type: GraphQLFloat
    },
    usedSize: {
      type: GraphQLFloat
    },
    addDate: {
      type: GraphQLFloat
    }
  })
})

const Error = exports.Error = new GraphQLObjectType({
  name: 'Error',
  fields: {
    code: { type: GraphQLString },
    message: { type: GraphQLString }
  }
})

exports.GenericErrorResponse = new GraphQLObjectType({
  name: 'ErrorResponse',
  fields: {
    error: { type: Error }
  }
})
