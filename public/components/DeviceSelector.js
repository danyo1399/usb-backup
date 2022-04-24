import { useDevices, useObservableState, useId } from '../hooks.js'
import { css, html, useState } from '../globals.js'
import { deviceInfo$ } from '../api/devices.js'

export function useDeviceSelector (type, { includeOffline, includeAllOption } = { }) {
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
  devices.sort((x, y) => {
    if (x.name < y.name) return -1
    if (x.name > y.name) return 1
    return 0
  })

  const [selectedDeviceId, setSelectedDeviceId] = useState()

  const selectedDevice = devices.find(x => x.id === selectedDeviceId)
  return { selectedDevice, selectorProps: { devices, selectedDeviceId, setSelectedDeviceId, includeAllOption} }
}

export function DeviceSelector ({ devices, selectedDeviceId, includeAllOption, setSelectedDeviceId, id, label }) {
  const styles = css``
  id = useId('device-selector', id)

  label = label || 'Devices'
  return html`
      <div class=${styles}>
      <label for=${id} class="form-label">${label}</label>
      <select required id=${id} value=${selectedDeviceId} onChange=${e => setSelectedDeviceId(e.target.value)} class="form-select" aria-label=${label}>
      ${!selectedDeviceId && !includeAllOption && html`<option disabled selected value> -- select an option -- </option>`}
      ${includeAllOption && html`<option value> -- All -- </option>`}
      ${devices.map(x => html`<option selected=${selectedDeviceId === x.id} value=${x.id}>${x.name} - ${x.description}</option>`)}
      </select>
      </div>
  `
}
