export default {
  routes: {
    sources: '/sources',
    backupDevices: '/backup-devices',
    jobs: '/jobs',
    test: '/test',
    jobLog: '/jobs/:jobId',
    viewFiles: '/view-files/:deviceId',
    getViewFilesUrl (deviceId) {
      return this.viewFiles.replace(':deviceId', deviceId)
    },
    getJobLogUrl (jobId) {
      return this.jobLog.replace(':jobId', jobId)
    }
  }
}
