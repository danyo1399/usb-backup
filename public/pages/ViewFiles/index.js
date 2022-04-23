import {
  FileBrowser,
  useToast,
  ActionBar,
  Alert,
  Button,
  DeviceSelector,
  useDeviceSelector,
  useDialog
} from '../../components/index.js'

import { css, html, useState } from '../../globals.js'
import { useApiData, useFileTree, useDevice, useFetching, useFormControl } from '../../hooks.js'
import { getFilesByDeviceIdAsync, restoreBackupFilesToSourceRequestAsync } from '../../api/index.js'

export default function ViewFiles ({ deviceId }) {
  const styles = css``

  const { data: files } = useApiData([], getFilesByDeviceIdAsync, deviceId)
  const [path, setPath] = useState('/')
  const tree = useFileTree(files)
  const node = tree[path]
  const [selected, setSelected] = useState([])
  const device = useDevice(deviceId)

  const { showDialog } = useDialog()
  function showCopyDialog () {
    showDialog(RestoreFilesDialog, { title: 'Copy to Source Device', showCloseButton: true, props: { device, selected } })
  }
  const actionBarItems = selected.length > 0 && device?.deviceType === 'backup'
    ? [
        { label: 'Copy to Source Device', onClick: showCopyDialog }
      ]
    : []

  return html`
  <div class=${styles}>
    <h1>View Files</h1>
    <h5>Viewing files for device ${device?.name}</h5>
    <p>${device?.description}</p>

    <${ActionBar} items=${actionBarItems} />
    <${FileBrowser} tree=${tree} currentPath=${path} node=${node} navigate=${setPath} selectedRowsChanged=${setSelected} />
  </div>
  `
}

function RestoreFilesDialog ({ closeDialog, selected, device }) {
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
      closeDialog()
    })
  }

  return html`
      <form class=${styles} onSubmit=${copyToSourceDevice}>
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
              onClick=${closeDialog}
              >Cancel<//
          >
          <${Button} fetching=${fetching} type="submit">Create Job<//>
        </div>
      </form>
  `
}
