import ManageDeviceDialog from './ManageDevice.js'
import DevicesTable from './DevicesTable.js'
import {
  createBackupDeviceAsync,
  createSourceDeviceAsync,
  getBackupDevicesAsync,
  getSourceDevicesAsync,
  removeDeviceAsync,
  scanDevicesAsync,
  updateBackupDeviceAsync,
  updateSourceDeviceAsync
} from '../../../queries/index.js'

import StartBackupDevicesJobDialog from './StartBackupDevicesJobDialog.js'
import { ConfirmDialog, useConfirm } from '../../../components/ConfirmDialog.js'
import { useFetching } from '../../../hooks.js'
import { useToast } from '../../../components/Toast.js'
import StartScanDevicesJobDialog from './StartScanDevicesJobDialog.js'
import constants from '../../../constants.js'
import { createRemoveBackupDuplicatesJobAsync } from '../../../queries/jobs.js'
import * as globals from '../../../globals.js'
const html = globals.html
const { useEffect, useState } = globals.preactHooks
const { route } = globals.preactRouter

export default function Devices ({ variant }) {
  const { addToast } = useToast()
  const [showManageDevice, setShowManageDevice] = useState(false)
  const [showBackupJobDialog, setShowBackupJobDialog] = useState(false)
  const [showScanJobDialog, setShowScanJobDialog] = useState(false)
  const [devices, setDevices] = useState([])
  const [editingDevice, setEditingDevice] = useState(null)
  const { doFetch } = useFetching()

  const isSourceDeviceView = variant === 'source'

  const deviceQuery = isSourceDeviceView ? getSourceDevicesAsync : getBackupDevicesAsync
  const removeDevice = removeDeviceAsync
  const createDevice = isSourceDeviceView ? createSourceDeviceAsync : createBackupDeviceAsync
  const updateDevice = isSourceDeviceView ? updateSourceDeviceAsync : updateBackupDeviceAsync

  const [selectedDevicesMap, setSelectedDevicesMap] = useState({})
  const anyDevicesSelected = Object.values(selectedDevicesMap).some(selected => selected)
  const selectedDevices = devices.filter(d => selectedDevicesMap[d.id])

  function toggleSelectedDevice (id) {
    setSelectedDevicesMap(x => ({ ...x, [id]: !x[id] }))
  }

  async function onScanDevicesJobAsync (useFullScan) {
    if (selectedDevices.length > 0) {
      setShowScanJobDialog(true)
    }
  }

  async function createScanDevicesJobAsync (useFullScan) {
    await scanDevicesAsync(selectedDevices.map(x => x.id), useFullScan)
    addToast({ header: 'Job Enqueued', body: 'Scan Devices job successfully enqueued', type: 'success' })
    setSelectedDevicesMap({})
  }

  const label = isSourceDeviceView ? 'Source Device' : 'Backup Device'

  async function loadDevicesAsync () {
    const devices = await deviceQuery()
    setDevices(devices)
  }

  useEffect(() => {
    loadDevicesAsync()
  }, [])

  function onEditDevice (device) {
    setEditingDevice(device)
    setShowManageDevice(true)
  }

  function onCreateBackupJob () {
    setShowBackupJobDialog(true)
  }

  function viewFiles (device) {
    route(constants.routes.getViewFilesUrl(device.id))
  }

  const { confirmProps: deleteDeviceProps, prompt: deleteDevicePrompt } = useConfirm()

  const { confirmProps: dedupConfirmProps, prompt: dedupConfirmPrompt } = useConfirm()

  async function deleteDevice (device) {
    await doFetch(async () => {
      await removeDevice(device)
      // we need to set it here too else the toast wont work

      loadDevicesAsync()
      addToast({
        header: 'Success',
        body: 'Device deleted successfully',
        type: 'success'
      })
    })
  }

  function onDeleteDevice (device) {
    deleteDevicePrompt(() => deleteDevice(device), device)
  }

  function onDeleteDuplicates () {
    dedupConfirmPrompt(() => {
      createRemoveBackupDuplicatesJobAsync(...selectedDevices.map(x => x.id))
    })
  }

  return html`
        <h1>${label}s</h1>
        <div>
        <button
            type="button"
            class="btn btn-primary mb-4"
            onClick=${() => setShowManageDevice(true)}
        >
            Create ${label}
        </button>
        </div>
        <div class="device-actions">
        <span class="device-actions__label">Actions:</span> <div class="btn-group mt-3 mb-3" data-hidden=${!anyDevicesSelected} role="group" aria-label="Action Bar">
          <button type="button" class="btn btn-outline-primary" onClick=${onScanDevicesJobAsync}>Scan Devices</button>
          <button type="button" class="btn btn-outline-primary" data-hidden=${variant === 'backup'} onClick=${onCreateBackupJob}>Perform Backup</button>
          <button type="button" class="btn btn-outline-primary" data-hidden=${variant === 'source'} onClick=${onDeleteDuplicates}>Delete Duplicates</button>
        </div>
        </div>

        <${DevicesTable}
            devices=${devices}
            variant=${variant}
            selected=${selectedDevicesMap}
            toggleSelected=${toggleSelectedDevice}
            deleteDevice=${onDeleteDevice}
            editDevice=${onEditDevice}
            loadDevices=${loadDevicesAsync}
            viewFiles=${viewFiles}
        />
        <${ManageDeviceDialog}
            show=${showManageDevice}
            createDevice=${createDevice}
            updateDevice=${updateDevice}
            editingDevice=${editingDevice}
            setShow=${setShowManageDevice}
            onCreateBackupJob=${onCreateBackupJob}
            loadDevices=${loadDevicesAsync}
            onClose=${() => setEditingDevice(undefined)}
        />
        <${StartScanDevicesJobDialog}
        show=${showScanJobDialog}
        setShow=${setShowScanJobDialog}
        onClose=${() => setShowScanJobDialog(false)}
        createJob=${createScanDevicesJobAsync}
        devices=${selectedDevices}  />

        <${StartBackupDevicesJobDialog}
        show=${showBackupJobDialog}
        setShow=${setShowBackupJobDialog}
        onClose=${() => setShowBackupJobDialog(false)}
        sourceDevices=${selectedDevices}

      />

        <${ConfirmDialog}
        ...${deleteDeviceProps}
        header="Are you sure?"
        body="Do you want to delete device [${deleteDeviceProps.args?.name}] ${deleteDeviceProps.args?.description}"
      / >

      <${ConfirmDialog}
        ...${dedupConfirmProps}
        header="Are you sure?"
        body="Do you want to delete duplicate files"
      / >

    `
}
