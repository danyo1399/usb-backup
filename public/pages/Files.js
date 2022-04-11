import PaginationButtons from '../components/PaginationButtons.js'
import Tabs from '../components/Tabs.js'
import constants from '../constants.js'
import * as globals from '../globals.js'
import { useApiData, usePagination } from '../index.js'
import { reportDuplicateFilesOnBackupDevicesAsync, reportDuplicateFilesOnSourceDevicesAsync, reportFilesOnBackupWithNoSourceAsync, reportFilesOnSourceWithNoBackupAsync } from '../queries/files.js'
const html = globals.html
const { useState } = globals.preactHooks
const { css } = globals.goober

const items = [
  { label: 'Pending', key: 'pending', href: constants.routes.getFilesUrl('pending') },
  { label: 'Duplicates', key: 'duplicates', href: constants.routes.getFilesUrl('duplicates') },
  { label: 'Removed', key: 'removed', href: constants.routes.getFilesUrl('removed') },
  { label: 'Modified', key: 'modified', href: constants.routes.getFilesUrl('modified') }
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
  const data = useApiData([], reportFilesOnBackupWithNoSourceAsync)

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
  .form-group {
    display: flex;
    align-items: center;
    gap:1rem;
    select {
      width: 10rem;
    }
    label {
      font-weight:500;
    }
  }
  `

  const [filter, setFilter] = useState('source')
  const data = useApiData([], filter === 'backup' ? reportDuplicateFilesOnBackupDevicesAsync : reportDuplicateFilesOnSourceDevicesAsync)

  return html`
  <div class=${styles}>
<p>
  List of source files with duplicates
</p>
<div class="form-group mb-1 mt-4">
<label for="duplicates-device-type">Device Type</label>
<select id="duplicates-device-type" value=${filter} onChange=${(e) => setFilter(e.target.value)} class="form-select" aria-label="Device Type">
  <option value="source">Source</option>
  <option value="backup">Backup</option>
</select>
</div>
<${FileTable} data=${data}/>

</div>`
}

function PendingPage () {
  const styles = css`
  `
  const data = useApiData([], reportFilesOnSourceWithNoBackupAsync)

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
  const styles = css`
  .path-cell {
    overflow-wrap: anywhere
  }
  `
  const pagination = usePagination(data, 15)
  const { page } = pagination
  return html`
  <table className="table ${styles}">
  <thead>
    <tr>
      <td>Device</td>
      <td>path</td>
      <td>hash</td>
    </tr>
  </thead>
  <tbody>
    ${page.map(x => html`
    <tr>
      <td>
        ${x.deviceName}
      </td>
      <td class="path-cell">
    ${cleanPath(x.devicePath, x.relativePath)}
      </td>
      <td>
        ${x.hash}
      </td>
    </tr>`)}
  </tbody>
</table>

<${PaginationButtons} ...${pagination} />
  `
}
function cleanPath (devicePath, relativePath) {
  devicePath = devicePath.replaceAll('\\', '/')
  relativePath = relativePath.replaceAll('\\', '/')
  const seperator = devicePath.endsWith('/') ? '' : '/'
  return `${devicePath}${seperator}${relativePath}`
}
