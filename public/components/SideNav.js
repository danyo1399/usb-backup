import { Icon } from './Icon.js'
import constants from '../constants.js'
import * as globals from '../globals.js'
import { JobsMenuItem } from '../features/Jobs/index.js'
import Link from './Link.js'

const html = globals.html
const { css } = globals.goober

export function SideNav () {
  const styles = css`
  background-color: var(--color-black);
  height: 100vh;
  width: 18rem;
  top: 0;
  position: sticky;
  min-width: 18rem;
  color: white;
  padding: 0.5rem 1rem 1rem 1rem;
  .header {
    display: grid;
    grid-template-columns: 3rem auto;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-gray-200);
    .icon {
      font-size: 2rem;
      margin-right: 1rem;
    }
    .title {
      font-size: 1.2rem;
      font-weight: var(--font-weight-semibold);
    }
    .github {

    }
  }
  .menu {
    padding: 1rem 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .main {

  }
  `
  return html`<div class=${styles}>
              <div class="header">
                  <${Icon} name="hdd" className="icon"/>
                 <span class="title"> USB Backup</span>
                 <iframe class="github"
                 src="https://ghbtns.com/github-btn.html?user=danyo1399&repo=usb-backup&type=star&count=true&size=small"
                 frameborder="0" scrolling="0" width="170" height="30" title="GitHub"></iframe>
              </div>


              <div class="main">
                  <div class="menu">
                  <${SideNavMenuItem} icon="pc" href="${constants.routes.sources}">Source Devices<//>
                  <${SideNavMenuItem} icon="hdd-network" href="${constants.routes.backupDevices}" >Backup Devices<//>
                  <${SideNavMenuItem} icon="files" href="${constants.routes.getFilesUrl()}" >Files<//>
                  <${JobsMenuItem}><//>

                  </div>
              </div>
          </div>`
}

export function SideNavMenuItem ({ icon, children, href }) {
  const styles = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: white;
  cursor: pointer;
  border-radius: 3px;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  padding: 0.5rem;
  text-decoration: none;
  &.menuitem-active {
    background-color: var(--color-gray-100);
  }
  &:hover {
    background-color: var(--color-gray-200);
    color: white;
  }
  .icon {
    font-size: 1.8rem;
  }
  `
  return html`<${Link} activeClassName="menuitem-active" class=${styles} href="${href}"
    ><${Icon} className="icon" name="${icon}" /> ${children}<//
  >`
}
