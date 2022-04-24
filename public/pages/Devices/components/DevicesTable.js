import { bytesToSize, dateString } from '../../../fns.js'
import { html } from '../../../globals.js'
import { useObservableState } from '../../../hooks.js'
import { deviceInfo$ } from '../../../api/index.js'
import { ActionsTableButton, Checkbox } from '../../../components/index.js'

export default function DevicesTable ({ devices, variant, isSelected, selectAll, allSelected, toggleSelected, deleteDevice, editDevice, viewFiles }) {
  if (devices.length === 0) {
    return null
  }

  const deviceInfo = useObservableState(deviceInfo$) || {}
  return html`
        <div>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col"><${Checkbox} checked=${allSelected} onClick=${selectAll} ><//></th>
                        <th scope="col">Online</th>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Path</th>
                        <th scope="col">Available</th>
                        <th scope="col">Used</th>
                        <th scope="col">Orphan</th>
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
                                <input class="form-check-input" type="checkbox" id="cb-${dev.id}" checked=${isSelected(dev.id)} onChange=${() => toggleSelected(dev.id)} />
                                <label class="form-check-label" for="cb-${dev.id}"></label>
                                </div>
                                </td>
                                <td>${deviceInfo[dev.id]?.isOnline ? 'Y' : ''}</td>
                                <td>${dev.name}</td>
                                <td>${dev.description}</td>
                                <td>${dev.path}</td>
                                <td>${bytesToSize(deviceInfo[dev.id]?.freeSpace)}</td>
                                <td>${bytesToSize(dev.usedSize)}</td>
                                <td>${bytesToSize(dev.orphanSize)}</td>
                                <td>${dateString(dev.lastScanDate)}</td>
                                ${variant === 'source' && html`<td>${dateString(dev.lastBackupDate)}</td>`}
                                <td>
                                    <div class="dropdown">
                                        <${ActionsTableButton}
                                            id="dropdownMenu2"
                                        >
                                        <//>
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
