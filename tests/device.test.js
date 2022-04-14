const { isMetafile, isExistingDeviceAsync, isDeviceOnlineAsync, loadDeviceMetafileAsync, getDeviceIdForPathAsync, createSourceDeviceAsync } = require('../src/device')
const { assertNewMetafileCorrect } = require('./assertions')
const { setupTestEnvironment, createDevicesAsync, createContext } = require('./common')

describe('device tests', function () {
  const ctx = createContext()
  describe('environment tests', function () {
    const env = setupTestEnvironment()
    env.setupDb()
    beforeEach(async function () {
      const { backupDevice, sourceDevice } = await createDevicesAsync(env)
      ctx.append({ backupDevice, sourceDevice })
    })

    it('throws an error when creating device and path is invalid', function () {
      expect(createSourceDeviceAsync({ name: 'name', path: '' })).rejects.toMatchInlineSnapshot('[Error: Device path does not exist]')
    })

    it('throws an error when creating device and path already is an existing device', async function () {
      await env.createDummyFileAsync('123.usbb', 10)
      const promise = createSourceDeviceAsync({ name: 'name', path: env.tempPath })
      await expect(promise).rejects.toMatchInlineSnapshot('[Error: existingSource]')
    })

    it('persists source and meta file when creating a device', async function () {
      const source = await createSourceDeviceAsync({ name: 'name', path: env.tempPath })
      const metafile = await loadDeviceMetafileAsync(source)

      assertNewMetafileCorrect(source, metafile)
    })

    it('can determine if path is the root of a device path', async function () {
      expect(isExistingDeviceAsync(ctx.sourceDevice.path)).resolves.toBe(true)
      expect(isExistingDeviceAsync(process.cwd())).resolves.toBe(false)
    })

    it('can determine if device is online', async function () {
      expect(isDeviceOnlineAsync(ctx.sourceDevice)).resolves.toBe(true)
      expect(isDeviceOnlineAsync({ path: process.cwd(), id: '2a20e7d1a2cacc31be116a08e939bdca' })).resolves.toBe(false)
    })

    it('can load device metafile', async function () {
      const metafile = await loadDeviceMetafileAsync(ctx.sourceDevice)
      assertNewMetafileCorrect(ctx.sourceDevice, metafile)
    })

    it('can determine device id for path', async function () {
      const deviceId = await getDeviceIdForPathAsync(ctx.sourceDevice.path)

      expect(deviceId).toBe(ctx.sourceDevice.id)
    })

    it('returns null when path is not for device', async function () {
      const deviceId = await getDeviceIdForPathAsync(ctx.sourceDevice.path + 'gibberish')

      expect(deviceId).toBe(null)
    })
  })

  describe('stateless tests', function () {
    it('should determine if metafile', async function () {
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdca.usbb')).toBe(true)
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdc.usbb')).toBe(false)
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdc.usb')).toBe(false)
    })
  })
})
