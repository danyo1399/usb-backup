import { reportFilesOnBackupWithNoSourceAsync } from '../../../api/index.js'
import { css, html } from '../../../globals.js'
import { useApiData } from '../../../hooks.js'
import { FileTable } from './FileTable.js'

export function RemovedTab () {
  const styles = css`
  `
  const data = useApiData(null, reportFilesOnBackupWithNoSourceAsync)

  return html`
  <div class=${styles}>
<p>
  List of backup files that dont exist on source devices
</p>
<${FileTable} data=${data}/>

</div>`
}
