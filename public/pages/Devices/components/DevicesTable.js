import { bytesToSize, dateString } from '../../../fns.js'
import { html } from '../../../globals.js'
import { useObservableState } from '../../../hooks.js'
import { deviceInfo$ } from '../../../api/index.js'

export default function DevicesTable ({ devices, variant, selected, toggleSelected, deleteDevice, editDevice, viewFiles }) {
  if (devices.length === 0) {
    return null
  }

  const deviceInfo = useObservableState(deviceInfo$) || {}
  return html`
        <div>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">Online</th>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Path</th>
                        <th scope="col">Available</th>
                        <th scope="col">Last Scanned</th>
                        ${variant === 'source' && html`<th scope="col">Last Backup</th>`}
                    </tr>
                </thead>
                <tbody>
                    ${devices.map(
                        (dev) => html`
                            <tr>
                                <td >
                                <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="cb-${dev.id}" checked=${!!selected[dev.id]} onChange=${() => toggleSelected(dev.id)} />
                                <label class="form-check-label" for="cb-${dev.id}"></label>
                                </div>
                                </td>
                                <td>${deviceInfo[dev.id]?.isOnline ? 'Y' : ''}</td>
                                <td>${dev.name}</td>
                                <td>${dev.description}</td>
                                <td>${dev.path}</td>
                                <td>${bytesToSize(deviceInfo[dev.id]?.freeSpace)}</td>
                                <td>${dateString(dev.lastScanDate)}</td>
                                ${variant === 'source' && html`<td>${dateString(dev.lastBackupDate)}</td>`}
                                <td>
                                    <div class="dropdown">
                                        <button
                                            class="btn btn-sm btn-secondary dropdown-toggle"
                                            type="button"
                                            id="dropdownMenu2"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            Actions
                                        </button>
                                        <ul
                                            class="dropdown-menu"
                                            aria-labelledby="dropdownMenu2"
                                        >
                                            <li>
                                                <button
                                                    class="dropdown-item"
                                                    type="button"
                                                    onClick="${() => editDevice(dev)}"
                                                >
                                                    Edit
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    class="dropdown-item"
                                                    onClick="${() => viewFiles(dev)}"
                                                    type="button"
                                                >
                                                    View Files
                                                </button>
                                            </li>
                                            <li><hr class="dropdown-divider"/></li>
                                            <li>
                                                <button
                                                    class="dropdown-item"
                                                    onClick="${() => deleteDevice(dev)}"
                                                    type="button"
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        `
                    )}
                </tbody>
            </table>
        </div>
    `
}