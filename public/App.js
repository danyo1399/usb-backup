import { ToastProvider, Toast, SideNav } from './components/index.js'
import constants from './constants.js'
import Devices from './features/Devices/index.js'
import './graphql.js'

import Jobs from './features/Jobs/index.js'
import JobLog from './features/Jobs/components/JobLog.js'
import LicenceDialog from './components/Licence.js'

import * as globals from './globals.js'
import Test from './TestPage.js'
import ViewFiles from './features/Files/pages/ViewFiles.js'
import Files from './pages/Files.js'
import { useOnFocus } from './hooks.js'
import { refreshDeviceInfoAsync } from './queries/index.js'
const { Router } = globals.preactRouter
const html = globals.html
const { css } = globals.goober

const SouceDevices = (props) => html`<${Devices} ...${props} variant="source"/>`
const BackupDevices = (props) => html`<${Devices} ...${props} variant="backup"/>`

export default function App () {
  const styles = css`
  display: flex;

  .main-content {
    padding: 1rem;
    width:100%;
    overflow:auto;
  }
  `
  useOnFocus(refreshDeviceInfoAsync)
  return html`
        <div class="${styles}">
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
                        <${ViewFiles} path=${constants.routes.viewFiles} />
                        <${Files} path=${constants.routes.files} />
                        <${Test} path=${constants.routes.test} />
                    <//>
                </div>
            <//>
        </div>
    `
}
