const { isMetafile, isExistingDeviceAsync, isDeviceOnlineAsync, loadDeviceMetafileAsync } = require('../src/device')
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
  })

  describe('stateless tests', function () {
    it('should determine if metafile', async function () {
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdca.usbb')).toBe(true)
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdc.usbb')).toBe(false)
      expect(isMetafile('2a20e7d1a2cacc31be116a08e939bdc.usb')).toBe(false)
    })
  })
})