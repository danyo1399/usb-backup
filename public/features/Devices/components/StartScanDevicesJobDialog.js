import { useApiData, useFetching, useObservableState } from '../../../hooks.js'
import { useToast, Dialog, Alert, Button, Checkbox } from '../../../components/index.js'
import * as globals from '../../../globals.js'
import { createBackupDevicesJobAsync, deviceInfo$, getBackupDevicesAsync, scanDevicesAsync } from '../../../queries/index.js'
import { bytesToSize } from '../../../fns.js'
const { html, preactHooks } = globals

const { useEffect, useState } = preactHooks

export default function StartScanDevicesJobDialog ({
  devices,
  show,
  setShow,
  onClose,
  createJob
}) {
  const [fullScan, setFullScan] = useState(false)
  function _onClose () {
    setShow(false)
    onClose && onClose()
  }

  function _createJob () {
    createJob(fullScan)
    setShow(false)
  }

  return html`
  <${Dialog}
  size="modal-lg"
  id="createBackupDeviceModal"
  show=${show}
  onClose=${_onClose}
  title="Create Scan Devices Job" >
  <div class="modal-body">
  <h6 class="mb-4">Perform scan on devices ${devices.map(x => `[${x.name}]`)}</h6>
  <${Checkbox} checked=${fullScan} onClick=${() => setFullScan(x => !x)}  label="Use Fullscan"/>
  </div>
  <div class="modal-footer">
    <${Button}
        className="btn-secondary"
        onClick=${() => setShow(false)}
        >Cancel<//
    >
    <${Button} onClick=${_createJob} >Create Job<//>
</div>
  <//>
  `
}
