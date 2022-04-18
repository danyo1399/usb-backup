import { Button, Checkbox } from '../../../components/index.js'
import { html, useState } from '../../../globals.js'

export default function StartScanDevicesJobDialog ({
  devices,
  closeDialog,
  createJob
}) {
  const [fullScan, setFullScan] = useState(false)

  function _createJob () {
    createJob(fullScan)
    closeDialog()
  }

  return html`
  <div class="modal-body">
  <h6 class="mb-4">Perform scan on devices ${devices.map(x => `[${x.name}]`)}</h6>
  <${Checkbox} checked=${fullScan} onClick=${() => setFullScan(x => !x)}  label="Use Full Scan"/>
  </div>
  <div class="modal-footer">
    <${Button}
        className="btn-secondary"
        onClick=${closeDialog}
        >Cancel<//
    >
    <${Button} onClick=${_createJob} >Create Job<//>
</div>
  `
}
