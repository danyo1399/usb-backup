const {
  GraphQLObjectType
} = require('graphql')

const refreshDeviceInfo = require('./devices/refreshDeviceInfo')
const updateBackupDevice = require('./devices/updateBackupDevice')
const addBackupDevice = require('./devices/addBackupDevice')
const removeDevice = require('./devices/removeDevice')
const addSourceDevice = require('./devices/addSourceDevice')
const restoreBackupFilesToSource = require('./jobs/restoreBackupFilesToSource')
const removeBackupDuplicatesJob = require('./jobs/removeBackupDuplicatesJob')
const backupDevices = require('./jobs/backupDevices')
const scanDevices = require('./jobs/scanDevices')
const updateSourceDevice = require('./devices/updateSourceDevice')

function deviceMutations () {
  return {
    ...refreshDeviceInfo,
    ...updateBackupDevice,
    ...addBackupDevice,
    ...removeDevice,
    ...addSourceDevice,
    ...updateSourceDevice
  }
}

function jobMutations () {
  return {
    ...restoreBackupFilesToSource,
    ...removeBackupDuplicatesJob,
    ...backupDevices,
    ...scanDevices
  }
}

module.exports = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    ...deviceMutations(),
    ...jobMutations()
  }
})
