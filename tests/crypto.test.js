const testUtils = require('./common')
const path = require('path')
const { hashFileAsync, copyAndHashAsync } = require('../src/crypto')
const fs = require('fs-extra')

describe('crypto tests', () => {
  describe('env required tests', function () {
    const env = testUtils.setupTestEnvironment()

    // Saw a sparatic issue copying small file onto network drive getting file does not exist error when
    // trying to update file after it was copied to a network device.
    it('finishes writing file before resolving promise', async function () {
      const srcFile = path.resolve(env.tempPath, 'testfile')
      const destFile = path.resolve(env.tempPath, 'testfile.out')
      await env.createDummyFileAsync('testfile', 5) // 10mb
      await copyAndHashAsync(srcFile, destFile)
      await fs.rm(destFile)
    })

    it('can copy and hash file', async function () {
      const srcFile = path.resolve(env.tempPath, 'testfile')
      const destFile = path.resolve(env.tempPath, 'testfile.out')
      await env.createDummyFileAsync('testfile', 1024 * 1024 * 10) // 10mb
      const copyHash = await copyAndHashAsync(srcFile, destFile)

      const srcHash = await hashFileAsync(srcFile)
      const destHash = await hashFileAsync(destFile)

      expect(copyHash).toEqual(srcHash)
      expect(copyHash).toEqual(destHash)
    })
  })

  describe('non env required tests', function () {
    it('should compute hash', async () => {
      const hash = await hashFileAsync('./testdata/testimg.png')
      expect(hash).toBe('db3942ae6e0c65fee0fddb07df50d662')
    })
  })
})
