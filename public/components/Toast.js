import { delay } from '../../fns.js'
import { createContext, css, html, useContext, useRef, useState } from '../globals.js'

const ToastContext = createContext(null)
let nextId = 1

/**
 *
 * @returns addToast
 * toast.header
 * toast.body
 * toast.permanent
 * toast.type
 */
export function useToast () {
  const { addToast } = useContext(ToastContext)
  return { addToast }
}

export function ToastProvider ({ children }) {
  const [toasts, setToasts] = useState([])
  const shownToasts = useRef({})

  function removeToast (toast) {
    delete shownToasts.current[toast.id]
    setToasts((toasts) => toasts.filter((t) => t.id !== toast.id))
  }

  // we delay to give time for scrollbar to pop in before showing toast.
  // Dialogs hide the scrollbar while visible
  const addToast = delay(function _addToast (toast) {
    toast.id = nextId++
    setToasts((list) => [...list, toast])
    shownToasts.current[toast.id] = toast
    if (!toast.permanent) {
      setTimeout(() => {
        removeToast(toast)
      }, 5000)
    }
  })

  return html` <${ToastContext.Provider} value=${{ toasts, addToast }}>${children} <//> `
}
export function Toast () {
  const styles = css`
  .toast--success {
    background-color: var(--bs-success) !important;
    color: white;
  }
  `
  const { toasts } = useContext(ToastContext)

  return html`
    <div class="position-fixed bottom-0 end-0 p-3 ${styles}" style="z-index: 11">
      <div class="toast-container ">
        ${toasts.map(
          (toast) => html`
            <div
              id="liveToast"
              class="toast show ${toast.type && `toast--${toast.type}`}"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div class="toast-header">
                <strong class="me-auto">${toast.header}</strong>
                <small></small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
              <div class="toast-body">${toast.body}</div>
            </div>
          `
        )}
      </div>
    </div>
  `
}
