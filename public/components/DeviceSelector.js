import { useDevices, useUniqueId } from '../hooks.js'
import * as globals from '../globals.js'
const { useState } = globals.preactHooks
const { html } = globals
const { css } = globals.goober

export function useDeviceSelector (type) {
  const deviceCollections = useDevices()
  const devices = type === 'source'
    ? deviceCollections?.sources
    : type === 'backup'
      ? deviceCollections?.backups
      : deviceCollections.all || []

  const [selectedDeviceId, setSelectedDeviceId] = useState()

  const selectedDevice = devices.find(x => x.id === selectedDeviceId)
  return { selectedDevice, selectorProps: { devices, selectedDeviceId, setSelectedDeviceId } }
}

export function DeviceSelector ({ devices, selectedDeviceId, setSelectedDeviceId, id, label }) {
  const styles = css``
  const generatedId = useUniqueId('device-selector')
  id = id || generatedId
  label = label || 'Devices'
  return html`
      <div class=${styles}>
      <label for=${id} class="form-label">${label}</label>
      <select required id=${id} value=${selectedDeviceId} onChange=${e => setSelectedDeviceId(e.target.value)} class="form-select" aria-label=${label}>
      ${!selectedDeviceId && html`<option disabled selected value> -- select an option -- </option>`}
      ${devices.map(x => html`<option selected=${selectedDeviceId === x.id} value=${x.id}>${x.name} - ${x.description}</option>`)}
      </select>
      </div>
  `
}
