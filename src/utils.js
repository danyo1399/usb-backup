const crypto = require('crypto')

/*
 Common Utils
 =======================================================================================
*/

exports.pipe = (...args) => {
  return (...firstArgs) => {
    let result = firstArgs
    args.forEach(fn => {
      result = [fn(...result)]
    })
    return result[0]
  }
}

exports.project = (props, list) =>
  list.map(x => props.reduce((prev, curr) => ({ ...prev, [curr]: x[curr] }), {}))

exports.identity = (value) => value

exports.prop = name => {
  return (obj) => obj[name]
}

exports.curry = function (func) {
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
 * Creates a lookup function to check if exists.
 * @param {*} indexFn
 * @param {*} list
 * @returns
 */
const index = (indexFn, list) => {
  const map = list.reduce((prev, curr) => ({ ...prev, [indexFn(curr)]: true }), {})
  return (key) => !!map[key]
}
exports.index = index

exports.createAsyncIterator = (getNewItems, onNewItems, offNewItems) => {
  let _resolve
  const retrieveContext = {}

  function handleNewItems () {
    if (_resolve) {
      const items = getNewItems(retrieveContext)
      if (items.length) {
        _resolve({ value: items, done: false })
        _resolve = null
      }
    }
  }

  onNewItems(handleNewItems)

  return {
    [Symbol.asyncIterator]: this,
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
      offNewItems(handleNewItems)
      return { done: true }
    }
  }
}

/*
 Backup File Utils
=======================================================================================
*/

const createFileId = exports.createFileId = function ({ deviceId, relativePath, stat: { mtimeMs, birthtimeMs, size } }) {
  return JSON.stringify([deviceId, relativePath, Math.floor(mtimeMs), size, Math.floor(birthtimeMs)])
}

exports.createFile = ({ deviceType, deviceId, relativePath, hash, stat: { mtimeMs, birthtimeMs, size } }) => {
  mtimeMs = Math.floor(mtimeMs)
  birthtimeMs = Math.floor(birthtimeMs)
  const id = createFileId({ deviceId, relativePath, stat: { mtimeMs, birthtimeMs, size } })
  const deleted = false
  const addDate = Date.now()

  return {
    id,
    deviceType,
    deviceId,
    relativePath,
    mtimeMs,
    birthtimeMs,
    size,
    hash,
    deleted,
    addDate
  }
}
