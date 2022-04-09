const { _createDeviceInfoService } = require('../src/deviceInfo')
const { updateDeviceInfo, getDeviceByIdAsync } = require('../src/repo')
const testUtils = require('./common')
describe('Device info tests', function () {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()
  let deviceInfo

  beforeEach(async function () {
    deviceInfo = _createDeviceInfoService()
  })

  it('returns last saved device info when device offline', async function () {
    const device = await testUtils.createBackupDeviceAsync(env)
    const deviceInfoList = []
    await updateDeviceInfo(device.id, 123, 456, 'some new path')

    testUtils.convertIteratorToCallback(deviceInfo.iterator(), (device) => deviceInfoList.push(...device.value))
    await testUtils.sleep(1000)

    const updatedDevice = await getDeviceByIdAsync(device.id)
    expect(updatedDevice.path).toBe('some new path')
    expect(deviceInfoList).toMatchInlineSnapshot(`
Array [
  Object {
    "freeSpace": 123,
    "id": "${device.id}",
    "isOnline": false,
    "totalSpace": 456,
  },
]
`)
  })
  it('can enumerate device information', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)
    const deviceInfoList = []

    testUtils.convertIteratorToCallback(deviceInfo.iterator(), (device) => deviceInfoList.push(...device.value))
    await testUtils.sleep(1000)
    deviceInfoList.reverse()
    const source = deviceInfoList.find(x => x.id === sourceDevice.id)
    const backup = deviceInfoList.find(x => x.id === backupDevice.id)

    expect(source).toBeTruthy()
    expect(backup).toBeTruthy()

    expect(source.totalSpace).toBeGreaterThan(0)
    expect(source.freeSpace).toBeGreaterThan(0)
    expect(source.isOnline).toEqual(true)
    expect(backup.totalSpace).toBeGreaterThan(0)
    expect(backup.freeSpace).toBeGreaterThan(0)
    expect(backup.isOnline).toEqual(true)
  })

  it('should emit again when refresh called', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)
    const deviceInfoList = []

    testUtils.convertIteratorToCallback(deviceInfo.iterator(), (device) => deviceInfoList.push(...device.value))
    await testUtils.sleep(1000)
    await deviceInfo.refresh()


    expect(deviceInfoList.every(x => x.isOnline === true)).toBe(true)
    expect(deviceInfoList.every(x => x.id === backupDevice.id || x.id === sourceDevice.id)).toBe(true)
    expect(deviceInfoList.every(x => x.freeSpace > 0)).toBe(true)
    expect(deviceInfoList.every(x => x.totalSpace > 0)).toBe(true)
    expect(deviceInfoList).toHaveLength(4)
  })

  it('stops emitting new values after return called', async function () {
    await testUtils.createDevicesAsync(env)
    const deviceInfoList = []
    const iterator = deviceInfo.iterator()
    testUtils.convertIteratorToCallback(iterator, (device) => deviceInfoList.push(device))
    await testUtils.sleep(1000)
    const returnValue = await iterator.return()
    await deviceInfo.refresh()
    await testUtils.sleep(1000)

    expect(deviceInfoList).toHaveLength(2)
    expect(returnValue.done).toBe(true)
  })
})
