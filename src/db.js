/*
this module contains generic database access utils and db migrations
for integrating with sqlite
 */
const sqlite3 = require('sqlite3')
const { defaultLogger } = require('./logging')
const fs = require('fs-extra')
const { appendRelativePath, ensureFilePathExistsAsync } = require('./path')

const migrations = [
  async () => {
    await execAsync(`
    CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        deviceType TEXT,
        name TEXT,
        description TEXT,
        path TEXT,
        lastScanDate INTEGER,
        lastBackupDate INTEGER,
        addDate INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
        id text PRIMARY KEY,
        deviceId TEXT,
        deviceType TEXT,
        relativePath TEXT,
        mtimeMs INTEGER,
        birthtimeMs INTEGER,
        size INTEGER,
        hash TEXT,
        deleted INTEGER,
        addDate INTEGER NOT NULL,
        editDate INTEGER NOT NULL
    );

    create index idx_files_hash on files(hash);
    `)
  }
]
const defaultDbpath = appendRelativePath('data', 'app.db')

let db
let dbPath = defaultDbpath

const closeAsync = exports.closeAsync = function () {
  return new Promise((resolve, reject) => {
    if (!db) {
      return resolve()
    }
    db.close((err) => {
      if (err) reject(err)
      else {
        db = null
        resolve()
      }
    })
  })
}

exports.deleteDbAsync = async function () {
  await closeAsync()
  await fs.rm(dbPath, { force: true, recursive: true })
}

exports.setDbFilename = function (filename) {
  dbPath = filename || defaultDbpath
}

exports.openDbAsync = async function () {
  await ensureFilePathExistsAsync(dbPath)
  return await new Promise((resolve, reject) => {
    defaultLogger.info('Connecting to db at path', dbPath)
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  }).then(async () => {
    await migrateAsync()
  })
}

const runAsync = exports.runAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.run(sql, ...args, (err, res) => {
      err ? reject(err) : resolve(res)
    })
  })
}

const execAsync = exports.execAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.exec(sql, ...args, (err, res) => { err ? reject(err) : resolve(res) })
  })
}

const performInTransactionAsync = exports.performInTransactionAsync = async function (fn) {
  try {
    await runAsync('begin')
    await fn()
    await runAsync('commit')
  } catch (error) {
    await runAsync('rollback')
    throw error
  }
}

async function migrateAsync () {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS versions (
        version INTEGER PRIMARY KEY,
        addDate INTEGER NOT NULL
    )
    `)

  const version = await nextVersionAsync()
  for (let i = version; i < migrations.length; i++) {
    await performInTransactionAsync(async () => {
      await migrations[i]()
    })

    await runAsync('insert into versions values(?,?)', i, Date.now())
  }
}

exports.allAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.all(sql, args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

const getAsync = exports.getAsync = function (sql, ...args) {
  return new Promise((resolve, reject) => {
    db.get(sql, args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

const nextVersionAsync = exports.nextVersionAsync = async function () {
  const { lastVersion } = await getAsync('select max(version) as lastVersion from versions')
  return lastVersion == null ? 0 : lastVersion + 1
}
