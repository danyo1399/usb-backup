export default {
  routes: {
    sources: '/sources',
    backupDevices: '/backup-devices',
    jobs: '/jobs',
    jobLog: '/jobs/:jobId',
    getJobLogUrl (jobId) {
      return this.jobLog.replace(':jobId', jobId)
    }
  }
}
