import { reportDuplicateFilesOnBackupDevicesAsync, reportDuplicateFilesOnSourceDevicesAsync } from '../../../api/index.js'
import { css, html, useState } from '../../../globals.js'
import { useApiData } from '../../../hooks.js'
import { theme } from '../../../theme/index.js'
import { FileTable } from './FileTable.js'

export function DuplicatesTab () {
  const styles = css`
  .form-group {
    display: flex;
    align-items: center;
    gap:1rem;
    select {
      width: 10rem;
    }
    label {
      font-weight: ${theme.fontWeight.semibold};
    }
  }
  `

  const [filter, setFilter] = useState('source')
  const { data } = useApiData(null, filter === 'backup' ? reportDuplicateFilesOnBackupDevicesAsync : reportDuplicateFilesOnSourceDevicesAsync)

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
