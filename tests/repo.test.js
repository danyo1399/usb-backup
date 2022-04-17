const { project } = require('../src/utils')
const repo = require('../src/repo')
const { setupTestEnvironment } = require('./common')

describe('repo tests', () => {
  const env = setupTestEnvironment()
  env.setupDb()

  describe('device tests', function () {
    it('can update space info', async function () {
      const device = await createSourceDeviceAsync()

      await repo.updateDeviceInfo(device.id, 123, 456)

      const reloadedDevice = await repo.getDeviceByIdAsync(device.id)

      expect(reloadedDevice.freeSpace).toBe(123)
      expect(reloadedDevice.totalSpace).toBe(456)
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
  })

  it('returns the source file to backup when file has not been backed up', async function () {
    const sourceFile = await createSourceFileAsync()
    const files = await repo.getSourceFilesToBackupAsync(sourceFile.deviceId)
    expect(files).toMatchInlineSnapshot(`
Array [
  Object {
    "addDate": 123,
    "birthtimeMs": 456,
    "deleted": 0,
    "deviceId": "deviceId",
    "deviceType": "source",
    "editDate": ${sourceFile.editDate},
    "hash": "hash",
    "id": 1,
    "mtimeMs": 789,
    "relativePath": "c:/folder/file.txt",
    "size": 101112,
  },
]
`)
  })

  it('should find similar files', async function () {
    const sourceFile = await createSourceFileAsync()

    const sameFile = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'file.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

    const differentFilenameResult = await repo.findSimilarFilesAsync(
      sourceFile.deviceId, sourceFile.size, 'some-file.txt', sourceFile.birthtimeMs, sourceFile.mtimeMs)

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

    const exists = await repo.getFileByFingerprintAsync(
      sourceFile.deviceId, sourceFile.relativePath, sourceFile)
    const file = await repo.getFileByFingerprintAsync(
      sourceFile.deviceId, sourceFile.relativePath, { ...sourceFile, mtimeMs: 1234 })

    expect(exists).toEqual(sourceFile)
    expect(file).toBeUndefined()
  })

  it('returns the id of the created file that can be loaded by id', async function () {
    const sourceFile = await createSourceFileAsync()

    const file = await repo.getFileByIdAsync(sourceFile.id)

    expect(file.editDate).toBeGreaterThan(0)

    expect(file).toEqual(sourceFile)
  })

  it('returns undefined when loading file by id and the file does not exist', async function () {
    const doesNotExistFile = await repo.getFileByIdAsync('an invalid id')
    expect(doesNotExistFile).toBeUndefined()
  })

  it('can delete a source file', async function () {
    const sourceFile = await createSourceFileAsync()

    await repo.deleteFileAsync(sourceFile.id)
    const file = await repo.getFileByIdAsync(sourceFile.id, { includeDeleted: true })

    expect(file.deleted).toBe(1)
    expect(file.editDate).toBeGreaterThan(sourceFile.editDate)
  })

  it('marks existing file at path as deleted before inserting new record', async function () {
    const file = createFile('dev', 'source')
    await repo.InsertFileAsync(file)
    file.hash = 'new-hash'
    await repo.InsertFileAsync(file)

    const files = await repo.getFilesByDeviceAsync('dev', { includeDeleted: true })
    expect(project(['deleted', 'relativePath'], files)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 1,
    "relativePath": "c:/folder/file.txt",
  },
  Object {
    "deleted": 0,
    "relativePath": "c:/folder/file.txt",
  },
]
`)
  })
})

function createFile (deviceId, deviceType) {
  return {
    addDate: 123,
    birthtimeMs: 456,
    deleted: 0,
    deviceId,
    deviceType,
    hash: 'hash',
    mtimeMs: 789,
    relativePath: 'c:/folder/file.txt',
    size: 101112
  }
}

async function createSourceFileAsync () {
  const source = await createSourceDeviceAsync()
  const sourceFile = createFile(source.id, 'source')
  const newFile = await repo.InsertFileAsync(sourceFile)
  sourceFile.editDate = newFile.editDate
  sourceFile.id = newFile.id
  return sourceFile
}

async function createBackupFileAsync () {
  const source = await createBackupDeviceAsync()
  const file = {
    addDate: 123,
    birthtimeMs: 456,
    deleted: 0,
    deviceId: source.id,
    deviceType: 'backup',
    hash: 'hash',
    id: 'id',
    mtimeMs: 789,
    relativePath: 'relativePath',
    size: 101112
  }
  await repo.InsertFileAsync(file)
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
