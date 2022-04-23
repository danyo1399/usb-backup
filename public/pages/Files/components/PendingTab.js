import { reportFilesOnSourceWithNoBackupAsync } from '../../../api/index.js'
import { css, html } from '../../../globals.js'
import { useApiData } from '../../../hooks.js'
import { FileTable } from './FileTable.js'

export function PendingTab () {
  const styles = css`
  `
  const { data } = useApiData(null, reportFilesOnSourceWithNoBackupAsync)

  return html`
  <div class=${styles}>
<p>
  List of files on source devices that dont exist on a backup device
</p>
<${FileTable} data=${data}/>
</div>
  `
}
