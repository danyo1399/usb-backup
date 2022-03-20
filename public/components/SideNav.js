import { Icon } from './Icon.js'
import constants from '../constants.js'
import * as globals from '../globals.js'
import { JobsMenuItem } from '../features/Jobs/index.js'

const { Link } = globals.preactRouter
const html = globals.html

export function SideNav () {
  return html`<div class="sidenav">
              <div class="sidenav-header">
                  <${Icon} name="hdd" className="sidenav-header__icon"/>
                 <span class="sidenav-header__title"> USB Backup</span>
              </div>

              <div class="sidenav-main">
                  <div class="sidenav__menu">
                  <${SideNavMenuItem} icon="pc" href="${constants.routes.sources}">Source Devices</SideNavMenuItem>
                  <${SideNavMenuItem} icon="hdd-network" href="${constants.routes.backupDevices}" >Backup Devices</SideNavMenuItem>

                  <${JobsMenuItem}></JobsMenuItem>

                  </div>
              </div>
          </div>`
}

export function SideNavMenuItem ({ icon, children, href }) {
  return html`<${Link} activeClassName="boo" className="sidenav__menuitem" href="${href}"
    ><${Icon} className="sidenav__menuitem-icon" name="${icon}" /> ${children}<//
  >`
}
