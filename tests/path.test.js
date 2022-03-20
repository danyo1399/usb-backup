const testUtils = require('./common')
const path = require('path')
const { currentPath, getRelativePath, appendSuffixToFilename, findUniqueFilenameAsync } = require('../src/path')

describe('path tests', () => {
  describe('environment required tests', function () {
    const env = testUtils.setupTestEnvironment()
    it('has path set', () => {
      expect(currentPath.endsWith('usb-backup')).toBe(true)
    })

    describe('find unique filename tests', function () {
      it('generates unique filename where filename does not exist exists', async function () {
        const result = await findUniqueFilenameAsync(path.join(env.tempPath, 'test.txt'))
        expect(result).toBe(path.join(env.tempPath, 'test.txt'))
      })

      it('generates unique filename where filename exists', async function () {
        const filename = await env.createDummyFile('test.txt')
        const result = await findUniqueFilenameAsync(filename)
        expect(result).toBe(path.join(env.tempPath, 'test 001.txt'))
      })

      it('generates unique filename where multiple filenames exists', async function () {
        const filename = await env.createDummyFile('test.txt')
        await env.createDummyFile('test 001.txt')
        const result = await findUniqueFilenameAsync(filename)
        expect(result).toBe(path.join(env.tempPath, 'test 002.txt'))
      })
    })
  })

  it('modify filename tests', async function () {
    expect(appendSuffixToFilename('test', '1')).toBe('test1')
    expect(appendSuffixToFilename('test.txt', '1')).toBe('test1.txt')

    expect(appendSuffixToFilename('c:\\test.txt', '1')).toBe('c:\\test1.txt')
    expect(appendSuffixToFilename('/test.txt', '1')).toBe('/test1.txt')
    expect(appendSuffixToFilename('/folder/test.txt', '1')).toBe('/folder/test1.txt')
    expect(appendSuffixToFilename('c:\\folder.ext\\test.txt', '1')).toBe('c:\\folder.ext\\test1.txt')
  })

  it('calculate relatiev path from two paths', function () {
    expect(getRelativePath({ basePath: 'c:\\test\\test2\\', filePath: 'c:/test/test2/file.txt' })).toEqual('file.txt')

    expect(getRelativePath({ basePath: 'c:\\test\\test2', filePath: 'c:/test/test2/file.txt' })).toEqual('file.txt')

    expect(getRelativePath({ basePath: 'c:\\test\\', filePath: 'c:/test/test2/file.txt' })).toEqual('test2/file.txt')

    expect(getRelativePath({ basePath: 'c:\\test', filePath: 'c:/test/test2/file.txt' })).toEqual('test2/file.txt')

    expect(getRelativePath({ basePath: 'c:\\', filePath: 'c:/test/test2/file.txt' })).toEqual('test/test2/file.txt')

    expect(getRelativePath({ basePath: '/test/test2/', filePath: '/test/test2/file.txt' })).toEqual('file.txt')

    expect(getRelativePath({ basePath: '/test/test2', filePath: '/test/test2/file.txt' })).toEqual('file.txt')

    expect(getRelativePath({ basePath: '/test', filePath: '/test/test2/file.txt' })).toEqual('test2/file.txt')

    expect(getRelativePath({ basePath: '/test/', filePath: '/test/test2/file.txt' })).toEqual('test2/file.txt')

    expect(getRelativePath({ basePath: '/', filePath: '/test/test2/file.txt' })).toEqual('test/test2/file.txt')

    expect(() => {
      getRelativePath('/differentroot', '/test/test2/file.txt')
    }).toThrowError()
  })
})
