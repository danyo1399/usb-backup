import constants from '../../../constants.js'
import * as globals from '../../../globals.js'
import { useObservableState } from '../../../hooks.js'
import { jobs$ } from '../queries.js'

const html = globals.html
const { route } = globals.preactRouter
const { routes } = constants

export default function Jobs ({ jobId }) {
  const jobs = useObservableState(jobs$) || []

  // const jobs = [
  //   { id: 1, name: 'ScanDevices', status: 'running'}]
  return html`
  <h1>Jobs</h1>
  <table class="table table-striped">
    <thead>
        <tr>
            <th scope="col">Id</th>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Context</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody>
      ${jobs.map(job => html`
        <tr>
          <td> ${job.id} </td>
          <td> ${job.name} </td>
          <td> ${job.status} </td>
          <td> ${JSON.stringify(job.context)} </td>
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
    <button
        class="btn btn-sm btn-secondary dropdown-toggle"
        type="button"
        id="jobsDropdownMenu"
        data-bs-toggle="dropdown"
        aria-expanded="false"
    >
        Actions
    </button>
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
