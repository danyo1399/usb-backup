import FileBrowser from '../../../components/FileBrowser.js'
import * as globals from '../../../globals.js'
import { useApiData, useFileTree } from '../../../hooks.js'
import { useDevice } from '../../../index.js'
import { getFilesByDeviceIdAsync } from '../../../queries/files.js'
const html = globals.html
const { useState } = globals.preactHooks

export default function ViewFiles ({ deviceId }) {
  const files = useApiData(getFilesByDeviceIdAsync, deviceId) || []
  const tree = useFileTree(files)
  const [path, setPath] = useState('/')
  const device = useDevice(deviceId)

  const node = tree[path]

  return html`
  <h1>Veiw Files</h1>
  <h5>Viewing files for device ${device?.name}</h5>
  <p>${device?.description}</p>
  <${FileBrowser} tree=${tree} currentPath=${path} node=${node} navigate=${setPath} >
  <//>
  `
}
