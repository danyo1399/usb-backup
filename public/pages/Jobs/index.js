import constants from '../../constants.js'
import { html, route } from '../../globals.js'
import { useObservableState } from '../../hooks.js'
import { jobs$ } from '../../api/jobs.js'
import { ActionsTableButton } from '../../components/index.js'

export * from './components/JobsMenuItem.js'

const { routes } = constants

export default function Jobs () {
  const jobs = useObservableState(jobs$) || []

  return html`
  <h1>Jobs</h1>
  <table class="table table-striped">
    <thead>
        <tr>
            <th scope="col">Id</th>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Description</th>
            <th scope="col">Error Count</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody>
      ${jobs.map(job => html`
        <tr>
          <td> ${job.id} </td>
          <td> ${job.name} </td>
          <td> ${job.status} </td>
          <td> ${job.description} </td>
          <td> ${job.errorCount} </td>
          <td><${Dropdown} viewLog=${() => route(routes.getJobLogUrl(job.id))}/></td>
        </tr>
      `)}
    </tbody>
  </table>
  `
}

function Dropdown ({ viewLog, deleteJob, job }) {
  return html`
  <div class="dropdown">
    <${ActionsTableButton}
        id="jobsDropdownMenu"
    >
        Actions
    <//>
    <ul
        class="dropdown-menu"
        aria-labelledby="jobsDropdownMenu"
    >
        <li>
            <button
                class="dropdown-item"
                type="button"
                onClick="${() => viewLog(job)}"
            >
                View Log
            </button>
        </li>
        <li data-hidden>
            <button
                class="dropdown-item"
                onClick="${() => deleteJob(job)}"
                type="button"
            >
                Delete
            </button>
        </li>
    </ul>
  </div>
  `
}
