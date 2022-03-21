
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
const { createAsyncIterator } = require('../utils')
const { logLevels, createLogger } = require('../logging')
class JobEmitter extends EventEmitter {

}

const JOB_EVENTS = { jobUpdated: 'jobUpdated', jobFinished: 'jobFinished', logAdded: 'logAdded' }

const jobEmitter = exports.jobEmitter = new JobEmitter()

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
  const { job: { name, id, context }, status } = jobStates[jobId]
  return { name, id, context, status, active: ACTIVE_STATUSES.includes(status) }
}

exports.getJobLogIterator = (jobId) => {
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

  return createAsyncIterator(
    getLogs,
    cb => jobEmitter.on(JOB_EVENTS.logAdded, cb),
    cb => jobEmitter.off(JOB_EVENTS.logAdded, cb))
}

exports.getJobChangeIterator = () => {
  let _jobs = jobIds.map(getJobInfo)
  let callback

  function getNewItems () {
    const value = _jobs
    _jobs = []
    return value
  }

  function handleNewItems (id) {
    _jobs.push(getJobInfo(id))
    callback()
  }

  jobEmitter.on(JOB_EVENTS.jobUpdated, handleNewItems)

  function dispose () {
    jobEmitter.off(JOB_EVENTS.jobUpdated, handleNewItems)
  }

  return createAsyncIterator(getNewItems, cb => { callback = cb }, dispose)
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
    state = jobStates[id] = { job, logs: [], context: job.context, status: JOB_STATUSES.pending }
    jobIds.push(id)
    log = createJobLogger(state)

    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)

    await waitForTurnToRunAsync(id)

    log.info(`starting job ${job.name}: ${job.id}`)
    state.status = JOB_STATUSES.running
    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)

    await job.executeAsync(log)

    state.status = JOB_STATUSES.success
    jobEmitter.emit(JOB_EVENTS.jobUpdated, id)
    log.info(`job completed ${job.name}: ${job.id}`)
  } catch (error) {
    log && log.error(`job failed ${job.name}: ${job.id}, ${error.message}`, error)
    if (state) {
      state.error = error
      state.status = JOB_STATUSES.failed
      jobEmitter.emit(JOB_EVENTS.jobUpdated, id)
    }
  } finally {
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
