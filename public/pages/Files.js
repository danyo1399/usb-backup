
import Link from '../components/Link.js'
import Tabs from '../components/Tabs.js'
import constants from '../constants.js'
import * as globals from '../globals.js'
import { useApiData } from '../index.js'
import { reportFilesOnSourceWithNoBackupAsync } from '../queries/files.js'
const html = globals.html
const { useEffect, useState } = globals.preactHooks
const { route } = globals.preactRouter
const { css } = globals.goober

const items = [
  { label: 'Pending', key: 'pending', href: constants.routes.getFilesUrl('pending') },
  { label: 'Duplicates', key: 'duplicates', href: constants.routes.getFilesUrl('duplicates') },
  { label: 'Removed', key: 'removed', href: constants.routes.getFilesUrl('removed') },
  { label: 'Modified', key: 'modified', href: constants.routes.getFilesUrl('modified') },
]
export default function Files ({ tab }) {
  const styles = css`
  `

  return html`
  <div class=${styles}>
    <h1>Files</h1>
    <${Tabs} items=${items} className='mb-3' selected=${tab}/>
    ${tab === 'pending' && html`<${PendingPage}/>`}
  </div>
  `
}

function PendingPage () {
  const styles = css`
  `
  const data = useApiData(reportFilesOnSourceWithNoBackupAsync, [])

  return html`
  <div class=${styles}>
<p>
  List of files on source devices that dont exist on a backup device
</p>
<table className="table">
  <thead>
    <tr>
      <td>Device</td>
      <td>path</td>
    </tr>
  </thead>
  <tbody>
    ${data.map(x => html`
    <tr>
      <td>
        ${x.deviceName}
      </td>
      <td>
    ${cleanPath(x.devicePath, x.relativePath)}
      </td>
    </tr>`)}
  </tbody>
</table>

</div>
  `
}
function cleanPath (devicePath, relativePath) {
  devicePath = devicePath.replaceAll('\\', '/')
  relativePath = relativePath.replaceAll('\\', '/')
  const seperator = devicePath.endsWith('/') ? '' : '/'
  return `${devicePath}${seperator}${relativePath}`
}
