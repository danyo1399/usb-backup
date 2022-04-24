import { reportFilesOnSourceWithNoBackupAsync } from '../../../api/index.js'
import { DeviceSelector, useDeviceSelector } from '../../../components/DeviceSelector.js'
import { css, html } from '../../../globals.js'
import { useApiData } from '../../../hooks.js'
import { FileTable } from './FileTable.js'

export function PendingTab () {
  const styles = css`
  `
  let { data } = useApiData(null, reportFilesOnSourceWithNoBackupAsync)

  const { selectorProps, selectedDevice } = useDeviceSelector('source', { includeOffline: true, includeAllOption: true })
  if (data && selectedDevice) {
    data = data.filter(item => item.deviceId === selectedDevice.id)
  }
  return html`
  <div class=${styles}>
<p>
  List of files on source devices that dont exist on a backup device
</p>
<${DeviceSelector} ...${selectorProps}/>
<${FileTable} className="mt-3" data=${data}/>
</div>
  `
}
