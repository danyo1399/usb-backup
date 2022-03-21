const app = require('../src/app')
const testUtils = require('./common')

describe('app tests', () => {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  it('throws an error when path is invalid', function () {
    expect(app.createSourceDeviceAsync({ name: 'name', path: '' })).rejects.toMatchInlineSnapshot('[Error: Device path does not exist]')
  })

  it('throws an error when path already is a source device', async function () {
    await env.createDummyFile('123.usbb', 10)
    const promise = app.createSourceDeviceAsync({ name: 'name', path: env.tempPath })
    await expect(promise).rejects.toMatchInlineSnapshot('[Error: existingSource]')
  })

  it('creates source and meta file', async function () {
    await app.createSourceDeviceAsync({ name: 'name', path: env.tempPath })
  })
})
