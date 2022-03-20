import { SideNavMenuItem } from '../../../components/index.js'
import constants from '../../../constants.js'
import * as globals from '../../../globals.js'
import { useJobs } from '../hooks.js'

const { html } = globals

export function JobsMenuItem ({ ...props }) {
  const jobs = useJobs()
  const activeCount = jobs.filter(x => x.status === 'running').length
  return html`<${SideNavMenuItem} icon="text-left" href=${constants.routes.jobs}>
  Jobs <span class="badge bg-secondary">${activeCount}</span>
</$>
`
}
