import * as globals from '../../globals.js'
const { html, classNames } = globals

export function Icon ({ name, size, className = '' }) {
  return html`<i style=${{ fontSize: size }} class="${classNames(className, `bi-${name}`)}"></i>`
}
