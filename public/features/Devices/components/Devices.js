import ManageDeviceDialog from './ManageDevice.js'
import DevicesTable from './DevicesTable.js'
import {
  createBackupDeviceAsync,
  createSourceDeviceAsync,
  getBackupDevicesAsync,
  getSourceDevicesAsync,
  removeBackupDeviceAsync,
  removeSourceDeviceAsync,
  scanDevicesAsync,
  updateBackupDeviceAsync,
  updateSourceDeviceAsync
} from '../queries.js'
import * as globals from '../../../globals.js'
import StartBackupDevicesJobDialog from './StartBackupDevicesJobDialog.js'
import { ConfirmDialog } from '../../../components/ConfirmDialog.js'
import { useFetching } from '../../../hooks.js'
import { useToast } from '../../../components/Toast.js'
import { getSelectedKeys } from '../../../fns.js'

const html = window.html
const { useEffect, useState } = globals.preactHooks

export default function Devices ({ variant }) {
  const { addToast } = useToast()
  const [showManageDevice, setShowManageDevice] = useState(false)
  const [showBackupJobDialog, setShowBackupJobDialog] = useState(false)
  const [devices, setDevices] = useState([])
  const [editingDevice, setEditingDevice] = useState(null)
  const { doFetch } = useFetching()

  const isSourceDeviceView = variant === 'source'

  const deviceQuery = isSourceDeviceView ? getSourceDevicesAsync : getBackupDevicesAsync
  const removeDevice = isSourceDeviceView ? removeSourceDeviceAsync : removeBackupDeviceAsync
  const createDevice = isSourceDeviceView ? createSourceDeviceAsync : createBackupDeviceAsync
  const updateDevice = isSourceDeviceView ? updateSourceDeviceAsync : updateBackupDeviceAsync

  const [selectedDevices, setSelectedDevices] = useState({})
  const anyDevicesSelected = Object.values(selectedDevices).some(selected => selected)
  const selectedDeviceIds = getSelectedKeys(selectedDevices)
  function toggleSelectedDevice (id) {
    setSelectedDevices(x => ({ ...x, [id]: !x[id] }))
  }

  async function onScanDevicesJobAsync () {
    if (selectedDeviceIds.length > 0) {
      await scanDevicesAsync(selectedDeviceIds)
      addToast({ header: 'Job Enqueued', body: 'Scan Devices job successfully enqueued', type: 'success' })
      setSelectedDevices({})
    }
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

  function onCreateBackupJob (sourceDeviceIds) {
    setShowBackupJobDialog(true)
  }

  const [deleting, setDeleting] = useState(null)
  async function deleteDevice (device) {
    setDeleting(null)
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
    setDeleting(device)
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
        </div>
        </div>

        <${DevicesTable}
            devices="${devices}"
            selected=${selectedDevices}
            toggleSelected=${toggleSelectedDevice}
            deleteDevice=${onDeleteDevice}
            editDevice="${onEditDevice}"
            loadDevices="${loadDevicesAsync}"
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

        <${StartBackupDevicesJobDialog}
        show=${showBackupJobDialog}
        setShow=${setShowBackupJobDialog}
        onClose=${() => setShowBackupJobDialog(false)}
        sourceDeviceIds=${selectedDeviceIds}

      />

        <${ConfirmDialog}
        onCancel=${() => setDeleting(null)}
        onConfirm=${() => deleteDevice(deleting)}
        show=${deleting}
        header="Are you sure?"
        body="Do you want to delete source'${deleting?.name}'"
      / >

    `
}
