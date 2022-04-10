import { bytesToSize, shortDateTimeString } from '../fns.js'
import * as globals from '../globals.js'
import { useRowSelector } from '../hooks.js'
const { html, preactHooks, goober: { css }, classNames } = globals

const { useState, useEffect, useMemo } = preactHooks

function createPathNodes (currentPath) {
  // get rid of leading /
  const paths = currentPath === '/' ? [''] : currentPath.split('/')
  const pathNodes = []
  let totalPath = ''
  for (const subPath of paths) {
    const path = `${totalPath}/${subPath}`
    pathNodes.push({ label: subPath || 'root', path: `${path}` })
    totalPath = path === '/' ? '' : path
  }
  return pathNodes
}
export default function FileBrowser ({ currentPath, node, navigate, selectedRowsChanged }) {
  const styles = css`
    display: flex;
    flex-direction: column;
    gap:1rem;
  `

  return html`
  <div class=${styles}>
  <${Breadcrumbs} currentPath=${currentPath} selectNode=${navigate}/>
  <${Table} node=${node} navigate=${navigate} selectedRowsChanged=${selectedRowsChanged}/>
 </div>
  `
}

export function Table ({ node, navigate, selectedRowsChanged }) {
  function folderClick (folder) {
    navigate(folder)
  }
  const styles = css`
    border: 1px solid #eaecef;
    width: 100%;
    border-collapse: collapse;
    border-radius: 2px;
    background: #fff;
    .table-header-row {
      height:3rem;
      background-color:#eaecef;
    }

    .selected {
      background-color:#e0edff;
    }

    .link {
      cursor: pointer;
      text-decoration: none;
      color: #0076ff;
      &:hover {
        text-decoration: underline;
      }
    }

    tr td:first-child, tr th:first-child {
      padding-left: 1rem;
    }
    td {
      padding-top: 6px;
      padding-right: 3px;
      padding-bottom: 6px;
      padding-left: 3px;
      border-top: 1px solid #eaecef;
    }
    tr {
      user-select: none;
    }

  `

  const rows = useMemo(() => [
    ...(node?.folders || []).map(x => ({ ...x, type: 'folder' })),
    ...(node?.files || []).map(x => ({ ...x, type: 'file' }))
  ], [node])

  const { reset, rowClick, selectedRows } = useRowSelector()
  useEffect(() => {
    reset()
  }, [node])

  useEffect(() => {
    if (selectedRowsChanged) {
      const indexes = Object.entries(selectedRows).filter(([key, value]) => !!value).map(([key]) => key)
      const paths = indexes.map(index => {
        const { type, path, relativePath } = rows[index]
        return { type, path: path || relativePath }
      })
      selectedRowsChanged(paths)
    }
  }, [selectedRows, selectedRowsChanged])

  function rowClasses (index) {
    return classNames({ selected: selectedRows[index] })
  }

  if (!node) return null

  return html`
  <table class=${styles}>
    <thead>
      <tr class="table-header-row">
      <th>Name</th>
      <th>Size</th>
      <th>Modified</th>
      <th>Hash</th>
      </tr>
    </thead>
    <tbody>
      ${node.parent && html`
      <tr>
        <td>
          <a class="link" onClick=${(e) => folderClick(node.parent, e)}>...</a>
        </td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
        `}
      ${rows.map((row, index) => row.type === 'folder'
? html`
      <tr class=${rowClasses(index)} onClick=${() => rowClick(index)}>
        <td>
          <a key=${row.path} class="link" onClick=${(e) => folderClick(row.path, e)}>${row.name}</a>
        </td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      `
            : html`
      <tr key=${row.basename} class=${rowClasses(index)} onClick=${() => rowClick(index)}>
        <td>${row.basename}</td><td>${bytesToSize(row.size)}</td>
        <td>${shortDateTimeString(new Date(row.mtimeMs))}</td>
        <td>${row.hash}</td>
    </tr>`
      )}
    </tbody>
  </table>
  `
}

export function Breadcrumbs ({ currentPath, selectNode }) {
  const styles = css`
  display:flex;
  gap: 0.8rem;
  font-size: 1.5rem;
  font-weight:normal;
  flex-wrap: wrap;
  .node {
    cursor: pointer;
    text-decoration: none;
    color: #0076ff;
    &:hover {
      text-decoration: underline;
    }
    &.last-node {
      text-decoration: none;
      color:black;
      font-weight:bold;
      pointer-events: none;
    }
  }

`
  const pathNodes = createPathNodes(currentPath)

  return html`
  <div class="${styles}">
  ${pathNodes.map((x, index) => {
    const isLast = index === pathNodes.length - 1
    return html`
    <a
    onClick=${() => selectNode(x.path)}
    class="${classNames('node', { 'last-node': isLast })}">${x.label}</a>
    ${!isLast && html`<div>/</div>`}
    `
  })}
  </div>
  `
}
