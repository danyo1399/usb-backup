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

export function containsErrorCode ({ code, error }) {
  if (!Array.isArray(error)) return false
  return (error || []).some(x => x.code === code)
}

export function isUnknownError (error) {
  return error && Array.isArray(error) === false
}

export function defaultEntityAdapterState () {
  return { items: {}, ids: [] }
}

export function createEntityAdapter ({ items, ids }, getId = x => x.id) {
  items = { ...items }
  ids = [...ids]

  return {
    upsert (entity) {
      const id = getId(entity)
      if (!items[id]) {
        ids.push(id)
      }
      items[id] = entity
      return this.state()
    },
    items () {
      return ids.map(id => items[id])
    },
    state () {
      return { items: { ...items }, ids: [...ids] }
    },
    delete (entity) {
      const id = getId(entity)
      delete items[id]
      ids = ids.filter(x => x === id)
      return this.state()
    }
  }
}
