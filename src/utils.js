const crypto = require('crypto')

/*
 Common Utils
 =======================================================================================
*/
function sleepAsync (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
exports.retryOnError = function (fnAsync, times = 5) {
  return async (...args) => {
    for (let i = 0; ; i++) {
      try {
        return await fnAsync(...args)
      } catch (error) {
        if (i === times) throw error
        await sleepAsync(5000)
      }
    }
  }
}

exports.noop = function () {

}

const curry = exports.curry = function (func) {
  return function curried (...args) {
    if (args.length >= func.length) {
      return func.apply(this, args)
    } else {
      return function (...args2) {
        return curried.apply(this, args.concat(args2))
      }
    }
  }
}

exports.pipe = (...args) => {
  return (...firstArgs) => {
    let result = firstArgs
    args.forEach(fn => {
      result = [fn(...result)]
    })
    return result[0]
  }
}

/**
 * Runs a function at most once and cache the response.
 *
 * Subsequent executions just return the cached response
 */
exports.runOnce = (fnAsync) => {
  let hasRun = false
  let response
  return async () => {
    if (!hasRun) {
      response = await fnAsync()
      hasRun = true
    }
    return response
  }
}

exports.removeDuplicates = (arr) => {
  return Object.keys(arr.reduce((acu, curr) => ({ ...acu, [curr]: null }), {}))
}

exports.map = curry((fn, arr) => arr.map(fn))

exports.project = curry((props, list) =>
  list.map(x => props.reduce((prev, curr) => ({ ...prev, [curr]: x[curr] }), {})))

exports.identity = (value) => value

exports.prop = curry((name, obj) => {
  return obj[name]
})

exports.newId = function () {
  return crypto.randomBytes(16).toString('hex')
}

let currentIndex = 1
exports._resetNumberRange = () => {
  currentIndex = 1
}

exports.newIdNumber = () => {
  return currentIndex++
}

/*
List utilities
==================================================================================
*/

/**
 * Creates a lookup function for a list of items to check if exists.
 * @param {*} indexFn
 * @param {*} list
 * @returns
 */
const index = (indexFn, list) => {
  // Dont use spread because the list can be huge
  const map = list.reduce((prev, curr) => {
    prev[indexFn(curr)] = true
    return prev
  }, {})
  return (key) => !!map[key]
}

exports.index = index

/**
 * Creates a long running async iterator that receives updates via callbacks
 * @param {*} getNewItems function that returns new items to publish
 * @param {*} offNewItems function to set event callback to destroy
 */
const createAsyncIterator = exports.createAsyncIterator = (getNewItems, offNewItems) => {
  let _resolve
  const retrieveContext = {}

  function notify () {
    if (_resolve) {
      const items = getNewItems(retrieveContext)
      if (items.length) {
        _resolve({ value: items, done: false })
        _resolve = null
      }
    }
  }

  return {
    [Symbol.asyncIterator]: this,
    notify,
    async next () {
      const items = getNewItems(retrieveContext)
      if (items.length > 0) {
        return { value: items, done: false }
      } else {
        return await new Promise((resolve, reject) => {
          _resolve = resolve
        })
      }
    },
    return () {
      offNewItems(notify)
      return { done: true }
    }
  }
}

/**
 * Creates an async iterator from an event emitter.
 * Attaches to an event emitter.
 *
 * When an event is emitted, the emitted payload is either returned by the async iterator or
 * pass to a function that returns a list if items to return by the async iterator
 *
 * The iterator can start with an initial list of items to emit
 */
exports.createEmitterAsyncIterator = (emitter, eventNames, { getNewItems, initialItems } = {}) => {
  let pendingItems = initialItems || []

  const eventHandlers = []
  for (const name of eventNames) {
    const handler = (...args) => {
      eventHandler(name, ...args)
    }
    eventHandlers.push({ name, handler })
    emitter.on(name, handler)
  }

  function getPendingItems () {
    const newItems = pendingItems
    pendingItems = []
    return newItems
  }

  function dispose () {
    for (const { name, handler } of eventHandlers) {
      emitter.off(name, handler)
    }
  }

  function eventHandler (eventName, ...eventPayload) {
    if (getNewItems) {
      const newItems = getNewItems(eventName, ...eventPayload)
      pendingItems.push(...newItems)
    } else {
      const newItem = eventPayload[0]
      pendingItems.push(newItem)
    }

    pendingItems.length > 0 && iterator?.notify()
  }

  const iterator = createAsyncIterator(getPendingItems, dispose)

  return iterator
}

/**
 * Creates an async iterator from an event emitter.
 * The event emitter emits when new items are available and can be retrieved calling a callback function
 */
exports.createEmitterWithCallbackAsyncIterator = (emitter, eventName, getNewItems) => {
  emitter.on(eventName, handleNewItem)

  function dispose () {
    emitter.off(eventName, handleNewItem)
  }

  function handleNewItem () {
    iterator?.notify()
  }

  const iterator = createAsyncIterator(getNewItems, dispose)

  return iterator
}
