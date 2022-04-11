import * as globals from '../../../globals.js'
const html = globals.html
const { css } = globals.goober

export function PaginationButtons ({
  firstPage,
  previousPage,
  nextPage,
  lastPage,
  hasPrevious,
  hasNext, ...props
}) {
  const styles = css`
  display: flex;
  justifyContent: center;
  gap: 1rem;
  button {
    width: 7rem;
    text-transform: uppercase;
  }
  `
  return html`<div class=${styles}>
  <button type="button" class="btn btn-secondary btn-sm" disabled=${!hasPrevious} onClick=${firstPage}>First</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${!hasPrevious} onClick=${previousPage}>Previous</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${!hasNext} onClick=${nextPage}>Next</button>
  <button type="button" class="btn btn-secondary  btn-sm" disabled=${!hasNext} onClick=${lastPage}>Last</button>
</div>`
}
