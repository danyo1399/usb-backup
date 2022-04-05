export default {
  routes: {
    sources: '/sources',
    backupDevices: '/backup-devices',
    jobs: '/jobs',
    test: '/test',
    jobLog: '/jobs/:jobId',
    viewFiles: '/view-files/:deviceId',
    files: '/files/:tab',
    getFilesUrl (tab) {
      return this.files.replace(':tab', tab || 'pending')
    },
    getViewFilesUrl (deviceId) {
      return this.viewFiles.replace(':deviceId', deviceId)
    },
    getJobLogUrl (jobId) {
      return this.jobLog.replace(':jobId', jobId)
    }
  }
}
