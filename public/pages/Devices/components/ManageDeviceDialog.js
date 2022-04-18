import { useFetching, useFormControl } from '../../../hooks.js'
import { useToast, Alert, Button } from '../../../components/index.js'
import { html } from '../../../globals.js'
import { refreshDeviceInfoAsync } from '../../../api/index.js'

export default function ManageDeviceDialog ({
  closeDialog,
  loadDevices,
  createDevice,
  updateDevice,
  device
}) {
  const { error, doFetch, resetFetchState, fetching } = useFetching()
  const { addToast } = useToast()
  const { name, path, description, id } = device || {}

  const nameState = useFormControl(name)
  const descriptionState = useFormControl(description)
  const pathState = useFormControl(path)

  const hasInvalidPathError = error?.code === 'devicePathDoesNotExist'
  const unknownError = error && !hasInvalidPathError

  async function _updateDevice () {
    await doFetch(async () => {
      await updateDevice({
        id,
        name: nameState.value,
        description: descriptionState.value,
        path: pathState.value
      })

      loadDevices()
      addToast({
        header: 'Success',
        body: 'Device updated successfully',
        type: 'success'
      })
      closeDialog()
    })
  }

  async function _createDevice () {
    await doFetch(async () => {
      await createDevice({
        name: nameState.value,
        description: descriptionState.value,
        path: pathState.value
      })

      loadDevices()
      refreshDeviceInfoAsync()
      addToast({
        header: 'Success',
        body: 'Device created successfully',
        type: 'success'
      })
      closeDialog()
    })
  }

  const onSubmit = (e) => {
    if (device) {
      _updateDevice()
    } else {
      _createDevice()
    }

    e.preventDefault()
  }

  return html`
<form onSubmit=${onSubmit}>
  <div class="modal-body">
      <div class="mb-2">
          ${device && `id: ${device?.id}`}
      </div>
      ${hasInvalidPathError &&
      html`<${Alert} dismiss=${resetFetchState}
          >The path entered is invalid.<//
      >`}
      ${unknownError &&
      html`<${Alert}
          type="alert-danger"
          dismiss=${resetFetchState}
          >Something went wrong (${error.message})<//
      >`}
      <div class="mb-3">
          <label for="name" class="form-label">Name</label>
          <input
              type="text"
              ...${nameState.attributes}
              class="form-control"
              id="name"
              placeholder=""
              required
          />
      </div>
      <div class="mb-3">
          <label for="description" class="form-label"
              >Description</label
          >
          <textarea
              class="form-control"
              ...${descriptionState.attributes}
              id="description"
              rows="3"
          />
      </div>
      <div class="mb-3">
          <label for="path" class="form-label">Path</label>
          <input
              class="form-control"
              ...${pathState.attributes}
              id="path"
              rows="3"
              required
          />
      </div>
  </div>
  <div class="modal-footer">
      <${Button}
          hidden=${fetching}
          className="btn-secondary"
          onClick=${closeDialog}
          >Cancel<//>
      <${Button} fetching=${fetching} type="submit">Save<//>
  </div>
</form>
    `
}
