import * as globals from '../../../globals.js'
import { useObservableState } from '../../../hooks.js'
import { getJobLog } from '../../../queries/jobs.js'

const html = globals.html
const ps = globals.ps
const { useState, useEffect } = globals.preactHooks

const itemsPerPage = 500
export default function JobLog ({ jobId }) {
  const [$log, set$log] = useState(null)
  const [pageNo, setPageNo] = useState(1)

  useEffect(() => {
    set$log(getJobLog(jobId))
  }, [jobId])
  const jobLog = useObservableState($log) || []

  const [filter, setFilter] = useState('all')

  const filteredLogs = jobLog.filter(({ type }) =>
    filter === 'all'
      ? true
      : filter === 'info'
        ? ['info', 'warn', 'error'].includes(type)
        : filter === 'warn'
          ? ['warn', 'error'].includes(type)
          : type === 'error')

  const page = filteredLogs.slice((pageNo - 1) * itemsPerPage, pageNo * itemsPerPage)
  const lastPageNo = Math.ceil(filteredLogs.length / itemsPerPage)
  function nextPage () {
    setPageNo(x => x < lastPageNo ? x + 1 : x)
  }

  function previousPage () {
    setPageNo(x => x > 1 ? x - 1 : x)
  }

  function firstPage () {
    setPageNo(1)
  }

  function lastPage () {
    setPageNo(lastPageNo)
  }

  function updateFilter (evt) {
    firstPage()
    setFilter(evt.target.value)
  }

  const Wrapper = ps('div')({
    ' .button-container': {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem'
    },
    ' .button-container button': {
      width: '7rem',
      textTransform: 'uppercase'
    }
  })
  return html`
  <${Wrapper}>
  <h1>Job Log</h1>
  <secton>
  <label for="min-log-level" class="form-label">Min Log Level</label>
  <select id="min-log-level" value=${filter} onChange=${updateFilter} class="form-select" aria-label="Min Log Level">
  <option value="all">All</option>
  <option value="info">Info</option>
  <option value="warn">Warn</option>
  <option value="error">Error</option>
</select>
</section>

  <table class="table table-striped">
  <thead>
      <tr>
          <th scope="col">Type</th>
          <th scope="col">Message</th>
      </tr>
  </thead>
  <tbody>
  ${page.map(log => html`<tr>
  <td> ${log.type} </td>
  <td> ${log.message} </td>
</tr>`)}
  </tbody>
</table>
<div class="button-container">
  <button type="button" class="btn btn-secondary btn-sm" disabled=${pageNo === 1} onClick=${firstPage}>First</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${pageNo === 1} onClick=${previousPage}>Previous</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${pageNo === lastPageNo} onClick=${nextPage}>Next</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${pageNo === lastPageNo} onClick=${lastPage}>Last</button>
</div>

<//>
  `
}
