import { useFetching } from '../../../hooks.js'
import { useToast, Dialog, Alert, Button } from '../../../components/index.js'
import * as globals from '../../../globals.js'
import { createBackupDevicesJobAsync, getBackupDevicesAsync } from '../queries.js'
const { html, preactHooks } = globals

const { useEffect, useState } = preactHooks

export default function StartBackupDevicesJobDialog ({
  sourceDeviceIds,
  show,
  setShow,
  onClose
}) {
  const { error, doFetch, resetFetchState, fetching } = useFetching()
  const { addToast } = useToast()

  const [selectedBackupDeviceId, setSelectedBackupDeviceId] = useState(null)
  const [backupDevices, setBackupDevices] = useState(null)

  const hasInvalidPathError = error?.code === 'devicePathDoesNotExist'
  const unknownError = error && !hasInvalidPathError

  useEffect(() => {
    (async () => {
      const devices = await getBackupDevicesAsync()
      setBackupDevices(devices)
    })()
  }, [])

  useEffect(() => {
    resetFetchState()
  }, [show])

  async function _createJob () {
    await doFetch(async () => {
      await createBackupDevicesJobAsync(sourceDeviceIds, selectedBackupDeviceId)

      setShow(false)
      addToast({
        header: 'Success',
        body: 'Backup Job successfully started',
        type: 'success'
      })
    })
  }

  function selectDevice (evt, id) {
    evt.preventDefault()
    setTimeout(() => {
      setSelectedBackupDeviceId(existing => existing === id ? null : id)
    }, 0)
  }

  function _onClose () {
    setShow(false)
    onClose && onClose()
  }

  return html`
    <${Dialog}
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

    <h5>Select Target Backup Device</h5>
    <table class="table table-striped">
    <thead>
        <tr>
            <th style="width: 50px;" scope="col"></th>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
        </tr>
    </thead>
    <tbody>
      ${(backupDevices || []).map(dev => html`
      <tr key=${dev.id}>
        <td>
          <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="backup-${dev.id}" checked=${selectedBackupDeviceId === dev.id} onClick=${(evt) => selectDevice(evt, dev.id)} />
          <label class="form-check-label" for="backup-${dev.id}"></label>
          </div>
        </td>
        <td>
          ${dev.name}
        </td>
        <td>
        ${dev.description}
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
