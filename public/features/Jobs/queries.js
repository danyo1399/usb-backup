import { subscribe } from '../../graphql.js'

export function getJobs () {
  return subscribe({
    query: `subscription {
      jobs {
        id, name, context, status, active
      }
    }
      `
  })
}

export function getJobLog (jobId) {
  return subscribe({
    query: `subscription ($input: GetJobLogsRequest) {
      jobLogs(input: $input) {
        type, message
      }
    }
      `,
    variables: {
      input: {
        jobId: jobId
      }
    }
  })
}
