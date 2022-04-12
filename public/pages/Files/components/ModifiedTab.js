import { css, html } from '../../../globals.js'
import { FileTable } from './FileTable.js'

export function ModifiedTab () {
  const styles = css`
  `
  const data = []

  return html`
  <div class=${styles}>
<p>
  List of source files that have been silently modified (modified without affecting other attributes).
  Could be an indication of bit rot
</p>
<${FileTable} data=${data}/>

</div>`
}
