
import Link from '../components/Link.js'
import Tabs from '../components/Tabs.js'
import constants from '../constants.js'
import * as globals from '../globals.js'
import { useApiData } from '../index.js'
import { reportDuplicateFilesOnSourceDevicesAsync, reportFilesOnSourceWithNoBackupAsync } from '../queries/files.js'
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
    ${tab === 'duplicates' && html`<${Duplicates}/>`}
    ${tab === 'removed' && html`<${Removed}/>`}
    ${tab === 'modified' && html`<${Modified}/>`}
  </div>
  `
}

function Removed () {
  const styles = css`
  `
  const data = []

  return html`
  <div class=${styles}>
<p>
  List of backup files that dont exist on source devices
</p>
<${FileTable} data=${data}/>

</div>`
}

function Modified () {
  const styles = css`
  `
  const data = []

  return html`
  <div class=${styles}>
<p>
  List of source files that have been silently modified (modified without affecting other attributes).
  Could be an indication of bit rot
</p>
<${FileTable} data=${data}/>

</div>`
}


function Duplicates () {
  const styles = css`
  `
  const data = useApiData(reportDuplicateFilesOnSourceDevicesAsync, [])

  return html`
  <div class=${styles}>
<p>
  List of source files with duplicates
</p>
<${FileTable} data=${data}/>

</div>`
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
<${FileTable} data=${data}/>
</div>
  `
}

function FileTable ({ data }) {
  return html`
  <table className="table">
  <thead>
    <tr>
      <td>Device</td>
      <td>path</td>
      <td>hash</td>
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
      <td>
        ${x.hash}
      </td>
    </tr>`)}
  </tbody>
</table>

  `
}
function cleanPath (devicePath, relativePath) {
  devicePath = devicePath.replaceAll('\\', '/')
  relativePath = relativePath.replaceAll('\\', '/')
  const seperator = devicePath.endsWith('/') ? '' : '/'
  return `${devicePath}${seperator}${relativePath}`
}
