import { html, useRef } from '../globals.js'

let id = 1
function nextId () {
  return `text-form-field-${id++}`
}
export default function TextFormField ({ id, label, className, ...props }) {
  const idRef = useRef(id || nextId())
  return html`
  <div class="form-group">
  <label for=${idRef.current} class="form-label">${label}</label>
  <input
      type="text"
      ...${props}
      className="form-control ${className || ''}"
      id=${idRef.current}
  />
  </div>
  `
}
