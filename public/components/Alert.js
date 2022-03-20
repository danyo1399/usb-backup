import * as globals from '../../globals.js'
const html = globals.html

export function Alert ({ type, children, dismiss }) {
  return html`
    <div class="alert fade alert-dismissible show ${type || 'alert-warning'}" role="alert">
        ${children}
        <button type="button" class="btn-close" onClick=${() => dismiss()}  aria-label="Close"></button>
    </div>
    `
}
