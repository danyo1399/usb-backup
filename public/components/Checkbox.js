
import * as globals from '../globals.js'
import { useUniqueId } from '../hooks.js'

const h = globals.html
const { useState, useEffect } = globals.preactHooks
export function Checkbox ({ label, id, checked, onClick, ...props }) {
  const generatedId = useUniqueId()
  const componentId = id || generatedId
  const [checkState, setCheckState] = useState(checked)

  function clickHandler (evt) {
    evt.preventDefault()
    onClick && onClick()
  }

  // hacky workaroudn to
  // https://github.com/preactjs/preact/issues/3486
  useEffect(() => {
    setTimeout(() => {
      setCheckState(checked)
    }, 0)
  }, [checked])

  return h`
  <div class="form-check form-check-inline">
  <input class="form-check-input" type="checkbox" id="${componentId}" checked=${checkState} onClick=${clickHandler} />
  <label class="form-check-label" for="${componentId}">${label}</label>
  </div>
  `
}
