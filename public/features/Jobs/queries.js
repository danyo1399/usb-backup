import { toObservable } from '../../graphql.js'
import * as globals from '../../globals.js'
const { rxjs } = globals

export const jobs$ = toObservable({
  query: `
    subscription {
      jobs {
        id, name, context, status, active
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
        type, message
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
    rxjs.scan((acu, curr) => [...acu, ...curr], []),
    rxjs.debounceTime(1000),
    rxjs.shareReplay(1)
  )
}
