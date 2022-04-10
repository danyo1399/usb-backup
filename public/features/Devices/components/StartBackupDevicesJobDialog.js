import { useApiData, useFetching, useObservableState } from '../../../hooks.js'
import { useToast, Dialog, Alert, Button, Checkbox } from '../../../components/index.js'
import * as globals from '../../../globals.js'
import { createBackupDevicesJobAsync, deviceInfo$, getBackupDevicesAsync } from '../../../queries/index.js'
import { bytesToSize } from '../../../fns.js'
const { html, preactHooks } = globals

const { useEffect, useState } = preactHooks

export default function StartBackupDevicesJobDialog ({
  sourceDevices,
  show,
  setShow,
  onClose
}) {
  const { error, doFetch, resetFetchState, fetching } = useFetching()
  const { addToast } = useToast()

  const [selectedBackupDeviceId, setSelectedBackupDeviceId] = useState(null)

  const hasInvalidPathError = error?.code === 'devicePathDoesNotExist'
  const unknownError = error && !hasInvalidPathError

  const deviceInfo = useObservableState(deviceInfo$) || {}
  const backupDevices = useApiData([], getBackupDevicesAsync).filter(dev => deviceInfo[dev.id]?.isOnline)

  useEffect(() => {
    resetFetchState()
  }, [show])

  async function _createJob () {
    await doFetch(async () => {
      await createBackupDevicesJobAsync(sourceDevices.map(x => x.id), selectedBackupDeviceId)

      setShow(false)
      addToast({
        header: 'Success',
        body: 'Backup Job successfully started',
        type: 'success'
      })
    })
  }

  function _onClose () {
    setShow(false)
    onClose && onClose()
  }

  return html`
    <${Dialog}
    size="modal-lg"
    id="createBackupDeviceModal"
    show=${show}
    onClose=${_onClose}
    title="Create Backup Job" >

<div class="modal-body">
    <div class="mb-2">
    </div>
    ${unknownError &&
    html`<${Alert}
        type="alert-danger"
        dismiss=${resetFetchState}
        >Something went wrong (${error.message})<//
    >`}
    <p class="mb-3">Backing up from devices: ${sourceDevices.map(x => html`[${x.name}] `)}</p>
    <h5>Select Target Backup Device</h5>
    <table class="table table-striped">
    <thead>
        <tr>
            <th style="width: 50px;" scope="col"></th>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Path</th>
            <th scope="col">Available</th>
        </tr>
    </thead>
    <tbody>
      ${(backupDevices || []).map(dev => html`
      <tr key=${dev.id}>
        <td>
          <${Checkbox} checked=${selectedBackupDeviceId === dev.id}
          onClick=${() => setSelectedBackupDeviceId(dev.id)}/>
        </td>
        <td>
          ${dev.name}
        </td>
        <td>
        ${dev.description}
        </td>
        <td>
        ${dev.path}
        </td>
        <td>
        ${bytesToSize(deviceInfo[dev.id]?.freeSpace)}
        </td>
      </tr>

      `)}
    </tbody>
</table>

</div>
<div class="modal-footer">
    <${Button}
        hidden=${fetching}
        className="btn-secondary"
        onClick=${() => setShow(false)}
        >Cancel<//
    >
    <${Button} fetching=${fetching} disabled=${!selectedBackupDeviceId} onClick=${_createJob} >Create Job<//>
</div>
<//>
    `
}
