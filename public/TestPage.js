import { FileBrowser } from './components/index.js'
import * as globals from './globals.js'
import { useApiData, useFileTree } from './hooks.js'
import { getFilesByDeviceIdAsync } from './api/index.js'
const html = globals.html
const { useState } = globals.preactHooks

export default function Test () {
  const { data: files } = useApiData([], () => getFilesByDeviceIdAsync('7b1b2e4850cfd62b3a422769fd3abf02'))
  const tree = useFileTree(files)
  const [path, setPath] = useState('/')

  const node = tree[path]

  return html`
  <h1>Test Page</h1>
  <${FileBrowser} tree=${tree} currentPath=${path} node=${node} navigate=${setPath} >
  <//>
  `
}
