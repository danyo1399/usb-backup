import TextFormField from '../../../components/TextFormField.js'
import * as globals from '../../../globals.js'
import { useFormControl, useJob, useObservableState } from '../../../hooks.js'
import { getJobLog } from '../../../queries/jobs.js'

const html = globals.html
const { css } = globals.goober
const { useState, useEffect } = globals.preactHooks

const itemsPerPage = 5000

function filterType (type, filter) {
  return filter === 'all'
    ? true
    : filter === 'info'
      ? ['info', 'warn', 'error'].includes(type)
      : filter === 'warn'
        ? ['warn', 'error'].includes(type)
        : type === 'error'
}
export default function JobLog ({ jobId }) {
  const [log$, setLog$] = useState(null)
  const [pageNo, setPageNo] = useState(1)
  const job = useJob(jobId)
  const { attributes, value: filterText } = useFormControl()
  useEffect(() => {
    setLog$(getJobLog(jobId))
  }, [jobId])
  const jobLog = (useObservableState(log$)?.data || [])

  const [filter, setFilter] = useState('info')

  const ucFilterText = (filterText || '').toUpperCase()
  const filteredLogs = jobLog.filter(({ type, message }) => filterType(type, filter) && (!filterText || message.toUpperCase().includes(ucFilterText)))

  const page = filteredLogs.slice((pageNo - 1) * itemsPerPage, pageNo * itemsPerPage)
  const lastPageNo = Math.ceil(filteredLogs.length / itemsPerPage)

  useEffect(() => {
    setPageNo(1)
  }, [ucFilterText])

  function scrollToBottom () {
    setTimeout(() => {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'instant' })
    }, 10)
  }

  function nextPage () {
    setPageNo(x => x < lastPageNo ? x + 1 : x)
    scrollToBottom()
  }

  function previousPage () {
    setPageNo(x => x > 1 ? x - 1 : x)
    scrollToBottom()
  }

  function firstPage () {
    setPageNo(1)
  }

  function lastPage () {
    setPageNo(lastPageNo)
    scrollToBottom()
  }

  function updateFilter (evt) {
    setPageNo(1)
    setFilter(evt.target.value)
  }

  const styles = css`
.button-container {
  display: flex;
  justifyContent: center;
  gap: 1rem;
  button {
    width: 7rem;
    text-transform: uppercase;
  }
}
table {
  margin-top: 1rem;
}
section {
  margin-top: 1rem;
}
  `

  return html`
    <div class=${styles}>
  <h1>Job Log - ${job?.name} [${job?.status}]</h1>
  <h5>${job?.description}</h5>
  <section class="text-filter">
  <${TextFormField} label="Filter" ...${attributes}/>
  </section>
<section class="level-filter">
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
      <th scope="col">No.</th>
          <th scope="col">Type</th>
          <th scope="col">Message</th>
      </tr>
  </thead>
  <tbody>
  ${page.map((log, index) => html`<tr>
  <td> ${index + 1} </td>
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

</div>

  `
}
