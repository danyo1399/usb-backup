const fs = require('fs-extra')
const path = require('path')
const testUtils = require('../common')
const { createBackupDevicesJobAsync } = require('../../src/jobs/backupDeviceJob')
const jobManager = require('../../src/jobs/jobManager')
const { allAsync } = require('../../src/db')
const { project } = require('../../src/utils')
const { createRestoreBackupFilesToSourceRequest, _getTargetPath } = require('../../src/jobs/restoreBackupFilesToSourceRequest')
const { writeDeviceMetaFileAsync } = require('../../src/device')

describe('copy files from backup device job tests', function () {
  describe('stateless tests', function () {
    describe('get target path tests', function () {
      it('generates destination for file path', async function () {
        expect(_getTargetPath('/test.txt', 'test.txt', '/', 'c:/test')).toBe('c:/test/test.txt')
        expect(_getTargetPath('/folder/test.txt', 'folder/test.txt', '/', 'c:/test')).toBe('c:/test/test.txt')
        expect(_getTargetPath('/folder/test.txt', 'folder/test.txt', '/test', 'c:/')).toBe('c:/test/test.txt')
        expect(_getTargetPath('/folder/test.txt', 'folder/test.txt', '/test/', 'c:/')).toBe('c:/test/test.txt')
        expect(_getTargetPath('\\folder\\test.txt', 'folder\\test.txt', '\\test', 'c:\\')).toBe('c:/test/test.txt')
        expect(_getTargetPath('\\folder\\test.txt', 'folder\\test.txt', '\\test\\', 'c:\\')).toBe('c:/test/test.txt')
        expect(_getTargetPath('\\folder\\test.txt', 'folder\\test.txt', 'test', 'c:\\')).toBe('c:/test/test.txt')

        expect(_getTargetPath('\\folder\\test.txt', 'folder\\test.txt', '\\', '\\\\server\\folder')).toBe('//server/folder/test.txt')
      })

      it('generates destination path for folder path', async function () {
        expect(_getTargetPath('/f1/', 'f1/test.txt', '/', 'c:/devicefolder')).toBe('c:/devicefolder/f1/test.txt')
        expect(_getTargetPath('\\f1\\', 'f1\\test.txt', '\\', 'c:\\devicefolder')).toBe('c:/devicefolder/f1/test.txt')
        expect(_getTargetPath('/f1/f2/', 'f1/f2/f3/test.txt', '/out', 'c:/devicefolder'))
          .toBe('c:/devicefolder/out/f2/f3/test.txt')

        expect(_getTargetPath('/f1/f2/', 'f1/f2/f3/test.txt', '/out/', 'c:/devicefolder'))
          .toBe('c:/devicefolder/out/f2/f3/test.txt')

        expect(_getTargetPath('\\f1\\f2\\', 'f1\\f2\\f3\\test.txt', '\\out', 'c:\\devicefolder'))
          .toBe('c:/devicefolder/out/f2/f3/test.txt')
      })
    })
  })

  describe('environment tests', function () {
    const ctx = testUtils.createContext()
    const env = testUtils.setupTestEnvironment()
    env.setupDb()

    beforeEach(async function () {
      const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env, '8f4929d058d3f3bfde84945ccff36977', '8f4929d058d3f3bfde84945ccff36978')
      const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
      ctx.append({ backupDevice, sourceDevice, job })
    })

    it('can copy whole folders', async function () {
      await env.createDummyFileAsync('backup/dummyfolder/testfile', 1024)
      await env.createDummyFileAsync('backup/dummyfolder/testfile2', 512)

      await testUtils.clearDirAsync(ctx.sourceDevice.path)
      await writeDeviceMetaFileAsync(ctx.sourceDevice)

      await testUtils.scanDeviceAsync(ctx.backupDevice.id, ctx.sourceDevice.id)
      const job = await createRestoreBackupFilesToSourceRequest(ctx.backupDevice.id, ctx.sourceDevice.id, '', ['dummyfolder/'])
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const dbFiles = await allAsync(`
    select * from files where deviceId = ?`, ctx.sourceDevice.id)
      const files = await fs.readdir(path.join(ctx.sourceDevice.path, 'dummyfolder'))

      expect(dbFiles.map((x) => x.relativePath)).toMatchInlineSnapshot(`
Array [
  "dummyfolder/testfile2",
  "dummyfolder/testfile",
]
`)
      expect(files).toMatchInlineSnapshot(`
Array [
  "testfile",
  "testfile2",
]
`)
    })

    it('can copy whole nested folders', async function () {
      await env.createDummyFileAsync('backup/f1/f2/testfile', 1024)
      await env.createDummyFileAsync('backup/f1/f2/testfile2', 512)

      await testUtils.clearDirAsync(ctx.sourceDevice.path)
      await writeDeviceMetaFileAsync(ctx.sourceDevice)

      await testUtils.scanDeviceAsync(ctx.backupDevice.id, ctx.sourceDevice.id)
      const job = await createRestoreBackupFilesToSourceRequest(ctx.backupDevice.id, ctx.sourceDevice.id, '/out', ['f1/f2/'])
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const dbFiles = await allAsync(`
    select * from files where deviceId = ?`, ctx.sourceDevice.id)
      const files = await fs.readdir(path.join(ctx.sourceDevice.path, 'out/f2'))

      expect(dbFiles.map((x) => x.relativePath)).toMatchInlineSnapshot(`
Array [
  "out/f2/testfile2",
  "out/f2/testfile",
]
`)
      expect(files).toMatchInlineSnapshot(`
Array [
  "testfile",
  "testfile2",
]
`)
    })

    it('can copy files from backup to source', async function () {
      await env.createDummyFileAsync('backup/dummyfolder/testfile', 1024)
      await testUtils.scanDeviceAsync(ctx.backupDevice.id)
      const job = await createRestoreBackupFilesToSourceRequest(ctx.backupDevice.id, ctx.sourceDevice.id, 'copied-files/somewhere', ['dummyfolder/testfile'])
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const dbFiles = await allAsync(`
    select * from files where relativePath like 'copied-files%'`)
      const files = await fs.readdir(path.join(ctx.sourceDevice.path, 'copied-files/somewhere'))

      expect(project(['deleted', 'deviceType', 'size', 'relativePath', 'id'], dbFiles)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 0,
    "deviceType": "source",
    "id": 2,
    "relativePath": "copied-files/somewhere/testfile",
    "size": 1024,
  },
]
`)
      expect(files).toMatchInlineSnapshot(`
Array [
  "testfile",
]
`)
    })
  })
})
