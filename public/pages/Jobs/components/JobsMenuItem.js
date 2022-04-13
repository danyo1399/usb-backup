import { SideNavMenuItem } from '../../../components/index.js'
import constants from '../../../constants.js'
import { html } from '../../../globals.js'
import { useObservableState } from '../../../hooks.js'
import { jobs$ } from '../../../api/index.js'

export function JobsMenuItem ({ ...props }) {
  const jobs = useObservableState(jobs$) || []

  const activeCount = jobs.filter(x => x.status === 'running' || x.status === 'pending').length
  return html`<${SideNavMenuItem} icon="text-left" href=${constants.routes.jobs}>
  Jobs <span class="badge bg-secondary">${activeCount}</span>
</$>
`
}
