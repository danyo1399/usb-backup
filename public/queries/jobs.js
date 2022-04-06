import { execute, toObservable } from '../graphql.js'
import * as globals from '../globals.js'
import { handleResponseError } from '../fns.js'
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
    rxjs.scan((acu, curr) => {
      // dont use spread because of perf
      // We need to wrap it because of ref comparison to trigger state change detection
      // we need to mutate because the dataset is too big to recreate the array on each new item
      const { data } = acu
      data.push(...curr)
      return { data }
    }, { data: [] }),
    rxjs.throttleTime(500),
    rxjs.shareReplay(1)
  )
}
