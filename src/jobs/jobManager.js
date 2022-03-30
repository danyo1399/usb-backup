
let jobIds = []
let jobStates = {}

const JOB_STATUSES = exports.JOB_STATUSES = { pending: 'pending', success: 'success', failed: 'failed', cancelled: 'cancelled', running: 'running' }
const ACTIVE_STATUSES = ['pending', 'running']

exports.reset = () => {
  jobIds = []
  jobStates = {}
  jobEmitter.removeAllListeners()
}

const EventEmitter = require('events')
const { createEmitterAsyncIterator, createEmitterWithCallbackAsyncIterator } = require('../utils')
const { logLevels, createLogger, defaultLogger } = require('../logging')
class JobEmitter extends EventEmitter {

}

const JOB_EVENTS = { jobUpdated: 'jobUpdated', jobFinished: 'jobFinished', logAdded: 'logAdded' }

const jobEmitter = exports.jobEmitter = new JobEmitter({ captureRejections: true })
jobEmitter.addListener('error', (err) => {
  defaultLogger.error('An error occured with in job emitter', err)
})

function createJobLogger (state) {
  const log = state.logs
  const id = state.job.id

  return createLogger({
    debug (message, ...context) {
      log.push({ timestamp: Date.now(), type: logLevels.debug, message, context })
      console.debug(message, ...context)
      jobEmitter.emit(JOB_EVENTS.logAdded, id)
    },
    info (message, ...context) {
      log.push({ timestamp: Date.now(), type: logLevels.info, message, context })
      console.info(message, ...context)
      jobEmitter.emit(JOB_EVENTS.logAdded, id)
    },
    warn (message, ...context) {
      log.push({ timestamp: Date.now(), type: logLevels.warn, message, context })
      console.warn(message, ...context)
      jobEmitter.emit(JOB_EVENTS.logAdded, id)
    },
    error (message, ...context) {
      log.push({ timestamp: Date.now(), type: logLevels.error, message, context })
      console.error(message, ...context)
      jobEmitter.emit(JOB_EVENTS.logAdded, id)
    }
  })
}

function getJobInfo (jobId) {
  const { job: { name, id, context, description }, errorCount, status } = jobStates[jobId]
  return { name, id, context, description, status, errorCount, active: ACTIVE_STATUSES.includes(status) }
}

exports.createJobLogsIterator = (jobId) => {
  let index = 0

  function getStateLogs () {
    return jobStates[jobId]?.logs || []
  }

  function getLogs () {
    const logs = []
    for (;index < getStateLogs().length; index++) {
      logs.push(getStateLogs()[index])
    }
    return logs
  }

  const iterator = createEmitterWithCallbackAsyncIterator(jobEmitter, JOB_EVENTS.logAdded, getLogs)

  return iterator
}

exports.createJobsIterator = () => {
  const initialItems = jobIds.map(getJobInfo)

  const iterator = createEmitterAsyncIterator(jobEmitter, JOB_EVENTS.jobUpdated, { getNewItems, initialItems })

  function getNewItems (id) {
    return [getJobInfo(id)]
  }

  return iterator
}

exports.getJobState = ({ id }) => {
  const state = jobStates[id]
  return { ...state, logs: [...state.logs], context: { ...state.context } }
}

const getAllJobs = exports.getAllJobs = () => {
  return jobIds.map(id => jobStates[id])
}

function getNextJobIdToRun () {
  const isRunningJob = getAllJobs().find(x => x.status === JOB_STATUSES.running)
  if (isRunningJob) return
  const nextJob = getAllJobs().find(x => x.status === JOB_STATUSES.pending)?.job
  return nextJob?.id
}

async function waitForTurnToRunAsync (id) {
  while (getNextJobIdToRun() !== id) {
    await new Promise((resolve, reject) => {
      jobEmitter.once(JOB_EVENTS.jobFinished, resolve)
    })
  }
}

exports.runJobAsync = async (job) => {
  let state, log
  const id = job.id
  try {
    if (jobStates[id]) throw new Error(`job id exists: ${id}`)
    state = jobStates[id] = { errorCount: null, job, logs: [], context: job.context, description: job.description, status: JOB_STATUSES.pending }
    jobIds.push(id)
    log = createJobLogger(state)

    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)

    await waitForTurnToRunAsync(id)

    log.info(`starting job ${job.name}: ${job.id}`)
    state.status = JOB_STATUSES.running
    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)

    await job.executeAsync(log)

    state.status = JOB_STATUSES.success
    log.info(`job completed ${job.name}: ${job.id}`)
  } catch (error) {
    log && log.error(`job failed ${job.name}: ${job.id}, ${error.message}`, error)
    if (state) {
      state.error = error
      state.status = JOB_STATUSES.failed
    }
  } finally {
    state.errorCount = state.logs.filter(x => x.type === logLevels.error).length
    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)
    jobEmitter.emit(JOB_EVENTS.jobFinished)
  }
}

exports.deleteJob = ({ id }) => {
  jobIds = jobIds.filter(x => x !== id)
  delete jobStates[id]
}

exports.getJobLog = (id, { start = 0, length = Number.MAX_VALUE } = {}) => {
  const log = jobStates[id].logs

  if (!log) return []
  return log.slice(start, start + length)
}
