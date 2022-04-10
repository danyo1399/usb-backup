import * as globals from '../globals.js'
import { Modal } from './Modal.js'

const { classNames } = globals
const html = globals.html
const { useState } = globals.preactHooks

export function useDialog () {
  const [show, setShow] = useState(false)

  return { closeDialog: () => setShow(false), showDialog: () => setShow(true), setShow, dialogProps: { show, onClose: () => setShow(false) } }
}

export function Dialog ({ children, onClose, title, showCloseButton = true, size, id, ...props }) {
  const ariaLabeledBy = `${id}-label`
  return html`
    <${Modal} ...${props} onClose=${onClose} id="${id}" ariaLabeledBy=${ariaLabeledBy}>
        <div class=${classNames('modal-dialog', size)}>
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title" id=${ariaLabeledBy}>${title}</h5>
                ${showCloseButton && html`<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`}
                </div>
                ${children}
            </div>
        </div>
    <//>
  `
}
