import { bootstrap, html, useEffect, useRef } from '../../globals.js'
import { useId } from '../../hooks.js'

export function Modal ({ id, ariaLabeledBy, className, children, onClose }) {
  const modalRef = useRef(null)
  const controlRef = useRef(null)
  id = useId('modal', id)
  useEffect(() => {
    if (modalRef.current && controlRef.current === null) {
      const myModal = new bootstrap.Modal(modalRef.current)

      modalRef.current.addEventListener(
        'hidden.bs.modal', (event) => {
          onClose && onClose()
        }
      )
      myModal.show()
      controlRef.current = myModal
    }
  }, [])

  return html`
        <!-- Modal -->
        <div
            ref=${modalRef}
            class="modal fade ${className || ''}"
            data-bs-backdrop="static"
            id="${id}"
            tabindex="-1"
            aria-labelledby="${ariaLabeledBy}"
            aria-hidden="true"
        >
        ${children({ closeDialog: () => controlRef.current.hide() })}
        </div>
    `
}
