import { useDevices, useObservableState, useUniqueId } from '../hooks.js'
import { css, html, useState } from '../globals.js'
import { deviceInfo$ } from '../api/devices.js'

export function useDeviceSelector (type, includeOffline = false) {
  const deviceCollections = useDevices()
  const deviceInfos = useObservableState(deviceInfo$, {})
  let devices = type === 'source'
    ? deviceCollections?.sources
    : type === 'backup'
      ? deviceCollections?.backups
      : deviceCollections.all || []

  if (!includeOffline) {
    devices = devices.filter(x => deviceInfos[x.id].isOnline)
  }
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
