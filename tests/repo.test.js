const { project } = require('../src/utils')
const repo = require('../src/repo')
const { setupTestEnvironment } = require('./common')

describe('repo tests', () => {
  const env = setupTestEnvironment()
  env.setupDb()

  it('can get source device by id', async function () {
    const source = await createSourceDeviceAsync()
    expect(source.path).toEqual('c:/test')
  })

  it('can get backup device by id', async function () {
    const source = await createBackupDeviceAsync()
    expect(source.path).toEqual('c:/test')
  })

  it('can create a source device', async () => {
    const { id } = await createSourceDeviceAsync()
    const sources = await repo.getDevicesAsync('source')
    const source = sources[0]

    expect(id).toBeTruthy()
    expect(sources).toHaveLength(1)
    expect(source.id).toEqual(id)
    expect(source.path).toEqual('c:/test')
    expect(source.name).toEqual('name')
  })

  it('can create a backup device', async () => {
    const { id } = await createBackupDeviceAsync()
    const devices = await repo.getDevicesAsync('backup')
    const aDevice = devices[0]

    expect(id).toBeTruthy()
    expect(devices).toHaveLength(1)
    expect(aDevice.id).toEqual(id)
    expect(aDevice.path).toEqual('c:/test')
    expect(aDevice.name).toEqual('name')
  })

  it('getSourceFilesToBackupAsync', async function () {
    const sourceFile = await createSourceFileAsync()
    const files = await repo.getSourceFilesToBackupAsync(sourceFile.deviceId)
    expect(project(['id', 'relativePath'], files)).toMatchInlineSnapshot(`
Array [
  Object {
    "id": "id",
    "relativePath": "c:/folder/file.txt",
  },
]
`)
  })

  it('should find similar files', async function () {
    const sourceFile = await createSourceFileAsync()

    const sameFile = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'file.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

    const differentFilenameResult = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'somefile.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

    const differentCaseResult = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'FILE.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

    const differentSize = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, 999, 'file.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

    const differentMtime = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'file.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs + 100)

    const differentBirthTime = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'file.txt', sourceFile.birthtimeMs + 100, sourceFile.mtimeMs)

    expect(sameFile.length).toBe(1)
    expect(differentFilenameResult.length).toBe(0)
    expect(differentCaseResult.length).toBe(1)
    expect(differentSize.length).toBe(0)
    expect(differentMtime.length).toBe(0)
    expect(differentBirthTime.length).toBe(0)
  })

  it('can check a source file exists or not by id', async function () {
    const sourceFile = await createSourceFileAsync()

    const exists = await repo.getFileExistsAsync(sourceFile.id)
    const doesNotExist = await repo.getFileExistsAsync('invalid id')

    expect(exists).toEqual(true)
    expect(doesNotExist).toEqual(false)
  })

  it('can load a source file by id', async function () {
    const sourceFile = await createSourceFileAsync()

    const file = await repo.getFileByIdAsync(sourceFile.id)
    const doesNotExistFile = await repo.getFileByIdAsync('an invalid id')
    expect(file.editDate).toBeGreaterThan(0)

    expect(doesNotExistFile).toBeUndefined()
    delete file.editDate
    expect(file).toEqual(sourceFile)
  })

  it('can delete and undelete a source file', async function () {
    const sourceFile = await createSourceFileAsync()
    const sourceFileVersions = [sourceFile]

    await repo.deleteFileAsync(sourceFile.id)
    sourceFileVersions.push(await repo.getFileByIdAsync(sourceFile.id))

    await repo.unDeleteFileAsyc(sourceFile.id)

    sourceFileVersions.push(await repo.getFileByIdAsync(sourceFile.id))

    expect(sourceFileVersions[0].deleted).toBe(false)
    expect(sourceFileVersions[1].deleted).toBe(true)
    expect(sourceFileVersions[2].deleted).toBe(false)
  })

  it('can delete a source device', async () => {
    const sourceFile = await createSourceFileAsync()
    await repo.deleteDeviceAsync(sourceFile.deviceId)
    const source = await repo.getDeviceByIdAsync(sourceFile.deviceId)
    const deletedSourceFile = await repo.getFileByIdAsync(sourceFile.id)

    expect(source).toBeUndefined()
    expect(deletedSourceFile).toBeUndefined()
  })

  it('can delete a backup device', async () => {
    const file = await createBackupFileAsync()
    await repo.deleteDeviceAsync(file.deviceId)
    const device = await repo.getDeviceByIdAsync(file.deviceId)
    const deletedFile = await repo.getFileByIdAsync(file.id)

    expect(device).toBeUndefined()
    expect(deletedFile).toBeUndefined()
  })
})

async function createSourceFileAsync () {
  const source = await createSourceDeviceAsync()
  const sourceFile = {
    addDate: 123,
    birthtimeMs: 456,
    deleted: false,
    deviceId: source.id,
    deviceType: 'source',
    hash: 'hash',
    id: 'id',
    mtimeMs: 789,
    relativePath: 'c:/folder/file.txt',
    size: 101112
  }
  await repo.addFileAsync(sourceFile)
  return sourceFile
}

async function createBackupFileAsync () {
  const source = await createBackupDeviceAsync()
  const file = {
    addDate: 123,
    birthtimeMs: 456,
    deleted: false,
    deviceId: source.id,
    deviceType: 'backup',
    hash: 'hash',
    id: 'id',
    mtimeMs: 789,
    relativePath: 'relativePath',
    size: 101112
  }
  await repo.addFileAsync(file)
  return file
}

async function createSourceDeviceAsync () {
  const { id } = await repo.addDeviceAsync({
    id: 'deviceId',
    deviceType: 'source',
    path: 'c:/test',
    name: 'name',
    description: 'description'
  })

  return await repo.getDeviceByIdAsync(id)
}

async function createBackupDeviceAsync () {
  const { id } = await repo.addDeviceAsync({
    id: 'deviceId',
    deviceType: 'backup',
    path: 'c:/test',
    name: 'name',
    description: 'description'
  })

  return await repo.getDeviceByIdAsync(id)
}
