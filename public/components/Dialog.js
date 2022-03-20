import * as globals from '../../globals.js'
import { Modal } from './Modal.js'

const html = globals.html

export function Dialog ({ children, onClose, title, id, ...props }) {
  const ariaLabeledBy = `${id}-label`
  return html`
    <${Modal} ...${props} onClose=${onClose} id="${id}" ariaLabeledBy=${ariaLabeledBy}>
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title" id=${ariaLabeledBy}>${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                ${children}
            </div>
        </div>
    </Modal>
  `
}
