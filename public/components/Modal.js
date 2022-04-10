import * as globals from '../../globals.js'
const { html, preactHooks, bootstrap } = globals

const { useRef, useEffect } = preactHooks

export function Modal ({ id, ariaLabeledBy, className, children, show, onClose }) {
  const modalRef = useRef(null)
  const controlRef = useRef(null)
  show = !!show
  useEffect(() => {
    if (modalRef.current && controlRef.current === null) {
      const myModal = new bootstrap.Modal(modalRef.current)

      modalRef.current.addEventListener(
        'hidden.bs.modal', (event) => {
          onClose && onClose()
        }
      )

      controlRef.current = myModal
    }
  }, [])

  useEffect(() => {
    if (show) {
      controlRef.current?.show()
    } else {
      controlRef.current?.hide()
    }
  }, [show])

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
        ${children}
        </div>
    `
}
