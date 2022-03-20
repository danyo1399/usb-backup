import * as globals from '../../globals.js'
const html = globals.html

export function Button ({ children, type, className, fetching, disabled, ...props }) {
  return html`
    <button type=${type || 'button'} class="btn ${className || 'btn-primary'}" ...${props} disabled=${fetching || disabled}>
      ${fetching && html` <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>`}
      ${children}
    </button>
  `
}
