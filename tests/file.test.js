const { hashFileAsync } = require('../src/crypto')
const { createFileAsync, copyFileAsync } = require('../src/file')
const { getFilesByDeviceAsync } = require('../src/repo')
const { setupTestEnvironment, createDevicesAsync, createContext } = require('./common')
const fs = require('fs-extra')

describe('file tests', function () {
  const ctx = createContext()
  describe('Environment tests', function () {
    const env = setupTestEnvironment()
    env.setupDb()
    beforeEach(async function () {
      const { backupDevice, sourceDevice } = await createDevicesAsync(env)
      ctx.append({ backupDevice, sourceDevice })
    })

    describe('copy file tests', function () {
      it('can copy file', async function () {
        const filePath = await env.createDummyFileAsync('test.txt', 1024)
        const copyPath = filePath + '.copy'
        await copyFileAsync(filePath, copyPath)
        const originalHash = await hashFileAsync(filePath)
        const copyHash = await hashFileAsync(copyPath)
        expect(originalHash).toEqual(copyHash)
      })

      it('throws an error if the file exists', async function () {
        const filePath = await env.createDummyFileAsync('test.txt', 1024)
        const copyPath = filePath + '.copy'
        await copyFileAsync(filePath, copyPath)

        await expect(copyFileAsync(filePath, copyPath)).rejects.toBeTruthy()
      })

      it('copies file to new path when file exists', async function () {
        const filePath = await env.createDummyFileAsync('test.txt', 1024)

        await copyFileAsync(filePath, filePath, { appendSuffix: true })

        const files = await fs.readdir(env.tempPath)

        expect(files).toContain('test.txt')
        expect(files).toContain('test 001.txt')
      })
    })

    describe('Create file tests', function () {
      it('Creates file record with correct hash and file metadata', async function () {
        const filePath = await env.createDummyFileAsync('backup/testfile', 1024)
        const hash = await hashFileAsync(filePath)
        const { file } = await createFileAsync(ctx.backupDevice, filePath)
        const files = await getFilesByDeviceAsync(ctx.backupDevice.id)

        expect(file).toMatchInlineSnapshot({
          addDate: expect.any(Number),
          birthtimeMs: expect.any(Number),
          mtimeMs: expect.any(Number),
          editDate: expect.any(Number)
        }, `
Object {
  "addDate": Any<Number>,
  "birthtimeMs": Any<Number>,
  "deleted": false,
  "deviceId": "${ctx.backupDevice.id}",
  "deviceType": "backup",
  "editDate": Any<Number>,
  "hash": "${hash}",
  "id": 1,
  "mtimeMs": Any<Number>,
  "relativePath": "testfile",
  "size": 1024,
}
`)

        expect(files).toMatchInlineSnapshot([{
          addDate: expect.any(Number),
          birthtimeMs: expect.any(Number),
          mtimeMs: expect.any(Number),
          editDate: expect.any(Number)
        }], `
Array [
  Object {
    "addDate": Any<Number>,
    "birthtimeMs": Any<Number>,
    "deleted": 0,
    "deviceId": "${ctx.backupDevice.id}",
    "deviceType": "backup",
    "editDate": Any<Number>,
    "hash": "${hash}",
    "id": 1,
    "mtimeMs": Any<Number>,
    "relativePath": "testfile",
    "size": 1024,
  },
]
`)
      })
    })
  })
})
