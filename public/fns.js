export function delay (fn, timeout = 500) {
  return (...args) => {
    setTimeout(() => fn(...args), timeout)
  }
}

export function shortDateTimeString (date) {
  return `${date.getFullYear() % 1000}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.toTimeString().substr(0, 8)}`
}
export function bytesToSize (bytes) {
  if (!bytes) return ''
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return (bytes / Math.pow(1024, i)).toFixed(i >= 3 ? 2 : 0) + ' ' + sizes[i]
}

export function getSelectedKeys (obj) {
  return Object.entries(obj || {}).filter(([_, selected]) => selected).map(([id]) => id)
}

export function dateString (timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

let nextId = 1
export function newNumberId () {
  return nextId++
}
