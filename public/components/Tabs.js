
import Link from '../components/Link.js'
import * as globals from '../globals.js'
const html = globals.html
const { useEffect, useState } = globals.preactHooks
const { route } = globals.preactRouter
const { css } = globals.goober
const classNames = globals.classNames

export default function Tabs ({ items, className, selected, ...props }) {
  const styles = css`
  `
  items = items || []

  return html`
  <ul class="${styles} ${className} nav nav-tabs">
    ${items.map((item, index) => html`
    <li class="nav-item">
      <${Link}
        class="nav-link ${classNames({ disabled: item.disabled, active: selected === item.key })}"
        aria-current=${selected === item.key && 'page'} aria-disabled=${item.disabled}
        href=${item.href}>${item.label}</a>
    </li>
    `)}
  </ul>
  `
}
