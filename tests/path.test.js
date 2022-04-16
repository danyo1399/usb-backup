const testUtils = require('./common')
const {
  currentPath,
  getFileRelativePath,
  appendSuffixToFilename,
  findUniqueFilenameAsync,
  appendFilePathToPath,
  joinPaths
} = require('../src/path')

describe('path tests', () => {
  describe('environment required tests', function () {
    const env = testUtils.setupTestEnvironment()
    it('has path set', () => {
      expect(currentPath.endsWith('usb-backup')).toBe(true)
    })

    describe('find unique filename tests', function () {
      it('generates unique filename where filename does not exist exists', async function () {
        const result = await findUniqueFilenameAsync(joinPaths(env.tempPath, 'test.txt'))
        expect(result).toBe(joinPaths(env.tempPath, 'test.txt'))
      })

      it('generates unique filename where filename exists', async function () {
        const filename = await env.createDummyFileAsync('test.txt')
        const result = await findUniqueFilenameAsync(filename)
        expect(result).toBe(joinPaths(env.tempPath, 'test 001.txt'))
      })

      it('generates unique filename where multiple filenames exists', async function () {
        const filename = await env.createDummyFileAsync('test.txt')
        await env.createDummyFileAsync('test 001.txt')
        const result = await findUniqueFilenameAsync(filename)
        expect(result).toBe(joinPaths(env.tempPath, 'test 002.txt'))
      })
    })
  })

  it('should append file path to target path', async function () {
    expect(appendFilePathToPath('c:\\test.txt', 'd:/')).toBe('d:/test.txt')
    expect(appendFilePathToPath('c:\\test.txt', 'd:\\')).toBe('d:/test.txt')
    expect(appendFilePathToPath('/test.txt', 'd:\\')).toBe('d:/test.txt')
    expect(appendFilePathToPath('c:/test.txt', 'd:\\')).toBe('d:/test.txt')

    expect(appendFilePathToPath('c:\\s1\\test.txt', 'd:\\')).toBe('d:/s1/test.txt')
    expect(appendFilePathToPath('c:/s1/test.txt', 'd:/')).toBe('d:/s1/test.txt')
    expect(appendFilePathToPath('/s1/test.txt', 'd:/')).toBe('d:/s1/test.txt')
    expect(appendFilePathToPath('//someserver/s1/test.txt', 'd:/')).toBe('d:/s1/test.txt')
    expect(appendFilePathToPath('\\\\someserver\\s1\\test.txt', 'd:\\')).toBe('d:/s1/test.txt')

    expect(appendFilePathToPath('c:\\s1\\test.txt', 'd:\\d1')).toBe('d:/d1/s1/test.txt')
    expect(appendFilePathToPath('c:/s1/test.txt', 'd:/d1')).toBe('d:/d1/s1/test.txt')
    expect(appendFilePathToPath('/s1/test.txt', 'd:/d1')).toBe('d:/d1/s1/test.txt')
    expect(appendFilePathToPath('\\\\server\\s1\\test.txt', 'd:\\d1')).toBe('d:/d1/s1/test.txt')
    expect(appendFilePathToPath('//server/s1/test.txt', 'd:\\d1')).toBe('d:/d1/s1/test.txt')

    expect(appendFilePathToPath('/test.txt', '/')).toBe('/test.txt')
    expect(appendFilePathToPath('/test.txt', '/d1')).toBe('/d1/test.txt')
    expect(appendFilePathToPath('/s1/test.txt', '/d1')).toBe('/d1/s1/test.txt')
    expect(appendFilePathToPath('/s1/test.txt', '/d1/')).toBe('/d1/s1/test.txt')
  })

  it('modify filename tests', async function () {
    expect(appendSuffixToFilename('test', '1')).toBe('test1')
    expect(appendSuffixToFilename('test.txt', '1')).toBe('test1.txt')

    expect(appendSuffixToFilename('c:\\test.txt', '1')).toBe('c:\\test1.txt')
    expect(appendSuffixToFilename('/test.txt', '1')).toBe('/test1.txt')
    expect(appendSuffixToFilename('/folder/test.txt', '1')).toBe('/folder/test1.txt')
    expect(appendSuffixToFilename('c:\\folder.ext\\test.txt', '1')).toBe('c:\\folder.ext\\test1.txt')
  })

  it('calculate relative path from two paths', function () {
    expect(getFileRelativePath('c:\\test\\test2\\', 'c:/test/test2/file.txt')).toEqual('file.txt')

    expect(getFileRelativePath('c:\\test\\test2', 'c:/test/test2/file.txt')).toEqual('file.txt')

    expect(getFileRelativePath('c:\\test\\', 'c:/test/test2/file.txt')).toEqual('test2/file.txt')

    expect(getFileRelativePath('c:\\test', 'c:/test/test2/file.txt')).toEqual('test2/file.txt')

    expect(getFileRelativePath('c:\\', 'c:/test/test2/file.txt')).toEqual('test/test2/file.txt')

    expect(getFileRelativePath('/test/test2/', '/test/test2/file.txt')).toEqual('file.txt')

    expect(getFileRelativePath('/test/test2', '/test/test2/file.txt')).toEqual('file.txt')

    expect(getFileRelativePath('/test', '/test/test2/file.txt')).toEqual('test2/file.txt')

    expect(getFileRelativePath('/test/', '/test/test2/file.txt')).toEqual('test2/file.txt')

    expect(getFileRelativePath('/', '/test/test2/file.txt')).toEqual('test/test2/file.txt')

    expect(() => {
      getFileRelativePath('/different-root', '/test/test2/file.txt')
    }).toThrowError()
  })
})
