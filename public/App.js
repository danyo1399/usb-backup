import { ToastProvider, Toast, SideNav } from './components/index.js'
import constants from './constants.js'
import Devices from './features/Devices/index.js'
import './graphql.js'
import * as globals from './globals.js'
import Jobs from './features/Jobs/index.js'
import JobLog from './features/Jobs/components/JobLog.js'
import LicenceDialog from './components/Licence.js'
const { Router } = globals.preactRouter
const html = globals.html

const SouceDevices = (props) => html`<${Devices} ...${props} variant="source"/>`
const BackupDevices = (props) => html`<${Devices} ...${props} variant="backup"/>`

export default function App () {
  return html`
        <div class="layout">
        <${LicenceDialog}/>
            <${ToastProvider}>
                <${Toast} />
                <${SideNav} />
                <div class="main-content">
                    <${Router}>
                        <${SouceDevices} path=${constants.routes.sources} />
                        <${BackupDevices} path=${constants.routes.backupDevices} />
                        <${Jobs} path=${constants.routes.jobs} />
                        <${JobLog} path=${constants.routes.jobLog} />
                    <//>
                </div>
            <//>
        </div>
    `
}
