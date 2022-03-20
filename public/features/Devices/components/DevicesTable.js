import { toDateString } from '../../../components/index.js'
import * as globals from '../../../globals.js'

const html = globals.html

export default function DevicesTable ({ devices, selected, toggleSelected, deleteDevice, editDevice, onCreateBackupJob }) {
  if (devices.length === 0) {
    return null
  }

  return html`
        <div>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Path</th>
                        <th scope="col">Last Scanned</th>
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

                                <td>${dev.name}</td>
                                <td>${dev.description}</td>
                                <td>${dev.path}</td>
                                <td>${toDateString(dev.lastScanDate)}</td>
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
