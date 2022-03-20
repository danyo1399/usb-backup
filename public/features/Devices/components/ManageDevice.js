import { useFetching, useFormControl } from '../../../hooks.js'
import { useToast, Dialog, Alert, Button } from '../../../components/index.js'
import * as globals from '../../../globals.js'
const { html, preactHooks } = globals

const { useEffect } = preactHooks

export default function ManageDeviceDialog ({
  show,
  setShow,
  onClose,
  loadDevices,
  createDevice,
  updateDevice,
  editingDevice
}) {
  const { error, doFetch, resetFetchState, fetching } = useFetching()
  const { addToast } = useToast()
  const { name, path, description, id } = editingDevice || {}

  const nameState = useFormControl(name)
  const descriptionState = useFormControl(description)
  const pathState = useFormControl(path)

  const hasInvalidPathError = error?.code === 'devicePathDoesNotExist'
  const unknownError = error && !hasInvalidPathError

  useEffect(() => {
    resetFetchState()
  }, [show])

  async function _updateDevice () {
    await doFetch(async () => {
      await updateDevice({
        id,
        name: nameState.value,
        description: descriptionState.value,
        path: pathState.value
      })

      setShow(false)
      loadDevices()
      addToast({
        header: 'Success',
        body: 'Device updated successfully',
        type: 'success'
      })
    })
  }

  async function _createDevice () {
    await doFetch(async () => {
      await createDevice({
        name: nameState.value,
        description: descriptionState.value,
        path: pathState.value
      })

      setShow(false)
      loadDevices()
      addToast({
        header: 'Success',
        body: 'Device created successfully',
        type: 'success'
      })
    })
  }

  const onSubmit = (e) => {
    if (editingDevice) {
      _updateDevice()
    } else {
      _createDevice()
    }

    e.preventDefault()
  }
  const title = editingDevice ? 'Edit Device' : 'Create Device'

  function _onClose () {
    setShow(false)
    onClose && onClose()
    nameState.reset()
    descriptionState.reset()
    pathState.reset()
  }

  return html`
    <${Dialog}
    id="createSourceDeviceModal"
    show=${show}
    onClose=${_onClose}
    title=${title}
>
<form onSubmit=${onSubmit}>
<div class="modal-body">
    <div class="mb-2">
        ${editingDevice && `id: ${editingDevice?.id}`}
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
        onClick=${() => setShow(false)}
        >Cancel<//
    >
    <${Button} fetching=${fetching} type="submit">Save<//>
</div>
</form>
<//>

    `
}
