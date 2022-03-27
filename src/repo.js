/*
this module contains the database queries for the application

 */
const db = require('./db')

/*
Common
==================================================================================
*/

/**
 * Returns a list of files that have not been backed up to a backup device.
 * @param {string} sourceDeviceId
 * @returns files that have not been backed up
 */
exports.getSourceFilesToBackupAsync = async (sourceDeviceId) => {
  return await db.allAsync(`
    select s.*
    from files s left join files b on
        s.hash = b.hash
        and b.deleted = 0
        and b.deviceType = 'backup'
    where
      b.id is null and s.deviceId = ?
      and s.deviceType = 'source'

  `, sourceDeviceId)
}

/*
Source devices
======================================================================================
*/
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
            id = ?`
  , id)
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

exports.deleteFileAsync = async function (id) {
  await db.runAsync(
        `
        update files set
        deleted = 1, editDate = ?
        where id= ?
    `, Date.now(), id)
}

exports.deleteFileHardAsync = async function (id) {
  await db.runAsync(
        `
        delete from files where id = ?
    `, id)
}

exports.getFileExistsAsync = async function (id) {
  return !!(
    await db.getAsync(
            `
  select case
    when exists(select * from files where id = ?) then 1 else 0 end fileExists`,
            id
    )
  ).fileExists
}

exports.findSimilarFilesAsync = async function (deviceId, size, filenameWithoutDir, birthtimeMs, mtimeMs) {
  return await db.allAsync(`
    select *
    from files
     where
       deviceId = $deviceId
      and (relativePath = $filename or relativePath like $likeFilename)
      and birthtimeMs = $birthtimeMs
      and mtimeMs = $mtimeMs
      and size = $size
  `, {
    $size: size,
    $deviceId: deviceId,
    $birthtimeMs: Math.floor(birthtimeMs),
    $mtimeMs: Math.floor(mtimeMs),
    $filename: filenameWithoutDir,
    $likeFilename: `%/${filenameWithoutDir}`
  })
}

exports.addFileAsync = async function ({
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
}) {
  await db.runAsync(
        `
  insert into files(id, deviceType, deviceId, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate)
  values(?,?,?,?,?,?,?,?,?,?,?)
  `,
        id,
        deviceType,
        deviceId,
        relativePath,
        mtimeMs,
        birthtimeMs,
        size,
        hash,
        deleted,
        addDate,
        Date.now()
  )
}

exports.unDeleteFileAsyc = async function (id) {
  await db.runAsync(`
    update files set
    deleted = 0,
    editDate = ?
    where id= ?
  `, Date.now(), id)
}

exports.getFileByIdAsync = async function (id) {
  const result = await db.getAsync(
        `
  select * from files where id = ?
  `, id
  )
  if (result) {
    result.deleted = !!result.deleted
  }
  return result
}

exports.getFilesByDeviceAsync = async (id, { includeDeleted } = {}) => {
  return await db.allAsync('select * from files where deviceId = ? and (deleted = 0 or 1 = ?)', id, !!includeDeleted)
}

exports.getFileIdsByDeviceAsync = async (id) => {
  const results = await db.allAsync('select id from files where deviceId = ? and deleted = 0', id)
  return results.map(x => x.id)
}

/*
Backup Files
=====================================================================================================
*/

exports.getAllBackupFilesAsync = async function () {
  return await db.allAsync("select * from files where deviceType = 'backup'")
}
