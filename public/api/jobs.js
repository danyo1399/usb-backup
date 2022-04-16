import { execute, toObservable, handleResponseError } from './graphql.js'
import * as globals from '../globals.js'
const { rxjs } = globals

export async function createRemoveBackupDuplicatesJobAsync (...backupDeviceIds) {
  const response = await execute({
    query: `
      mutation ($input: DeleteDuplicatesRequest) {
        removeBackupDuplicatesJob(input: $input) {
          error {code, message}
        }
      }
    `,
    variables: {
      input: { backupDeviceIds }
    }
  })

  handleResponseError(response)
  return response
}

export async function restoreBackupFilesToSourceRequestAsync (backupDeviceId, sourceDeviceId, relativePath, paths) {
  const response = await execute({
    query: `
      mutation ($input: RestoreBackupFilesToSourceRequest) {
        restoreBackupFilesToSourceRequest(input: $input) {
          error {code, message}
        }
      }
    `,
    variables: {
      input: { backupDeviceId, sourceDeviceId, relativePath, paths }
    }
  })

  handleResponseError(response)
  return response
}

export const jobs$ = toObservable({
  query: `
    subscription {
      jobs {
        id, name, context, status, active, description, errorCount
      }
    }
`
}).pipe(
  rxjs.map(x => x.data.jobs),
  rxjs.mergeAll(),
  rxjs.scan((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
  rxjs.map(x => Object.values(x)),
  rxjs.shareReplay(1))

export function getJobLog (jobId) {
  // We dont use scan because of stack overflow error due to size of the data set
  const accumulator = { data: [] }

  return toObservable({
    query: `subscription ($input: GetJobLogsRequest) {
      jobLogs(input: $input) {
        index, type, message
      }
    }
      `,
    variables: {
      input: {
        jobId: Number(jobId)
      }
    }
  }).pipe(
    rxjs.map(x => x.data?.jobLogs || []),
    rxjs.map(curr => {
      // dont use spread because of perf
      // We need to wrap data because of ref comparison used trigger state change detection
      // we need to mutate because the dataset is too big to recreate the array on each new item
      const { data } = accumulator
      data.push(...curr)
      return { data }
    }),
    rxjs.throttleTime(500),
    rxjs.shareReplay(1)
  )
}
