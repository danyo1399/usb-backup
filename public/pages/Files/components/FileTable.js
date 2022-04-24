
import { PaginationButtons } from '../../../components/PaginationButtons.js'
import { css, html } from '../../../globals.js'
import { usePagination } from '../../../hooks.js'

export function FileTable ({ className, data }) {
  const styles = css`
  .path-cell {
    overflow-wrap: anywhere;
  }
  `
  const pagination = usePagination(data, 15)
  const { page } = pagination

  if (!data) return html`Loading...`
  return html`
  <table className="table ${className} ${styles}">
  <thead>
    <tr>
      <td>Device</td>
      <td>path</td>
      <td>hash</td>
    </tr>
  </thead>
  <tbody>
    ${page.map(x => html`
    <tr>
      <td>
        ${x.deviceName}
      </td>
      <td class="path-cell">
    ${cleanPath(x.devicePath, x.relativePath)}
      </td>
      <td>
        ${x.hash}
      </td>
    </tr>`)}
  </tbody>
</table>

<${PaginationButtons} ...${pagination} />
  `
}

function cleanPath (devicePath, relativePath) {
  devicePath = devicePath.replaceAll('\\', '/')
  relativePath = relativePath.replaceAll('\\', '/')
  const separator = devicePath.endsWith('/') ? '' : '/'
  return `${devicePath}${separator}${relativePath}`
}
