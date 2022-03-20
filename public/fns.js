export function delay (fn, timeout = 500) {
  return (...args) => {
    setTimeout(() => fn(...args), timeout)
  }
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

export function handleResponseError (response) {
  const data = response.data

  for (const x of Object.values(data)) {
    if (x.error && x.error.code) throw x.error
  }
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
