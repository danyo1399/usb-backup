import { Modal } from './Modal.js'

import { classNames, createContext, html, useContext, useState } from '../../globals.js'
import { newIdNumber } from '../../fns.js'

const Context = createContext(null)

export function useDialog () {
  const { setDialog } = useContext(Context)
  return {
    showDialog (Dialog, { size, title, className, showCloseButton, props }) {
      const ariaLabeledBy = `dialog-label-${newIdNumber()}`
      setDialog({ Dialog, size, title, className, showCloseButton, ariaLabeledBy, props })
    }
  }
}

export function DialogProvider ({ children }) {
  const [dialog, setDialog] = useState(null)

  function dialogClosed () {
    setDialog(null)
  }

  const { title, size, showCloseButton, Dialog, ariaLabeledBy, className, props } = dialog || {}

  const contextValue = { setDialog }

  return html`
  <${Context.Provider} value=${contextValue}>
  ${Dialog && html`
    <${Modal} onClose=${dialogClosed} className=${className} ariaLabeledBy=${ariaLabeledBy} >
    ${({ closeDialog }) => html`
      <div class=${classNames('modal-dialog', size || '')}>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id=${ariaLabeledBy}>${title}</h5>
            ${showCloseButton && html`<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`}
          </div>
          <${dialog.Dialog} closeDialog=${closeDialog} ...${props || {}}/>
        </div>
      </div>
    `}

    <//>
  `}
  ${children}
  <//>
  `
}
