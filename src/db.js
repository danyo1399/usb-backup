/*
this module contains generic database access functions and db migrations
for integrating with sqlite

 */
const sqlite3 = require('sqlite3')
const { defaultLogger } = require('./logging')
const fs = require('fs-extra')
const { appendRelativePath, ensureFilePathExistsAsync } = require('./path')

const defaultDbpath = appendRelativePath('data', 'app.db')

let db
let dbPath = defaultDbpath

const closeDb = exports.closeDbAsync = function () {
  return new Promise((resolve, reject) => {
    if (!db) {
      return resolve()
    }
    db.close((err) => {
      if (err) reject(err)
      else {
        hasActiveConnection = false
        db = null
        resolve()
      }
    })
  })
}

exports.deleteDbAsync = async function () {
  await closeDb()
  await fs.rm(dbPath, { force: true, recursive: true })
}

exports.setDbFilePath = function (filename) {
  dbPath = filename || defaultDbpath
}

exports.getDbFilePath = () => {
  return dbPath
}

let hasActiveConnection = false
exports.hasActiveConnection = () => hasActiveConnection

exports.openDbAsync = async function () {
  if (hasActiveConnection) return
  await ensureFilePathExistsAsync(dbPath)
  return await new Promise((resolve, reject) => {
    defaultLogger.info('Connecting to db at path', dbPath)
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err)
      } else {
        hasActiveConnection = true
        resolve()
      }
    })
  })
}

const runAsync = exports.runAsync = function (sql, ...args) {
  return new Promise(function (resolve, reject) {
    db.run(sql, ...args, function (err, result) {
      err ? reject(err) : resolve({ ...this })
    })
  })
}

exports.execAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.exec(sql, ...args, (err, res) => { err ? reject(err) : resolve(res) })
  })
}
exports.performInTransactionAsync = async function (fnAsync) {
  try {
    await runAsync('begin')
    await fnAsync()
    await runAsync('commit')
  } catch (error) {
    await runAsync('rollback')
    throw error
  }
}

exports.allAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.all(sql, ...args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

exports.getAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.get(sql, ...args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}
