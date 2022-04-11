
import * as globals from '../globals.js'
const html = globals.html
const { css } = globals.goober

export function ActionBar ({ items, label }) {
  const styles = css`
  height: 3.5rem;
  display:flex;
  align-items:center;
  border: 1px solid #dbdbdb;
  padding:1rem;
  margin-bottom: 0.5rem;
  border-radius: 5px;

  .label {
    font-weight: var(--font-weight-normal);
    font-size: 1.1rem;
    margin-right: 1.5rem;
  }
  `

  return html`
    <div class="${styles}">
      <span class="label">Actions:</span>
      <div class="btn-group mt-3 mb-3" data-hidden=${!items || items.length === 0} role="group" aria-label=${label}>
        ${items.map(item => html`
          <button type="button" class="btn btn-outline-primary" onClick=${item.onClick}>${item.label}</button>
        `)}
      </div>
    </div>
  `
}
