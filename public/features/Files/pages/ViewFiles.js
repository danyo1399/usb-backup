import ActionBar from '../../../components/ActionBar.js'
import { Alert } from '../../../components/Alert.js'
import { Button } from '../../../components/Button.js'
import DeviceSelector, { useDeviceSelector } from '../../../components/DeviceSelector.js'
import { Dialog, useDialog } from '../../../components/Dialog.js'
import FileBrowser from '../../../components/FileBrowser.js'
import { useToast } from '../../../components/Toast.js'
import * as globals from '../../../globals.js'
import { useApiData, useFileTree } from '../../../hooks.js'
import { useDevice, useFetching, useFormControl } from '../../../index.js'
import { getFilesByDeviceIdAsync } from '../../../queries/files.js'
import { restoreBackupFilesToSourceRequestAsync } from '../../../queries/jobs.js'
const html = globals.html
const { useState } = globals.preactHooks
const { css } = globals.goober

export default function ViewFiles ({ deviceId }) {
  const styles = css``

  const files = useApiData([], getFilesByDeviceIdAsync, deviceId)
  const [path, setPath] = useState('/')
  const tree = useFileTree(files)
  const node = tree[path]
  const [selected, setSelected] = useState([])
  const device = useDevice(deviceId)
  const dialogState = useDialog()

  const actionBarItems = selected.length > 0 && device?.deviceType === 'backup'
    ? [
        { label: 'Copy to Source Device', onClick: dialogState.showDialog }
      ]
    : []

  return html`
  <div class=${styles}>
    <h1>Veiw Files</h1>
    <h5>Viewing files for device ${device?.name}</h5>
    <p>${device?.description}</p>

    <${ActionBar} items=${actionBarItems} />
    <${FileBrowser} tree=${tree} currentPath=${path} node=${node} navigate=${setPath} selectedRowsChanged=${setSelected} />
    <${RestoreFilesDialog} state=${dialogState} selected=${selected} device=${device}/>
  </div>
  `
}

function RestoreFilesDialog ({ state, selected, device }) {
  const styles = css``

  const { error, doFetch, resetFetchState, fetching } = useFetching()
  const relativePathState = useFormControl('')
  const deviceSelector = useDeviceSelector('source')
  const { addToast } = useToast()

  function copyToSourceDevice (evt) {
    evt.preventDefault()
    doFetch(async () => {
      const paths = selected.map(({ type, path }) => {
        path = path.replaceAll('\\', '/')
        if (type === 'folder') {
          path = path.endsWith('/') ? path : `${path}/`
        }
        path = path.startsWith('/') ? path.substr(1) : path
        return path
      })
      await restoreBackupFilesToSourceRequestAsync(device.id, deviceSelector.selectorProps.selectedDeviceId, relativePathState.value, paths)
      addToast({ header: 'Job Enqueued', body: 'Restore backup job successfully enqueued', type: 'success' })
      state.closeDialog()
    })
  }

  return html`
      <${Dialog} className=${styles}
      id="restoreBackupFilesDialog"
      ...${state.dialogProps}
      title='restore backup files'
    >
      <form onSubmit=${copyToSourceDevice}>
        <div class="modal-body">
        <div class="mb-2">
            ${device && `${device?.name}`}
        </div>
        ${error &&
        html`<${Alert}
            type="alert-danger"
            dismiss=${resetFetchState}>
              Something went wrong (${error.message})
            <//>`}
        <div class="mb-3">
          <${DeviceSelector} ...${deviceSelector.selectorProps}/>

        </div>
        <div class="mb-3">
            <label for="relative-path" class="form-label">Relative path</label>
            <input
                type="text"
                ...${relativePathState.attributes}
                class="form-control"
                id="relative-path"
                placeholder=""
                required
            />
        </div>
        </div>
        <div class="modal-footer">
          <${Button}
              hidden=${fetching}
              className="btn-secondary"
              onClick=${state.closeDialog}
              >Cancel<//
          >
          <${Button} fetching=${fetching} type="submit">Create Job<//>
        </div>
      </form>
    <//>
  `
}
