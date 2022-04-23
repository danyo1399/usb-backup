import ManageDeviceDialog from './components/ManageDeviceDialog.js'
import DevicesTable from './components/DevicesTable.js'
import {
  createBackupDeviceAsync,
  createSourceDeviceAsync,
  getBackupDevicesAsync,
  getSourceDevicesAsync,
  removeDeviceAsync,
  scanDevicesAsync,
  updateBackupDeviceAsync,
  updateSourceDeviceAsync,
  createRemoveBackupDuplicatesJobAsync,
  deviceInfo$
} from '../../api/index.js'

import StartBackupDevicesJobDialog from './components/StartBackupDevicesJobDialog.js'
import { useToast, ActionBar, useConfirm, useDialog } from '../../components/index.js'
import { useApiData, useFetching, useObservableState } from '../../hooks.js'
import StartScanDevicesJobDialog from './components/StartScanDevicesJobDialog.js'
import constants from '../../constants.js'
import { html, route, useState } from '../../globals.js'

export default function Devices ({ variant }) {
  const { addToast } = useToast()
  const { doFetch } = useFetching()
  const { prompt } = useConfirm()
  const { showDialog } = useDialog()

  const isSourceDeviceView = variant === 'source'

  const deviceQuery = isSourceDeviceView ? getSourceDevicesAsync : getBackupDevicesAsync
  const removeDevice = removeDeviceAsync
  const createDevice = isSourceDeviceView ? createSourceDeviceAsync : createBackupDeviceAsync
  const updateDevice = isSourceDeviceView ? updateSourceDeviceAsync : updateBackupDeviceAsync

  const { data: devices, mutate: mutateDevicesAsync } = useApiData([], deviceQuery)
  const deviceInfoMap = useObservableState(deviceInfo$) || {}
  const [selectedDevicesMap, setSelectedDevicesMap] = useState({})

  const deviceInfoList = Object.values(deviceInfoMap).filter(i => devices.some(d => d.id === i.id))
  const anyDevicesSelected = Object.values(selectedDevicesMap).some(selected => selected)
  const allOnlineDevicesSelected = deviceInfoList.filter(x => x.isOnline).every(x => selectedDevicesMap[x.id])
  const selectedDevices = devices.filter(d => selectedDevicesMap[d.id])

  function selectAll () {
    if (allOnlineDevicesSelected) {
      setSelectedDevicesMap({})
      return
    }
    const selectedDevices = deviceInfoList.filter(di => di.isOnline)
    setSelectedDevicesMap(sd => {
      sd = { ...sd }
      for (const d of selectedDevices) {
        sd[d.id] = true
      }
      return sd
    })
  }

  function toggleSelectedDevice (id) {
    setSelectedDevicesMap(x => ({ ...x, [id]: !x[id] }))
  }

  async function onScanDevicesJob () {
    if (selectedDevices.length > 0) {
      showDialog(StartScanDevicesJobDialog, {
        showCloseButton: true,
        title: 'Create a Scan Devices Job',
        props: {
          createJob: createScanDevicesJobAsync,
          devices: selectedDevices
        }
      })
    }
  }

  async function createScanDevicesJobAsync (useFullScan) {
    await scanDevicesAsync(selectedDevices.map(x => x.id), useFullScan)
    addToast({ header: 'Job Enqueued', body: 'Scan Devices job successfully enqueued', type: 'success' })
    setSelectedDevicesMap({})
  }

  const label = isSourceDeviceView ? 'Source Device' : 'Backup Device'

  function onManageDevice (device) {
    const title = device ? 'Edit Device' : 'Create Device'
    showDialog(ManageDeviceDialog, { title, showCloseButton: true, props: { createDevice, updateDevice, loadDevices: mutateDevicesAsync, device } })
  }

  function viewFiles (device) {
    route(constants.routes.getViewFilesUrl(device.id))
  }

  async function deleteDevice (device) {
    await doFetch(async () => {
      await removeDevice(device)
      // we need to set it here too else the toast wont work

      mutateDevicesAsync()
      addToast({
        header: 'Success',
        body: 'Device deleted successfully',
        type: 'success'
      })
    })
  }

  function onDeleteDevice (device) {
    prompt(
      'Are you sure?',
      `Do you want to delete device [${device.name}] ${device.description}`,
      () => deleteDevice(device)
    )
  }

  function onDeleteDuplicates () {
    prompt(
      'Are you sure?',
      `Do you want to proceed and delete duplicate files on ${selectedDevices.map(x => ` [${x.name}]`)}`,
      async () => {
        await createRemoveBackupDuplicatesJobAsync(...selectedDevices.map(x => x.id))
        addToast({ header: 'Success', body: 'Delete duplicates job created successfully', type: 'success' })
      }
    )
  }

  function onCreateBackupJob () {
    showDialog(StartBackupDevicesJobDialog, {
      title: 'Create Backup Job',
      size: 'modal-xl',
      props: { sourceDevices: selectedDevices }
    })
  }
  const items = !anyDevicesSelected
    ? []
    : [
        { label: 'Scan Devices', onClick: onScanDevicesJob },
        variant === 'source' && { label: 'Perform Backup', onClick: onCreateBackupJob, enabled: variant === 'source' },
        variant === 'backup' && { label: 'Delete Duplicates', onClick: onDeleteDuplicates }
      ].filter(Boolean)

  return html`
        <h1>${label}s</h1>
        <div>
          <button
              type="button"
              class="btn btn-primary mb-4"
              onClick=${() => onManageDevice(null)}
          >
              Create ${label}
          </button>
        </div>
        <${ActionBar} items=${items} />

        <${DevicesTable}
            devices=${devices}
            variant=${variant}
            allSelected=${allOnlineDevicesSelected}
            selectAll=${selectAll}
            selected=${selectedDevicesMap}
            toggleSelected=${toggleSelectedDevice}
            deleteDevice=${onDeleteDevice}
            editDevice=${onManageDevice}
            loadDevices=${mutateDevicesAsync}
            viewFiles=${viewFiles}
        />
    `
}
