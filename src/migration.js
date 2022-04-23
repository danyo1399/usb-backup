const { execAsync, performInTransactionAsync, runAsync, openDbAsync, closeDbAsync, getDbFilePath, getAsync, hasActiveConnection } = require('./db')
const fs = require('fs-extra')
const { defaultLogger } = require('./logging')

let migrations = [
  async function migration000 () {
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
  },
  async function migration001 () {
    await execAsync(`
    create index idx_files_relativePath_mtimeMs on files(relativePath, mtimeMs)
  `)
  },
  async function migration002 () {
    await execAsync(`
    create table files_dg_tmp
(
    id           INTEGER
        primary key autoincrement,
    deviceId     TEXT,
    deviceType   TEXT,
    relativePath TEXT,
    mtimeMs      INTEGER,
    birthtimeMs  INTEGER,
    size         INTEGER,
    hash         TEXT,
    deleted      INTEGER,
    addDate      INTEGER not null,
    editDate     INTEGER not null
);

insert into files_dg_tmp(deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate,
                         editDate)
select
       deviceId,
       deviceType,
       relativePath,
       mtimeMs,
       birthtimeMs,
       size,
       hash,
       deleted,
       addDate,
       editDate
from files;

drop table files;

alter table files_dg_tmp
    rename to files;

create index idx_files_hash
    on files (hash);

create index idx_files_relativePath_mtimeMs
    on files (relativePath, mtimeMs);


    `)
  },
  async function migration003 () {
    await execAsync(`
    alter table devices add freeSpace INTEGER;
    alter table devices add totalSpace INTEGER;
    `)
  },
  async function migration004 () {
    await execAsync(`
    alter table devices add orphanSize INTEGER;
    alter table devices add usedSize INTEGER;
    `)
  }
]

exports.addDbMigration = (fnAsync) => {
  migrations.push(fnAsync)
}

exports.removeMigration = (fnAsync) => {
  migrations = migrations.filter(x => x !== fnAsync)
}

const getCurrentVersionAsync = exports.getCurrentVersionAsync = async function () {
  await ensureVersionsTableExistsAsync()
  const { lastVersion } = await getAsync('select max(version) as lastVersion from versions')
  return lastVersion == null ? -1 : lastVersion
}

exports.getRequiredDbVersion = () => migrations.length - 1

const ensureVersionsTableExistsAsync = exports.ensureVersionsTableExistsAsync = async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS versions (
        version INTEGER PRIMARY KEY,
        addDate INTEGER NOT NULL
    )
    `)
}

/**
 * Run pending db migrations upto the max version
 *
 * @param {number} maxVersion the max db version to migrate to
 */
exports.migrateDbAsync = async (maxVersion = Number.MAX_SAFE_INTEGER) => {
  const closeDb = hasActiveConnection() === false
  try {
    await openDbAsync()
    await ensureVersionsTableExistsAsync()

    const currentVersion = await getCurrentVersionAsync()
    const nextVersion = currentVersion + 1
    const hasMigrations = nextVersion < migrations.length && (nextVersion <= maxVersion)

    if (hasMigrations && currentVersion >= 0) {
      await backupDb(currentVersion)
    }
    for (let version = nextVersion; version < migrations.length && version <= maxVersion; version++) {
      defaultLogger.info(`Migrating db to version ${version}`)
      await performInTransactionAsync(async () => {
        await migrations[version]()
        await runAsync('insert into versions values(?,?)', version, Date.now())
      })
    }
  } finally {
    try { closeDb && await closeDbAsync() } catch { }
  }
}

function getDbBackupFilename (version) {
  const dbFilename = getDbFilePath()
  return `${dbFilename}.backup-${version}`
}

exports.restoreDbBackup = async (version) => {
  const openDb = hasActiveConnection() === false
  const dbFilename = getDbFilePath()
  const backupFilename = getDbBackupFilename(version)
  const backupExists = await fs.pathExists(backupFilename)
  if (!backupExists) throw new Error('backup does not exist:' + backupFilename)
  if (openDb) await closeDbAsync()
  await fs.copyFile(backupFilename, dbFilename)
  if (openDb) await openDbAsync()
}

async function backupDb (currentVersion) {
  const dbFilename = getDbFilePath()
  if (await fs.pathExists(dbFilename)) {
    await closeDbAsync()
    const backupFilename = getDbBackupFilename(currentVersion)
    defaultLogger.info(`Backing up db from ${dbFilename} to ${backupFilename}`)
    await fs.copyFile(dbFilename, backupFilename)
    await openDbAsync()
  }
}
