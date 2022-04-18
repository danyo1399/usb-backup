import { html } from '../globals.js'
import { useDialog } from './Dialog/index.js'

export function useConfirm () {
  const { showDialog } = useDialog()

  function prompt (title, body, onConfirm) {
    showDialog(DialogContent, { title, props: { body, onConfirm } })
  }

  return { prompt }
}

function DialogContent ({ body, onConfirm, closeDialog }) {
  function _onConfirm () {
    onConfirm()
    closeDialog()
  }
  return html`
    <div class="modal-body">
      <p>${body}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onClick=${closeDialog}>Cancel</button>
      <button type="button" class="btn btn-primary" onClick=${_onConfirm}>Confirm</button>
    </div>
  `
}
