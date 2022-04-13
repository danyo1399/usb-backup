import { classNames, html } from '../globals.js'

export function Icon ({ name, size, className = '' }) {
  return html`<i style=${{ fontSize: size }} class="${classNames(className, `bi-${name}`)}"></i>`
}
