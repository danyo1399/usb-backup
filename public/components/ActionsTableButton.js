import { css, html } from '../globals.js'

export function ActionsTableButton ({ class: className, ...props }) {
  const styles = css`
    height: 1.4rem;
    line-height: 0;
  `

  return html`
    <button
      class="btn btn-sm btn-secondary ${className} ${styles} "
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      ...${props}
  >
      ...
  </button>
  `
}
