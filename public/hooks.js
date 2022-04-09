import { createEntityAdapter, defaultEntityAdapterState } from './fns.js'
import * as globals from './globals.js'
import { getBackupDevicesAsync, getSourceDevicesAsync } from './queries/devices.js'
import { jobs$ } from './queries/jobs.js'
const { useEffect, useState, useMemo, useCallback } = globals.preactHooks

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

export function useRowSelector () {
  const shift = useKeyDownMonitor('Shift')
  const control = useKeyDownMonitor('Control')
  const [selectedRows, setSelectedRows] = useState({})
  const [lastSelectedIndex, setLastSelectedIndex] = useState()

  function rowClick (index) {
    if (shift && index !== lastSelectedIndex && lastSelectedIndex != null && selectedRows[lastSelectedIndex]) {
      setSelectedRows(() => {
        const newSelected = {}
        if (lastSelectedIndex < index) for (let i = lastSelectedIndex; i <= index; i++) newSelected[i] = true
        else for (let i = lastSelectedIndex; i >= index; i--) newSelected[i] = true
        return newSelected
      })
    } else if (control) {
      setSelectedRows(x => ({ ...x, [index]: !x[index] }))
    } else {
      if (!selectedRows[index]) {
        setLastSelectedIndex(index)
      }
      setSelectedRows({ [index]: true })
    }
  }

  function reset () {
    setSelectedRows({})
    setLastSelectedIndex(null)
  }
  return { rowClick, selectedRows, reset }
}

export function useJob (jobId) {
  return (useObservableState(jobs$) || []).find(x => x.id === jobId)
}

export function useDevices () {
  const [sources, setSources] = useState([])
  const [backups, setBackups] = useState([])
  const all = [...sources, ...backups]
  useEffect(() => {
    getSourceDevicesAsync().then(x => setSources(x))
    getBackupDevicesAsync().then(x => setBackups(x))
  }, [])

  return { sources, backups, all }
}

export function useDevice (deviceId) {
  const state = useDevices()
  return (state?.all || []).find(x => x.id === deviceId)
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

export function useEventListener (obj, event, callback) {
  useEffect(() => {
    obj.addEventListener(event, callback)
    return () => {
      obj.removeEventListener(event, callback)
    }
  }, obj, event, callback)
}

export function useKeyDownMonitor (key) {
  const [state, setState] = useState(false)
  useEffect(() => {
    function keyDown (evt) {
      if (evt.key === key) setState(true)
    }

    function keyUp (evt) {
      if (evt.key === key) setState(false)
    }

    function blur () {
      setState(false)
    }

    useEventListener(window, 'keydown', keyDown)
    useEventListener(window, 'keyup', keyUp)
    useEventListener(window, 'blur', blur)
  }, [])
  return state
}

const isVisible = () => {
  const visibilityState = document.visibilityState
  return visibilityState == null || visibilityState !== 'hidden'
}
export function useOnFocus (callback) {
  const _callback = useCallback(() => {
    if (isVisible()) {
      callback()
    }
  }, [callback])
  useEventListener(document, 'visibilitychange', _callback)
  useEventListener(window, 'focus', _callback)
}

export function useFileTree (files) {
  function createNode () {
    return { folders: [], files: [], parent: null }
  }

  return useMemo(() => {
    const tree = { '/': createNode() }
    const folderAddedMap = {}
    for (const file of files) {
      const parts = file.relativePath.split('/')
      const filename = parts.pop()
      const dirName = parts.join('/')
      file.basename = filename
      let previousPath = ''
      for (const part of parts) {
        const currentPath = `${previousPath}/${part}`
        if (!tree[currentPath]) {
          tree[currentPath] = createNode()
        }
        const parent = !previousPath ? `/${previousPath}` : previousPath
        tree[currentPath].parent = parent
        const folderAddedKey = `${parent}-${currentPath}`
        if (!folderAddedMap[folderAddedKey]) {
          tree[parent].folders.push({ name: part, path: currentPath })
          folderAddedMap[folderAddedKey] = true
        }
        previousPath = currentPath
      }
      tree[`/${dirName}`].files.push(file)
    }
    return tree
  }, [files])
}

export function usePagination (items, itemsPerPage) {
  const [pageNo, setPageNo] = useState(1)
  const page = items.slice((pageNo - 1) * itemsPerPage, pageNo * itemsPerPage)
  const lastPageNo = Math.ceil(items.length / itemsPerPage)

  const isLast = pageNo === lastPageNo
  const hasPrevious = pageNo !== 1
  const hasNext = pageNo !== lastPageNo

  function nextPage () {
    setPageNo(x => x < lastPageNo ? x + 1 : x)
  }

  function previousPage () {
    setPageNo(x => x > 1 ? x - 1 : x)
  }

  function firstPage () {
    setPageNo(1)
  }

  function lastPage () {
    setPageNo(lastPageNo)
  }

  return {
    page,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    pageNo,
    setPageNo,
    lastPageNo,
    isLast,
    hasPrevious,
    hasNext
  }
}

export function useApiData (apiFn, defaultValue) {
  const [data, setData] = useState(defaultValue)

  useEffect(() => {
    (async () => {
      const response = await apiFn()
      setData(response || defaultValue)
    })()
  }, [apiFn, defaultValue])

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
