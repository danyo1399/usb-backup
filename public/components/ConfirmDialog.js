import { Modal } from './Modal.js'
import * as globals from '../../globals.js'
const { useRef } = globals.preactHooks
const { html } = globals

let id = 1

export function ConfirmDialog ({ show, onConfirm, onCancel, header, body }) {
  const idRef = useRef(`confirm-dialog-${id++}`)

  return html`
        <${Modal} show=${show} id="${idRef.current} onClose=${onCancel}">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${header}</h5>
                        <button type="button" class="btn-close" onClick=${onCancel} aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${body}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                        <button type="button" class="btn btn-primary" onClick=${onConfirm}>Confirm</button>
                    </div>
                </div>
            </div>
        <//>

    `
}
