import { useId } from '../hooks.js'
import { html, useEffect, useState } from '../globals.js'

export function Checkbox ({ label, id, checked, onClick, ...props }) {
  const componentId = useId('checkbox', id)
  const [checkState, setCheckState] = useState(checked)

  function clickHandler (evt) {
    evt.preventDefault()
    onClick && onClick()
  }

  // hacky work around to
  // https://github.com/preactjs/preact/issues/3486
  useEffect(() => {
    setTimeout(() => {
      setCheckState(checked)
    }, 0)
  }, [checked])

  return html`
  <div class="form-check form-check-inline">
  <input class="form-check-input" type="checkbox" id="${componentId}" checked=${checkState} onClick=${clickHandler} />
  <label class="form-check-label" for="${componentId}">${label}</label>
  </div>
  `
}
