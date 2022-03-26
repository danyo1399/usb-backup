import { createEntityAdapter, defaultEntityAdapterState } from './fns.js'
import * as globals from './globals.js'
const { useEffect, useState } = globals.preactHooks
export function useFormControl (defaultValue) {
  const [value, setValue] = useState(defaultValue)
  const [touched, setTouched] = useState()
  const [dirty, setDirty] = useState()

  function reset () {
    setDirty(false)
    setTouched(false)
    setValue(defaultValue || '')
  }

  useEffect(() => {
    !dirty && setValue(defaultValue || '')
  }, [defaultValue])

  const attributes = {
    onBlur () {
      setTouched(true)
    },
    onInput (e) {
      const { value } = e.target
      setDirty(true)
      setValue(value)
    },
    value: dirty ? (value || '') : (defaultValue || '')
  }

  return { attributes, value, setValue, dirty, touched, reset }
}

export function useFetching () {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  function resetFetchState () {
    setStatus('idle')
    setError(null)
  }

  async function doFetch (fn) {
    try {
      setStatus('fetching')
      await fn()
      setStatus('fetched')
    } catch (error) {
      console.error('Fetch error', error)
      setStatus('error')
      setError(error)
    }
  }
  return { status, error, resetFetchState, doFetch, fetching: status === 'fetching' }
}

export function useIteratorState (getIterator, getItems) {
  const [state, setState] = useState([])
  useEffect(() => {
    const iterator = getIterator();

    (async () => {
      for await (const newItems of iterator) {
        setState(oldState => {
          const newState = [...oldState]
          for (const newItem of getItems(newItems)) {
            newState.push(newItem)
          }
          return newState
        })
      }
    })()
    return () => {
      iterator.return()
    }
  }, [])

  return state
}

export function useApiData (apiFn) {
  const [data, setData] = useState(null)

  useEffect(() => {
    (async () => {
      const response = await apiFn()
      setData(response)
    })()
  }, [])

  return data
}

export function useObservableState (observable$) {
  const [state, setState] = useState()

  useEffect(() => {
    const subscription = observable$?.subscribe(value => {
      setState(value)
    })
    return () => subscription?.unsubscribe()
  }, [observable$])
  return state
}

export function useIdentityTrackedIteratorState (getIterator, getId = x => x.id, getItems) {
  const [state, setState] = useState(defaultEntityAdapterState())
  useEffect(() => {
    const iterator = getIterator();

    (async () => {
      for await (const newItems of iterator) {
        setState(oldState => {
          const adapter = createEntityAdapter(oldState, getId)
          for (const newItem of getItems(newItems)) {
            adapter.upsert(newItem)
          }
          return adapter.state()
        })
      }
    })()
    return () => {
      iterator.return()
    }
  }, [])

  return createEntityAdapter(state).items()
}

let lastId = 1
export function useUniqueId (prefix) {
  const [state] = useState(lastId++)
  return `${prefix || 'uniqueid'}-${state}`
}
