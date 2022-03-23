const { deviceInfo } = require('../src/deviceInfo')
const testUtils = require('./common')
describe('Device info tests', function () {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {

  })

  it('can enumerate device information', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)
    const deviceInfoList = []

    testUtils.convertIteratorToCallback(deviceInfo.iterator(), (device) => deviceInfoList.push(device))
    await testUtils.sleep(1000)

    const source = deviceInfoList.map(x => x.value[0]).find(x => x.id === sourceDevice.id)
    const backup = deviceInfoList.map(x => x.value[0]).find(x => x.id === backupDevice.id)

    expect(source).not.toBeNull()
    expect(backup).not.toBeNull()

    expect(source.totalSpace).toBeGreaterThan(0)
    expect(source.freeSpace).toBeGreaterThan(0)
    expect(source.isOnline).toEqual(true)
    expect(backup.totalSpace).toBeGreaterThan(0)
    expect(backup.freeSpace).toBeGreaterThan(0)
    expect(backup.isOnline).toEqual(true)
  })

  it('continues iterating new values after initial refresh', async function() {
    await testUtils.createDevicesAsync(env)
    const deviceInfoList = []

    testUtils.convertIteratorToCallback(deviceInfo.iterator(), (device) => deviceInfoList.push(device))
    await testUtils.sleep(1000)
    await deviceInfo.refresh()

    expect(deviceInfoList).toHaveLength(4)
  })
})
