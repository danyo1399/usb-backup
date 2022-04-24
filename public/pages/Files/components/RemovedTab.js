import { reportFilesOnBackupWithNoSourceAsync } from '../../../api/index.js'
import { DeviceSelector, useDeviceSelector } from '../../../components/DeviceSelector.js'
import { css, html } from '../../../globals.js'
import { useApiData } from '../../../hooks.js'
import { FileTable } from './FileTable.js'

export function RemovedTab () {
  const styles = css`
  `
  let { data } = useApiData(null, reportFilesOnBackupWithNoSourceAsync)
  const { selectorProps, selectedDevice } = useDeviceSelector('backup', { includeOffline: true, includeAllOption: true })
  if (data && selectedDevice) {
    data = data.filter(item => item.deviceId === selectedDevice.id)
  }

  return html`
  <div class=${styles}>
<p>
  List of backup files that dont exist on source devices
</p>
<${DeviceSelector} ...${selectorProps}/>
<${FileTable} className="mt-3" data=${data}/>

</div>`
}
