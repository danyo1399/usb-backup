/*
this module contains the database queries for the application

 */
const db = require('./db')
const { isIgnoredFile } = require('./path')

/*
Reports
==================================================================================
*/

exports.reportFilesOnBackupWithNoSourceAsync = async () => {
  const files = await db.allAsync(`
  select
    d.name deviceName, d.path devicePath, b.*
  from
    files b inner join devices d on b.deviceId = d.id
  where b.deviceType = 'backup'
    and b.deleted = 0
    and not exists(
      select 1 from files s
      where s.deleted = 0 and s.deviceType ='source'
      and s.hash = b.hash
    )
  order by
      b.addDate desc
  `)
  return files.filter(x => isIgnoredFile(x.relativePath) === false)
}

exports.reportFilesOnSourceWithNoBackupAsync = async () => {
  const files = await db.allAsync(`
  select
    d.name deviceName, d.path devicePath, s.*
  from
    files s inner join devices d on s.deviceId = d.id
  where s.deviceType = 'source'
    and s.deleted = 0
    and not exists(
        select 1 from files b
        where b.deleted = 0 and b.deviceType ='backup'
        and s.hash = b.hash
    )
  order by
    s.addDate desc
  `)
  return files.filter(x => isIgnoredFile(x.relativePath) === false)
}

exports.reportDuplicateFilesOnDeviceTypeAsync = async (deviceType) => {
  return await db.allAsync(`
  select
    d.name deviceName, d.path devicePath, b.*
  from
    files b inner join devices d on b.deviceId = d.id
  where b.deviceType = $deviceType
    and b.deleted = 0
  and exists(
      select 1 from files b2
      where b2.deleted = 0 and b2.deviceType = $deviceType
      and b2.hash = b.hash
      and b2.id != b.id
      )
    order by b.hash
  `, { $deviceType: deviceType })
}

/*
devices
======================================================================================
*/

// Updates device from device info device query
exports.updateDeviceInfo = async (id, freeSpace, totalSpace, path) => {
  await db.runAsync(`
  update devices set freeSpace = ?, totalSpace = ?, path = ?
  where id = ?
  `, freeSpace, totalSpace, path, id)
}

exports.addDeviceAsync = async function ({ deviceType, id, name, description, path }) {
  const lastScanDate = 0
  const lastBackupDate = 0
  const addDate = Date.now()
  await db.runAsync(
        `insert into devices(
        deviceType, id, name, description, path,lastScanDate, lastBackupDate, addDate)
        values(?,?,?,?,?,?,?,?)`,
        deviceType,
        id,
        name,
        description,
        path,
        lastScanDate,
        lastBackupDate,
        addDate
  )
  return { deviceType, id, name, description, path, lastScanDate, lastBackupDate, addDate }
}

exports.updateLastBackupDate = async (id, lastBackupDate) => {
  await db.runAsync('update devices set lastBackupDate = ? where id = ?', lastBackupDate, id)
}

exports.deleteDeviceAsync = async function (id) {
  await db.performInTransactionAsync(async () => {
    await db.runAsync('delete from files where deviceId=?', id)
    await db.runAsync('delete from devices where id = ?', id)
  })
}

exports.getDevicesAsync = async function (deviceType) {
  return await db.allAsync('select * from devices where deviceType = ?', deviceType)
}

exports.getAllDevicesAsync = async function () {
  return await db.allAsync('select * from devices')
}

exports.getDeviceByIdAsync = async function (id) {
  return await db.getAsync(`
        select *
        from
            devices
        where
            id = ?
        `, id)
}

exports.updateDeviceAsync = async function ({ id, name, description, path }) {
  await db.runAsync(`
    update
      devices
        set name=?, description = ?, path = ?
        where id = ?
    `, name, description, path, id)
}

exports.updateDeviceScanDateAsync = async function (id) {
  await db.runAsync(`
    update
      devices
      set lastScanDate = ?
      where id = ?
    `, Date.now(), id)
}

/*
Files
=====================================================================================================
*/

/**
 * Returns a list of files that have not been backed up to a backup device.
 * @param {string} sourceDeviceId
 * @returns files that have not been backed up
 */
exports.getSourceFilesToBackupAsync = async (sourceDeviceId) => {
  return await db.allAsync(`
    select s.*
    from files s
    where
      not exists( select 1 from files b where b.hash = s.hash and b.deleted = 0 and b.deviceType = 'backup')
      and s.deviceId = ?
      and s.deviceType = 'source'
      and s.deleted = 0
  `, sourceDeviceId)
}

exports.deleteFileAsync = async function (id) {
  await db.runAsync(`
        update files set
        deleted = 1, editDate = ?
        where id= ?
    `, Date.now(), id)
}

exports.deleteFileHardAsync = async function (id) {
  await db.runAsync(`
        delete from files where id = ?
    `, id)
}

exports.InsertFileAsync = async function ({
  deviceType,
  deviceId,
  relativePath,
  mtimeMs,
  birthtimeMs,
  size,
  hash,
  addDate
}) {
  const editDate = Date.now()
  const deleted = false
  let insertResult
  await db.performInTransactionAsync(async () => {
    await db.runAsync(`
      update files
      set deleted = 1, editDate = ?
      where deviceId = ? and relativePath = ?
    `,
    editDate, deviceId, relativePath)

    insertResult = await db.runAsync(`
      insert into files(deviceType, deviceId, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate)
      values(?,?,?,?,?,?,?,?,?,?);
`,
    deviceType,
    deviceId,
    relativePath,
    mtimeMs,
    birthtimeMs,
    size,
    hash,
    deleted,
    addDate,
    editDate
    )
  })

  return {
    id: insertResult.lastID,
    deviceType,
    deviceId,
    relativePath,
    mtimeMs,
    birthtimeMs,
    size,
    hash,
    deleted,
    addDate,
    editDate
  }
}

exports.getFileByDeviceRelativePathAsync = async function (deviceId, relativePath) {
  return await db.getAsync(`
    select *
    from
      files
    where
      deviceId = ? and relativePath = ? and deleted = 0
  `, deviceId, relativePath)
}

exports.getFileByFingerprintAsync = async function (deviceId, relativePath, { mtimeMs, birthtimeMs, size }) {
  return await db.getAsync(`
    select
      *
    from
      files
    where
      deviceId = ?
      and relativePath = ?
      and mtimeMs = ?
      and birthtimeMs = ?
      and size = ?
      and deleted = 0
      `,
  deviceId, relativePath, Math.floor(mtimeMs), Math.floor(birthtimeMs), size
  )
}

exports.findSimilarFilesAsync = async function (deviceId, size, filenameWithoutDir, birthtimeMs, mtimeMs) {
  return await db.allAsync(`
    select
      *
    from
      files
    where
      deviceId = $deviceId
      and (relativePath = $filename or relativePath like $likeFilename)
      and birthtimeMs = $birthtimeMs
      and mtimeMs = $mtimeMs
      and size = $size
      and deleted = 0
  `, {
    $size: size,
    $deviceId: deviceId,
    $birthtimeMs: Math.floor(birthtimeMs),
    $mtimeMs: Math.floor(mtimeMs),
    $filename: filenameWithoutDir,
    $likeFilename: `%/${filenameWithoutDir}`
  })
}

exports.getFileByIdAsync = async function (id, { includeDeleted } = {}) {
  const result = await db.getAsync(`
  select * from files where id = ? and (deleted = 0 or 1 = ?)
  `, id, !!includeDeleted
  )
  return result
}

exports.getFilesByDeviceAsync = async (id, { includeDeleted } = {}) => {
  return await db.allAsync('select * from files where deviceId = ? and (deleted = 0 or 1 = ?)', id, !!includeDeleted)
}

exports.getFileByDeviceAndHashAsync = (deviceId, hash) => {
  return db.getAsync(`
    select *
    from
      files
    where
      deviceId = ? and hash = ? and deleted = 0
  `, deviceId, hash)
}

exports.findFilesByPathAsync = async (deviceId, path) => {
  return await db.allAsync(`
    select *
    from files
    where
      deviceId = $deviceId
      and relativePath like $path
      and deleted = 0
     `, { $deviceId: deviceId, $path: path + '%' })
}

exports.getFileIdsByDeviceAsync = async (id) => {
  const results = await db.allAsync('select id from files where deviceId = ? and deleted = 0', id)
  return results.map(x => x.id)
}

exports.getAllBackupFilesAsync = async function () {
  return await db.allAsync("select * from files where deviceType = 'backup'")
}

exports.getFilesByHashAndDeviceTypeAsync = async (hash, deviceType) => {
  return await db.allAsync(`
    select
      d.name deviceName, f.*
    from
      files f inner join devices d on f.deviceId = d.id
    where
      f.hash = ? and f.deviceType = ? and f.deleted = 0
  `, hash, deviceType)
}
