import { Tabs } from '../../components/index.js'
import constants from '../../constants.js'
import { PendingTab } from './components/PendingTab.js'
import { DuplicatesTab } from './components/DuplicatesTab.js'
import { css, html } from '../../globals.js'
import { ModifiedTab } from './components/ModifiedTab.js'
import { RemovedTab } from './components/RemovedTab.js'

const items = [
  { label: 'Pending', key: 'pending', href: constants.routes.getFilesUrl('pending') },
  { label: 'Removed', key: 'removed', href: constants.routes.getFilesUrl('removed') },
  { label: 'Duplicates', key: 'duplicates', href: constants.routes.getFilesUrl('duplicates') },
  { label: 'Modified', key: 'modified', href: constants.routes.getFilesUrl('modified') }
]
export default function Files ({ tab }) {
  const styles = css`
  `
  return html`
  <div class=${styles}>
    <h1>Files</h1>
    <${Tabs} items=${items} className='mb-3' selected=${tab}/>
    ${tab === 'pending' && html`<${PendingTab}/>`}
    ${tab === 'duplicates' && html`<${DuplicatesTab}/>`}
    ${tab === 'removed' && html`<${RemovedTab}/>`}
    ${tab === 'modified' && html`<${ModifiedTab}/>`}
  </div>
  `
}
