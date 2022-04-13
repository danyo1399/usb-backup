import * as globals from '../globals.js'

const html = globals.html

const { Link: StaticLink, exec, useRouter } = globals.preactRouter

export function Match (props) {
  const router = useRouter()[0]
  return props.children({
    url: router.url,
    path: router.path,
    matches: exec(router.path || router.url, props.path, {}) !== false
  })
}

export function Link ({
  className,
  activeClass,
  activeClassName,
  path,
  ...props
}) {
  const router = useRouter()[0]
  const matches = (path && router.path && exec(router.path, path, {})) || exec(router.url, props.href, {})

  const inactive = props.class || className || ''
  const active = (matches && (activeClass || activeClassName)) || ''
  props.class = inactive + (inactive && active && ' ') + active

  return html`<${StaticLink} ...${props} />`
}

export default Link
