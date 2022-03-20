import * as globals from '../../globals.js'
import { useIdentityTrackedIteratorState, useIteratorState } from '../../hooks.js'
import { getJobLog, getJobs } from './queries.js'
const { useState, useEffect } = globals.preactHooks

export function useJobs () {
  const jobs = useIdentityTrackedIteratorState(getJobs, x => x.id, x => x.data.jobs)
  return jobs
}

export function useJobLog (jobId) {
  const jobs = useIteratorState(() => getJobLog(Number(jobId)), x => x.data?.jobLogs || [])
  return jobs
}
